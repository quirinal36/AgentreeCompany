#!/usr/bin/env python3
"""hermes kanban.db → site/data.json 내보내기.

대시보드(site/index.html)가 소비하는 정적 스냅샷을 생성한다.
사용법:
    python3 export_data.py [--db ~/.hermes/kanban.db] [--out ../site/data.json]
"""
import argparse
import json
import os
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

    data = {
        "generated_at": int(time.time()),
        "tasks": tasks,
        "runs": runs,
        "links": links,
        "comments": comments,
        "events": events,
        "pipelines": pipelines,
    }

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    tmp = out_path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
    os.replace(tmp, out_path)
    return data


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
    print(
        f"exported {len(data['tasks'])} tasks, {len(data['runs'])} runs, "
        f"{len(data['pipelines'])} pipelines, {len(data['events'])} events → {args.out}"
    )


if __name__ == "__main__":
    main()
