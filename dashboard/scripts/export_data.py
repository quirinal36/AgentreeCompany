#!/usr/bin/env python3
"""hermes kanban.db → site/data.json 내보내기.

대시보드(site/index.html)가 소비하는 정적 스냅샷을 생성한다.
사용법:
    python3 export_data.py [--db ~/.hermes/kanban.db] [--out ../site/data.json]
"""
import argparse
import hashlib
import json
import os
import re
import shutil
import sqlite3
import sys
import time

TASK_FIELDS = (
    "id", "title", "body", "assignee", "status", "priority", "created_by",
    "created_at", "started_at", "completed_at", "result",
    "last_failure_error", "consecutive_failures", "goal_mode",
)
RUN_FIELDS = (
    "id", "task_id", "profile", "step_key", "status", "outcome",
    "started_at", "ended_at", "summary", "error",
)

# 산출물 수집 대상 팀 폴더 (폴더 → 기본 담당 프로필)
TEAM_DIRS = {
    "RND_Team": "nana",
    "BlogTeam": "green",
    "DesignTeam": "blue",
}
COMPANY_ROOT = os.path.expanduser("~/Documents/AgentreeCompany")

ARTIFACT_TYPES = {
    ".png": "image", ".jpg": "image", ".jpeg": "image", ".webp": "image",
    ".gif": "image", ".svg": "image",
    ".mp4": "video", ".webm": "video", ".m4v": "video",
    ".md": "markdown", ".txt": "markdown",
    ".csv": "csv",
    ".pdf": "link", ".html": "link",
}
MAX_ARTIFACT_BYTES = 95 * 1024 * 1024  # Netlify 파일 상한(100MB) 이하로 제한
# 확장자 뒤 경계: ASCII 단어문자가 아니어야 함 (\b 는 한글 조사가 바로 붙으면 매치 실패)
PATH_RE = re.compile(r"/home/\S+?\.(?:png|jpe?g|webp|gif|svg|mp4|webm|m4v|md|txt|csv|pdf|html)(?![A-Za-z0-9_])")
EXCLUDE_NAMES = {"AGENTS.md", "README.md", "CLAUDE.md"}


def rows(con, sql, params=()):
    cur = con.execute(sql, params)
    cols = [c[0] for c in cur.description]
    return [dict(zip(cols, r)) for r in cur.fetchall()]


def export(db_path, out_path):
    con = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)

    tasks = rows(con, f"SELECT {', '.join(TASK_FIELDS)} FROM tasks ORDER BY created_at")
    runs = rows(con, f"SELECT {', '.join(RUN_FIELDS)} FROM task_runs ORDER BY started_at")
    links = rows(con, "SELECT parent_id, child_id FROM task_links")
    comments = rows(
        con,
        "SELECT task_id, author, body, created_at FROM task_comments ORDER BY created_at",
    )

    # 이벤트: heartbeat 는 payload 에 note 가 있는 것만 유지 (빈 heartbeat 는 노이즈)
    events = []
    for ev in rows(
        con,
        "SELECT task_id, run_id, kind, payload, created_at FROM task_events ORDER BY created_at",
    ):
        payload = ev.get("payload") or ""
        note = None
        if payload:
            try:
                parsed = json.loads(payload)
                if isinstance(parsed, dict):
                    note = parsed.get("note") or parsed.get("reason") or parsed.get("message")
                    if note is None and parsed:
                        note = json.dumps(parsed, ensure_ascii=False)
                else:
                    note = str(parsed)
            except (json.JSONDecodeError, ValueError):
                note = payload
        if ev["kind"] == "heartbeat" and not note:
            continue
        events.append(
            {
                "task_id": ev["task_id"],
                "run_id": ev["run_id"],
                "kind": ev["kind"],
                "note": note,
                "created_at": ev["created_at"],
            }
        )

    pipelines = build_pipelines(tasks, links)
    artifacts = collect_artifacts(con, tasks, runs, os.path.dirname(out_path))

    data = {
        "generated_at": int(time.time()),
        "tasks": tasks,
        "runs": runs,
        "links": links,
        "comments": comments,
        "events": events,
        "pipelines": pipelines,
        "artifacts": artifacts,
    }

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    tmp = out_path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
    os.replace(tmp, out_path)
    return data


def collect_artifacts(con, tasks, runs, site_dir):
    """산출물 경로를 수집해 site/assets/ 로 복사하고 메타데이터를 돌려준다.

    출처: ① completed 이벤트 payload 의 artifacts 배열
          ② 이벤트/런 요약·태스크 result 안의 절대경로 문자열
          ③ 팀 폴더(RND_Team/BlogTeam/DesignTeam) 파일 스캔
    """
    by_task = {t["id"]: t for t in tasks}
    candidates = {}  # abs path → set(task_id)

    def add(path, task_id=None):
        if not path:
            return
        path = os.path.normpath(path)
        candidates.setdefault(path, set())
        if task_id:
            candidates[path].add(task_id)

    # ①·② 이벤트 payload
    for task_id, payload in con.execute(
        "SELECT task_id, payload FROM task_events WHERE payload != ''"
    ):
        try:
            parsed = json.loads(payload)
        except (json.JSONDecodeError, ValueError):
            parsed = None
        if isinstance(parsed, dict):
            arts = parsed.get("artifacts")
            if isinstance(arts, list):
                for a in arts:
                    if isinstance(a, str):
                        add(a, task_id)
            for m in PATH_RE.findall(str(parsed.get("summary") or "")):
                add(m, task_id)
        else:
            for m in PATH_RE.findall(payload):
                add(m, task_id)

    # ② 런 요약 / 태스크 result
    for r in runs:
        for m in PATH_RE.findall(r.get("summary") or ""):
            add(m, r["task_id"])
    for t in tasks:
        for m in PATH_RE.findall(t.get("result") or ""):
            add(m, t["id"])

    # ③ 팀 폴더 스캔
    for folder in TEAM_DIRS:
        d = os.path.join(COMPANY_ROOT, folder)
        if not os.path.isdir(d):
            continue
        for name in os.listdir(d):
            if name.startswith(".") or name in EXCLUDE_NAMES:
                continue
            add(os.path.join(d, name))

    assets_dir = os.path.join(site_dir, "assets")
    shutil.rmtree(assets_dir, ignore_errors=True)
    os.makedirs(assets_dir, exist_ok=True)

    artifacts = []
    skipped = []
    for path, task_ids in candidates.items():
        ext = os.path.splitext(path)[1].lower()
        atype = ARTIFACT_TYPES.get(ext)
        if atype is None or not os.path.isfile(path):
            continue
        size = os.path.getsize(path)
        if size > MAX_ARTIFACT_BYTES:
            skipped.append(path)
            continue
        aid = hashlib.sha1(path.encode("utf-8")).hexdigest()[:10]
        safe_name = os.path.basename(path).replace(os.sep, "_")
        rel = f"assets/{aid}-{safe_name}"
        try:
            shutil.copy2(path, os.path.join(site_dir, rel))
        except OSError as e:
            print(f"warn: copy failed {path}: {e}", file=sys.stderr)
            continue

        team = None
        for folder, profile in TEAM_DIRS.items():
            if f"/{folder}/" in path + "/":
                team = profile
                break
        ordered_ids = sorted(
            (tid for tid in task_ids if tid in by_task),
            key=lambda tid: by_task[tid]["created_at"] or 0,
        )
        if team is None and ordered_ids:
            team = by_task[ordered_ids[-1]]["assignee"]

        artifacts.append(
            {
                "id": aid,
                "name": os.path.basename(path),
                "path": path,
                "rel": rel,
                "type": atype,
                "size": size,
                "mtime": int(os.path.getmtime(path)),
                "task_ids": ordered_ids,
                "team": team,
            }
        )
    for p in skipped:
        print(f"warn: {MAX_ARTIFACT_BYTES // (1024*1024)}MB 초과로 제외: {p}", file=sys.stderr)
    artifacts.sort(key=lambda a: a["mtime"], reverse=True)
    return artifacts


def build_pipelines(tasks, links):
    """task_links 의 연결 성분(connected component)별로 파이프라인을 구성한다."""
    by_id = {t["id"]: t for t in tasks}

    # union-find
    parent = {t["id"]: t["id"] for t in tasks}

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def union(a, b):
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[ra] = rb

    children = {}
    parents = {}
    for l in links:
        p, c = l["parent_id"], l["child_id"]
        if p in by_id and c in by_id:
            union(p, c)
            children.setdefault(p, []).append(c)
            parents.setdefault(c, []).append(p)

    groups = {}
    for tid in by_id:
        groups.setdefault(find(tid), []).append(tid)

    pipelines = []
    for members in groups.values():
        members.sort(key=lambda tid: (by_id[tid]["created_at"] or 0, tid))
        # 위상 정렬에 가까운 순서: 생성 순 정렬로 충분 (파이프라인은 생성 순으로 연결됨)
        statuses = [by_id[tid]["status"] for tid in members]
        status = pipeline_status(statuses)
        starts = [by_id[tid]["started_at"] for tid in members if by_id[tid]["started_at"]]
        ends = [by_id[tid]["completed_at"] for tid in members if by_id[tid]["completed_at"]]
        all_ended = all(
            by_id[tid]["status"] in ("done", "archived") for tid in members
        )
        pipelines.append(
            {
                "id": "p_" + members[0],
                "name": pipeline_name([by_id[tid]["title"] for tid in members]),
                "task_ids": members,
                "status": status,
                "created_at": min(by_id[tid]["created_at"] or 0 for tid in members) or None,
                "started_at": min(starts) if starts else None,
                "ended_at": max(ends) if (ends and all_ended) else None,
                "stages": [
                    {
                        "task_id": tid,
                        "parents": parents.get(tid, []),
                    }
                    for tid in members
                ],
            }
        )
    pipelines.sort(key=lambda p: p["created_at"] or 0, reverse=True)
    return pipelines


def pipeline_status(statuses):
    s = set(statuses)
    if "running" in s:
        return "running"
    if "blocked" in s:
        return "blocked"
    if s & {"todo", "ready"}:
        return "waiting"
    if "done" in s:
        return "done"
    return "archived"


def pipeline_name(titles):
    """멤버 제목의 공통 접두어로 파이프라인 이름을 만든다."""
    if not titles:
        return "(이름 없음)"
    if len(titles) == 1:
        return titles[0]
    prefix = os.path.commonprefix(titles)
    prefix = prefix.strip(" -—–:·|")
    if len(prefix) >= 4:
        return prefix
    return titles[0]


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--db", default=os.path.expanduser("~/.hermes/kanban.db"))
    default_out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "site", "data.json")
    ap.add_argument("--out", default=os.path.normpath(default_out))
    args = ap.parse_args()

    if not os.path.exists(args.db):
        print(f"error: kanban DB not found: {args.db}", file=sys.stderr)
        sys.exit(1)

    data = export(args.db, args.out)
    total_bytes = sum(a["size"] for a in data["artifacts"])
    print(
        f"exported {len(data['tasks'])} tasks, {len(data['runs'])} runs, "
        f"{len(data['pipelines'])} pipelines, {len(data['events'])} events, "
        f"{len(data['artifacts'])} artifacts ({total_bytes / 1024 / 1024:.1f}MB) → {args.out}"
    )


if __name__ == "__main__":
    main()
