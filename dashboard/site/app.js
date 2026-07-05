/* Agentree Operations dashboard
 * data.json(kanban.db 스냅샷)을 읽어 파이프라인 실행 히스토리/진행현황을 렌더링한다.
 * 모든 동적 텍스트는 textContent 로만 삽입한다 (innerHTML 금지).
 */
'use strict';

// ── 상수 ─────────────────────────────────────────────
const AGENTS = {
  yellow: { label: 'Yellow', emoji: '🟡', color: 'var(--agent-yellow)', role: '지휘' },
  nana:   { label: 'Nana',   emoji: '🟣', color: 'var(--agent-nana)',   role: '조사' },
  green:  { label: 'Green',  emoji: '🟢', color: 'var(--agent-green)',  role: '집필' },
  blue:   { label: 'Blue',   emoji: '🔵', color: 'var(--agent-blue)',   role: '디자인·영상' },
};
const AGENT_ORDER = ['nana', 'green', 'blue', 'yellow'];
const OTHER_AGENT = { label: '기타', emoji: '⚪', color: 'var(--agent-other)', role: '' };

const TASK_STATUS = {
  done:     { label: '완료',    icon: '✓', fg: 'var(--st-good-text)' },
  running:  { label: '실행 중', icon: '',  fg: 'var(--st-running-text)', pulse: true },
  blocked:  { label: '차단',    icon: '⚠', fg: 'var(--st-warning-text)' },
  ready:    { label: '대기',    icon: '…', fg: 'var(--muted)' },
  todo:     { label: '예정',    icon: '…', fg: 'var(--muted)' },
  archived: { label: '보관',    icon: '▪', fg: 'var(--muted)' },
};
const ACTIVE_STATUSES = new Set(['running', 'blocked', 'ready', 'todo']);

// 런 결과 시리즈 (상태 팔레트 — 고정 순서: 완료 → 차단 → 크래시)
const OUTCOMES = [
  { key: 'completed', label: '완료',   color: 'var(--st-good)' },
  { key: 'blocked',   label: '차단',   color: 'var(--st-warning)' },
  { key: 'crashed',   label: '크래시', color: 'var(--st-critical)' },
];

const EVENT_KIND_KO = {
  created: '생성', specified: '사양 갱신', promoted: '준비 전환', promoted_manual: '수동 전환',
  claimed: '할당', spawned: '워커 시작', heartbeat: '진행 노트', completed: '완료',
  crashed: '크래시', blocked: '차단', unblocked: '차단 해제', gave_up: '중단',
  archived: '보관', commented: '코멘트', tip_scratch_workspace: '워크스페이스',
};

const TZ = 'Asia/Seoul';
const DAY_MS = 86400 * 1000;

// ── 상태 ─────────────────────────────────────────────
// artifactFolder: null = 폴더(파이프라인) 목록, 'p_…' = 해당 파이프라인 산출물, '_etc' = 미연결
const state = { data: null, range: 'all', agent: 'all', openPipelines: new Set(), artifactFolder: null };

// ── DOM 헬퍼 ─────────────────────────────────────────
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}
function svgEl(tag, attrs) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs || {})) node.setAttribute(k, v);
  return node;
}
function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

// ── 포맷터 (Asia/Seoul 고정) ─────────────────────────
const fmtDayShort = new Intl.DateTimeFormat('ko-KR', { timeZone: TZ, month: 'numeric', day: 'numeric' });
const fmtDateTime = new Intl.DateTimeFormat('ko-KR', { timeZone: TZ, month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
const fmtFull = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, dateStyle: 'short', timeStyle: 'short' });
const fmtDayKey = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });

function dayKey(tsSec) { return fmtDayKey.format(new Date(tsSec * 1000)); }
function fmtTs(tsSec, formatter) { return tsSec ? (formatter || fmtDateTime).format(new Date(tsSec * 1000)) : '—'; }
function fmtDuration(sec) {
  if (sec == null || sec < 0) return '—';
  if (sec < 60) return `${Math.round(sec)}초`;
  if (sec < 3600) {
    const m = Math.floor(sec / 60), s = Math.round(sec % 60);
    return s ? `${m}분 ${s}초` : `${m}분`;
  }
  const h = Math.floor(sec / 3600), m = Math.round((sec % 3600) / 60);
  return m ? `${h}시간 ${m}분` : `${h}시간`;
}
function fmtAgo(tsSec, nowSec) {
  const d = Math.max(0, nowSec - tsSec);
  if (d < 60) return '방금 전';
  if (d < 3600) return `${Math.floor(d / 60)}분 전`;
  if (d < 86400) return `${Math.floor(d / 3600)}시간 전`;
  return `${Math.floor(d / 86400)}일 전`;
}

function agentInfo(name) { return AGENTS[name] || { ...OTHER_AGENT, label: name || '미지정' }; }

// ── 파생 데이터 ──────────────────────────────────────
function taskEndTs(task, runsByTask, generatedAt) {
  if (task.completed_at) return task.completed_at;
  if (ACTIVE_STATUSES.has(task.status)) return generatedAt;
  const runs = runsByTask.get(task.id) || [];
  const ended = runs.map((r) => r.ended_at).filter(Boolean);
  if (ended.length) return Math.max(...ended);
  return task.started_at || task.created_at || generatedAt;
}
function taskDurationSec(task, generatedAt) {
  if (!task.started_at) return null;
  if (task.completed_at) return task.completed_at - task.started_at;
  if (task.status === 'running') return generatedAt - task.started_at;
  return null;
}

function buildIndexes(data) {
  const runsByTask = new Map();
  for (const r of data.runs) {
    if (!runsByTask.has(r.task_id)) runsByTask.set(r.task_id, []);
    runsByTask.get(r.task_id).push(r);
  }
  const eventsByTask = new Map();
  for (const ev of data.events) {
    if (!eventsByTask.has(ev.task_id)) eventsByTask.set(ev.task_id, []);
    eventsByTask.get(ev.task_id).push(ev);
  }
  const commentsByTask = new Map();
  for (const c of data.comments) {
    if (!commentsByTask.has(c.task_id)) commentsByTask.set(c.task_id, []);
    commentsByTask.get(c.task_id).push(c);
  }
  const taskById = new Map(data.tasks.map((t) => [t.id, t]));
  const artifactsByTask = new Map();
  for (const a of data.artifacts || []) {
    for (const tid of a.task_ids || []) {
      if (!artifactsByTask.has(tid)) artifactsByTask.set(tid, []);
      artifactsByTask.get(tid).push(a);
    }
  }
  const pipelineById = new Map(data.pipelines.map((p) => [p.id, p]));
  const pipelineByTask = new Map();
  for (const p of data.pipelines) {
    for (const tid of p.task_ids) pipelineByTask.set(tid, p);
  }
  return { runsByTask, eventsByTask, commentsByTask, taskById, artifactsByTask, pipelineById, pipelineByTask };
}

// ── 필터 ─────────────────────────────────────────────
function rangeBounds() {
  const now = state.data.generated_at;
  if (state.range === 'all') return [null, now];
  if (state.range === 'today') {
    const key = dayKey(now);
    return [startOfDaySec(key), now];
  }
  const days = Number(state.range);
  return [now - days * 86400, now];
}
function startOfDaySec(key) {
  // key: YYYY-MM-DD (Seoul). KST 는 UTC+9 고정(DST 없음).
  return Math.floor(Date.parse(key + 'T00:00:00+09:00') / 1000);
}
function overlaps(a0, a1, b0, b1) { return a0 <= b1 && b0 <= a1; }

function getFiltered() {
  const data = state.data;
  const idx = state.idx;
  const [from, to] = rangeBounds();
  const agentOk = (name) => state.agent === 'all' || name === state.agent;

  const tasks = data.tasks.filter((t) => {
    if (!agentOk(t.assignee)) return false;
    if (from == null) return true;
    const start = t.created_at || 0;
    const end = taskEndTs(t, idx.runsByTask, data.generated_at);
    return overlaps(start, end, from, to);
  });
  const taskIds = new Set(tasks.map((t) => t.id));

  const runs = data.runs.filter((r) => {
    if (!agentOk(r.profile)) return false;
    const ts = r.ended_at || r.started_at;
    if (from != null && (ts == null || ts < from || ts > to)) return false;
    return true;
  });

  const pipelines = data.pipelines.filter((p) => p.task_ids.some((id) => taskIds.has(id)));

  const artifacts = (data.artifacts || []).filter((a) => {
    if (!agentOk(a.team)) return false;
    if (from == null) return true;
    if (a.mtime >= from && a.mtime <= to) return true;
    return (a.task_ids || []).some((id) => taskIds.has(id));
  });
  return { tasks, taskIds, runs, pipelines, artifacts, from, to };
}

// ── 산출물 ───────────────────────────────────────────
function fmtBytes(n) {
  if (n == null) return '';
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))}KB`;
  return `${(n / 1024 / 1024).toFixed(1)}MB`;
}
const DOC_ICONS = { markdown: '📄', csv: '🗒️', link: '🔗' };

function artifactTaskTitle(a) {
  const ids = a.task_ids || [];
  if (!ids.length) return null;
  const t = state.idx.taskById.get(ids[ids.length - 1]);
  return t ? t.title : null;
}

// ── 마크다운 → DOM 렌더러 ────────────────────────────
// innerHTML 을 쓰지 않고 createElement 로만 노드를 만든다 (XSS 안전 · 상단 규칙 준수).
// 지원: 헤딩, 문단, 목록(중첩), GFM 표(정렬), 코드펜스/인라인코드, 인용, 수평선,
//       굵게/기울임/취소선, 링크·이미지·자동링크, YAML front matter.
function mdResolveUrl(url, base) {
  const u = String(url == null ? '' : url).trim();
  if (!u) return u;
  if (/^[a-z][a-z0-9+.-]*:/i.test(u) || u.startsWith('//') || u.startsWith('/') || u.startsWith('#')) return u;
  return (base || '') + u; // md 파일 기준 상대경로 → 사이트 경로로 보정
}
function mdSafeUrl(url) {
  const u = String(url).trim();
  if (/^\s*(javascript:|vbscript:|data:text\/html)/i.test(u)) return null;
  return u;
}
const MD_INLINE = [
  { kind: 'fnref', re: /(\d+)/ }, // 인라인 각주 플레이스홀더 (renderMarkdown 이 심음)
  { kind: 'code', re: /`([^`]+)`/ },
  { kind: 'image', re: /!\[([^\]]*)\]\(\s*([^)\s]+)(?:\s+"[^"]*")?\s*\)/ },
  { kind: 'link', re: /\[([^\]]+)\]\(\s*([^)\s]+)(?:\s+"[^"]*")?\s*\)/ },
  { kind: 'strong', re: /\*\*([^*]+?)\*\*/ },
  { kind: 'strong', re: /__([^_]+?)__/ },
  { kind: 'del', re: /~~([^~]+?)~~/ },
  { kind: 'em', re: /(?<![\w*])\*([^*\n]+?)\*(?![\w*])/ },
  { kind: 'em', re: /(?<![\w_])_([^_\n]+?)_(?![\w_])/ },
  { kind: 'autolink', re: /(https?:\/\/[^\s<)\]]+)/ },
];
function mdInline(text, base) {
  const frag = document.createDocumentFragment();
  let rest = String(text);
  while (rest) {
    let best = null;
    for (const p of MD_INLINE) {
      const m = p.re.exec(rest);
      if (m && m[0] && (best === null || m.index < best.m.index)) best = { p, m };
    }
    if (!best) { frag.appendChild(document.createTextNode(rest)); break; }
    const { p, m } = best;
    if (m.index > 0) frag.appendChild(document.createTextNode(rest.slice(0, m.index)));
    frag.appendChild(mdInlineNode(p.kind, m, base));
    rest = rest.slice(m.index + m[0].length);
  }
  return frag;
}
function mdInlineNode(kind, m, base) {
  if (kind === 'fnref') return el('sup', 'md-fnref', m[1]);
  if (kind === 'code') return el('code', null, m[1]);
  if (kind === 'strong' || kind === 'em' || kind === 'del') {
    const tag = kind === 'strong' ? 'strong' : kind === 'em' ? 'em' : 'del';
    const n = document.createElement(tag);
    n.appendChild(mdInline(m[1], base));
    return n;
  }
  if (kind === 'image') {
    const img = document.createElement('img');
    img.src = mdResolveUrl(m[2], base); img.alt = m[1] || ''; img.loading = 'lazy';
    return img;
  }
  // link / autolink
  const rawHref = kind === 'link' ? m[2] : m[1];
  const label = kind === 'link' ? m[1] : m[1];
  const href = mdSafeUrl(mdResolveUrl(rawHref, base));
  if (!href) return document.createTextNode(label);
  const a = document.createElement('a');
  a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer';
  if (kind === 'link') a.appendChild(mdInline(label, base)); else a.textContent = label;
  return a;
}
function mdSplitRow(row) {
  let s = row.trim().replace(/^\|/, '').replace(/\|$/, '');
  const cells = []; let cur = '';
  for (let k = 0; k < s.length; k++) {
    if (s[k] === '\\' && s[k + 1] === '|') { cur += '|'; k++; continue; }
    if (s[k] === '|') { cells.push(cur); cur = ''; continue; }
    cur += s[k];
  }
  cells.push(cur);
  return cells.map((c) => c.trim());
}
function mdIsTableSep(line) {
  return !!line && line.includes('-') && /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(line);
}
function mdIsBlockStart(line, next) {
  if (line == null) return false;
  return /^\s*#{1,6}\s+/.test(line)
    || /^\s*(```+|~~~+)/.test(line)
    || /^\s*([-*_])(\s*\1){2,}\s*$/.test(line)
    || /^\s*>/.test(line)
    || /^\s*([-*+]|\d+\.)\s+/.test(line)
    || (line.includes('|') && mdIsTableSep(next));
}
function mdTable(lines, start, base) {
  const header = mdSplitRow(lines[start]);
  const aligns = mdSplitRow(lines[start + 1]).map((spec) => {
    const l = spec.startsWith(':'), r = spec.endsWith(':');
    return l && r ? 'center' : r ? 'right' : l ? 'left' : '';
  });
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const htr = document.createElement('tr');
  header.forEach((c, idx) => {
    const th = document.createElement('th');
    if (aligns[idx]) th.style.textAlign = aligns[idx];
    th.appendChild(mdInline(c, base));
    htr.appendChild(th);
  });
  thead.appendChild(htr); table.appendChild(thead);
  const tbody = document.createElement('tbody');
  let i = start + 2;
  for (; i < lines.length && lines[i].trim() && lines[i].includes('|'); i++) {
    const cells = mdSplitRow(lines[i]);
    const tr = document.createElement('tr');
    for (let idx = 0; idx < header.length; idx++) {
      const td = document.createElement('td');
      if (aligns[idx]) td.style.textAlign = aligns[idx];
      td.appendChild(mdInline(cells[idx] || '', base));
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  const wrap = el('div', 'md-table-wrap');
  wrap.appendChild(table);
  return { node: wrap, next: i };
}
function mdList(lines, start, base) {
  const first = lines[start].match(/^(\s*)([-*+]|\d+\.)\s+/);
  const baseIndent = first[1].length;
  const ordered = /\d+\./.test(first[2]);
  const list = document.createElement(ordered ? 'ol' : 'ul');
  let i = start;
  while (i < lines.length) {
    if (!lines[i].trim()) {
      if (i + 1 < lines.length && /^(\s*)([-*+]|\d+\.)\s+/.test(lines[i + 1])) { i++; continue; }
      break;
    }
    const m = lines[i].match(/^(\s*)([-*+]|\d+\.)\s+(.*)$/);
    if (!m) break;
    const indent = m[1].length;
    if (indent < baseIndent) break;
    if (indent > baseIndent) {
      const sub = mdList(lines, i, base);
      (list.lastElementChild || list).appendChild(sub.node);
      i = sub.next; continue;
    }
    const li = document.createElement('li');
    li.appendChild(mdInline(m[3], base));
    list.appendChild(li);
    i++;
  }
  return { node: list, next: i };
}
function mdFrontMatter(fmLines) {
  const dl = document.createElement('dl');
  for (const raw of fmLines) {
    const m = raw.match(/^([A-Za-z0-9_.-]+)\s*:\s*(.*)$/);
    if (!m || !m[2].trim()) continue;
    dl.appendChild(el('dt', null, m[1]));
    dl.appendChild(el('dd', null, m[2].trim().replace(/^["']|["']$/g, '')));
  }
  if (!dl.childNodes.length) return document.createDocumentFragment();
  const wrap = el('div', 'md-frontmatter');
  wrap.appendChild(dl);
  return wrap;
}
// 최상위 진입점: pandoc식 인라인 각주 ^[...] 를 뽑아 위첨자 번호로 바꾸고
// 본문 끝에 "출처" 목록으로 모은다. 그 뒤 블록 파싱(mdBlocks)에 넘긴다.
function renderMarkdown(text, base) {
  const notes = [];
  const prepared = String(text).replace(/\^\[([^\]]+)\]/g, (_, inner) => {
    notes.push(inner.trim());
    return '' + notes.length + '';
  });
  const frag = mdBlocks(prepared, base);
  if (notes.length) {
    const sec = el('section', 'md-footnotes');
    sec.appendChild(document.createElement('hr'));
    sec.appendChild(el('div', 'md-fn-title', '출처'));
    const ol = document.createElement('ol');
    notes.forEach((n) => {
      const li = document.createElement('li');
      li.appendChild(mdInline(n, base));
      ol.appendChild(li);
    });
    sec.appendChild(ol);
    frag.appendChild(sec);
  }
  return frag;
}
function mdBlocks(text, base) {
  const root = document.createDocumentFragment();
  const lines = String(text).replace(/\r\n?/g, '\n').split('\n');
  let i = 0;
  if (lines[0] === '---') { // YAML front matter
    let j = 1;
    while (j < lines.length && lines[j] !== '---') j++;
    if (j < lines.length) { root.appendChild(mdFrontMatter(lines.slice(1, j))); i = j + 1; }
  }
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    const fence = line.match(/^\s*(```+|~~~+)/);
    if (fence) {
      const marker = fence[1][0];
      const closeRe = new RegExp('^\\s*\\' + marker + '{3,}\\s*$');
      const buf = []; i++;
      while (i < lines.length && !closeRe.test(lines[i])) { buf.push(lines[i]); i++; }
      i++;
      const pre = document.createElement('pre');
      const code = el('code', null, buf.join('\n'));
      pre.appendChild(code); root.appendChild(pre);
      continue;
    }
    const h = line.match(/^\s*(#{1,6})\s+(.*)$/);
    if (h) {
      const head = document.createElement('h' + h[1].length);
      head.appendChild(mdInline(h[2].replace(/\s+#+\s*$/, ''), base));
      root.appendChild(head); i++; continue;
    }
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) {
      root.appendChild(document.createElement('hr')); i++; continue;
    }
    if (/^\s*>/.test(line)) {
      const buf = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) { buf.push(lines[i].replace(/^\s*>\s?/, '')); i++; }
      const bq = document.createElement('blockquote');
      bq.appendChild(mdBlocks(buf.join('\n'), base));
      root.appendChild(bq); continue;
    }
    if (line.includes('|') && mdIsTableSep(lines[i + 1])) {
      const t = mdTable(lines, i, base);
      root.appendChild(t.node); i = t.next; continue;
    }
    if (/^\s*([-*+]|\d+\.)\s+/.test(line)) {
      const l = mdList(lines, i, base);
      root.appendChild(l.node); i = l.next; continue;
    }
    const buf = [];
    while (i < lines.length && lines[i].trim() && !mdIsBlockStart(lines[i], lines[i + 1])) { buf.push(lines[i]); i++; }
    const p = document.createElement('p');
    buf.forEach((ln, idx) => {
      if (idx > 0) p.appendChild(document.createElement('br'));
      p.appendChild(mdInline(ln, base));
    });
    root.appendChild(p);
  }
  return root;
}

function openArtifact(a) {
  if (a.type === 'link') {
    window.open(a.rel, '_blank', 'noopener');
    return;
  }
  const body = document.getElementById('viewer-body');
  const caption = document.getElementById('viewer-caption');
  clear(body);
  clear(caption);
  if (a.type === 'image') {
    const img = document.createElement('img');
    img.src = a.rel;
    img.alt = a.name;
    body.appendChild(img);
  } else if (a.type === 'video') {
    const video = document.createElement('video');
    video.src = a.rel;
    video.controls = true;
    video.autoplay = true;
    body.appendChild(video);
  } else if (a.type === 'markdown') {
    const doc = el('div', 'doc-view md');
    doc.appendChild(el('div', 'doc-loading', '불러오는 중…'));
    body.appendChild(doc);
    const base = a.rel.replace(/[^/]*$/, ''); // md 파일이 있는 디렉터리 (상대 링크·이미지 기준)
    fetch(a.rel)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.text(); })
      .then((text) => { clear(doc); doc.appendChild(renderMarkdown(text, base)); })
      .catch((e) => { clear(doc); doc.textContent = `파일을 불러오지 못했습니다 (${e.message})`; });
  } else {
    const doc = el('div', 'doc-view' + (a.type === 'csv' ? ' csv' : ''));
    doc.textContent = '불러오는 중…';
    body.appendChild(doc);
    fetch(a.rel)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.text(); })
      .then((text) => { doc.textContent = text; })
      .catch((e) => { doc.textContent = `파일을 불러오지 못했습니다 (${e.message})`; });
  }
  const bits = [a.name, fmtBytes(a.size), fmtTs(a.mtime)];
  const title = artifactTaskTitle(a);
  if (title) bits.push(title);
  caption.textContent = bits.filter(Boolean).join(' · ');
  const viewer = document.getElementById('viewer');
  viewer.hidden = false;
  document.getElementById('viewer-close').focus();
}
function closeViewer() {
  const viewer = document.getElementById('viewer');
  if (viewer.hidden) return;
  clear(document.getElementById('viewer-body')); // 비디오 정지 포함
  viewer.hidden = true;
}
function initViewer() {
  const viewer = document.getElementById('viewer');
  document.getElementById('viewer-close').addEventListener('click', closeViewer);
  viewer.addEventListener('click', (e) => { if (e.target === viewer) closeViewer(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeViewer(); });
}

// 산출물 → 소속 파이프라인 폴더 키 (마지막 연결 태스크 기준, 없으면 '_etc')
function artifactFolderKey(a) {
  const ids = a.task_ids || [];
  for (let i = ids.length - 1; i >= 0; i--) {
    const p = state.idx.pipelineByTask.get(ids[i]);
    if (p) return p.id;
  }
  return '_etc';
}
function folderName(key) {
  if (key === '_etc') return '파이프라인 미연결';
  const p = state.idx.pipelineById.get(key);
  return p ? p.name : '(알 수 없는 폴더)';
}
function groupArtifactsByPipeline(artifacts) {
  const groups = new Map(); // key → {key, name, pipeline, items, latest}
  for (const a of artifacts) {
    const key = artifactFolderKey(a);
    let g = groups.get(key);
    if (!g) {
      g = { key, name: folderName(key), pipeline: state.idx.pipelineById.get(key) || null, items: [], latest: 0 };
      groups.set(key, g);
    }
    g.items.push(a);
    g.latest = Math.max(g.latest, a.mtime || 0);
  }
  return [...groups.values()].sort((x, y) => y.latest - x.latest);
}
function folderHref(key) { return `#outputs/${encodeURIComponent(key)}`; }

function artifactCard(a) {
  const card = el('div', 'artifact-card');

  if (a.type === 'video') {
    const video = document.createElement('video');
    video.src = a.rel;
    video.controls = true;
    video.preload = 'metadata';
    card.appendChild(video);
  } else {
    const media = el('button', 'artifact-media');
    media.type = 'button';
    media.setAttribute('aria-label', `${a.name} 열기`);
    if (a.type === 'image') {
      const img = document.createElement('img');
      img.src = a.rel;
      img.alt = a.name;
      img.loading = 'lazy';
      media.appendChild(img);
    } else {
      const face = el('span', 'doc-face');
      face.appendChild(el('span', 'doc-icon', DOC_ICONS[a.type] || '📄'));
      face.appendChild(el('span', '', a.type === 'csv' ? 'CSV 데이터' : a.type === 'link' ? '새 탭에서 열기' : 'Markdown 문서'));
      media.appendChild(face);
    }
    media.addEventListener('click', () => openArtifact(a));
    card.appendChild(media);
  }

  const meta = el('div', 'artifact-meta');
  meta.appendChild(el('div', 'artifact-name', a.name));
  const sub = el('div', 'artifact-sub');
  sub.appendChild(agentChip(a.team));
  sub.appendChild(document.createTextNode(`${fmtBytes(a.size)} · ${fmtTs(a.mtime)}`));
  meta.appendChild(sub);
  const title = artifactTaskTitle(a);
  if (title) {
    const taskLine = el('div', 'artifact-task', title);
    taskLine.title = title;
    meta.appendChild(taskLine);
  }
  card.appendChild(meta);
  return card;
}

function folderRow(g) {
  const row = document.createElement('a');
  row.className = 'artifact-folder';
  row.href = folderHref(g.key);
  row.appendChild(el('span', 'folder-icon', '📁'));
  row.appendChild(el('span', 'folder-name', g.name));

  const thumbs = el('span', 'folder-thumbs');
  for (const it of g.items.filter((x) => x.type === 'image').slice(0, 4)) {
    const img = document.createElement('img');
    img.src = it.rel;
    img.alt = '';
    img.loading = 'lazy';
    thumbs.appendChild(img);
  }
  if (thumbs.childElementCount) row.appendChild(thumbs);

  if (g.pipeline) row.appendChild(statusChip(PIPE_STATUS[g.pipeline.status] || g.pipeline.status));
  row.appendChild(el('span', 'folder-count', `${g.items.length}개`));
  row.appendChild(el('span', 'folder-when', `최근 ${fmtTs(g.latest)}`));
  return row;
}

function renderArtifacts(f) {
  const root = document.getElementById('artifact-grid');
  clear(root);
  const groups = groupArtifactsByPipeline(f.artifacts);

  // 폴더(파이프라인) 목록 보기
  if (state.artifactFolder == null) {
    root.className = 'folder-list';
    if (!groups.length) {
      root.appendChild(el('p', 'empty-note', '이 조건에 해당하는 산출물이 없습니다.'));
      return;
    }
    for (const g of groups) root.appendChild(folderRow(g));
    return;
  }

  // 폴더 내부 보기 (해당 파이프라인 산출물만)
  root.className = 'artifact-grid';
  const g = groups.find((x) => x.key === state.artifactFolder);

  const crumb = el('div', 'artifact-crumb');
  const back = document.createElement('a');
  back.href = '#outputs';
  back.textContent = '📁 전체 산출물';
  crumb.appendChild(back);
  crumb.appendChild(el('span', 'crumb-sep', '›'));
  crumb.appendChild(el('span', 'crumb-name', folderName(state.artifactFolder)));
  if (g) crumb.appendChild(el('span', 'crumb-count', `${g.items.length}개`));
  root.appendChild(crumb);

  if (!g) {
    root.appendChild(el('p', 'empty-note', '이 조건에 해당하는 산출물이 없습니다. 기간·에이전트 필터를 확인하거나 전체 산출물로 돌아가세요.'));
    return;
  }
  for (const a of g.items) root.appendChild(artifactCard(a));
}

// ── 산출물 해시 라우팅 (#outputs / #outputs/<폴더키>) ─
function parseArtifactHash() {
  const m = /^#outputs(?:\/(.+))?$/.exec(location.hash);
  state.artifactFolder = m && m[1] ? decodeURIComponent(m[1]) : null;
}
window.addEventListener('hashchange', () => {
  const isOutputs = /^#outputs/.test(location.hash);
  if (!isOutputs && state.artifactFolder == null) return; // 산출물과 무관한 해시 변경
  parseArtifactHash();
  if (!state.data) return;
  renderArtifacts(getFiltered());
  if (isOutputs) document.getElementById('artifacts-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// ── 칩 빌더 ──────────────────────────────────────────
function agentChip(name) {
  const info = agentInfo(name);
  const chip = el('span', 'agent-chip');
  const dot = el('span', 'dot');
  dot.style.background = info.color;
  chip.append(dot, document.createTextNode(info.label));
  chip.title = info.role ? `${info.label} — ${info.role}` : info.label;
  return chip;
}
function statusChip(status) {
  const s = TASK_STATUS[status] || { label: status, icon: '', fg: 'var(--muted)' };
  const chip = el('span', 'status-chip');
  chip.style.color = s.fg;
  if (s.pulse) chip.appendChild(el('span', 'pulse'));
  else if (s.icon) chip.appendChild(document.createTextNode(s.icon + ' '));
  chip.appendChild(document.createTextNode(s.label));
  return chip;
}

// ── KPI ──────────────────────────────────────────────
function renderKpis(f) {
  const root = document.getElementById('kpi-row');
  clear(root);
  const gen = state.data.generated_at;

  const doneTasks = f.tasks.filter((t) => t.status === 'done');
  const runningTasks = f.tasks.filter((t) => t.status === 'running');
  const blockedTasks = f.tasks.filter((t) => t.status === 'blocked');
  const terminalRuns = f.runs.filter((r) => r.outcome);
  const okRuns = terminalRuns.filter((r) => r.outcome === 'completed');
  const crashRuns = terminalRuns.filter((r) => r.outcome === 'crashed');
  const durations = doneTasks.map((t) => taskDurationSec(t, gen)).filter((d) => d != null);
  const avgDur = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : null;
  const maxDur = durations.length ? Math.max(...durations) : null;
  const pipeDone = f.pipelines.filter((p) => p.status === 'done').length;
  const pipeActive = f.pipelines.filter((p) => p.status === 'running' || p.status === 'blocked' || p.status === 'waiting').length;

  const tiles = [
    {
      label: '파이프라인', value: String(f.pipelines.length),
      sub: [`완료 ${pipeDone}`, pipeActive ? `진행 ${pipeActive}` : null],
    },
    {
      label: '태스크 완료', value: String(doneTasks.length), unit: `/ ${f.tasks.length}`,
      sub: [`완료율 ${f.tasks.length ? Math.round((doneTasks.length / f.tasks.length) * 100) : 0}%`],
    },
    {
      label: '지금 실행 중', value: String(runningTasks.length),
      sub: [blockedTasks.length ? { text: `차단 ${blockedTasks.length}`, cls: 'bad' } : '차단 없음'],
    },
    {
      label: '런 성공률',
      value: terminalRuns.length ? `${Math.round((okRuns.length / terminalRuns.length) * 100)}` : '—',
      unit: terminalRuns.length ? '%' : '',
      sub: [`런 ${terminalRuns.length}회`, crashRuns.length ? { text: `크래시 ${crashRuns.length}`, cls: 'bad' } : null],
    },
    {
      label: '평균 태스크 소요', value: avgDur != null ? fmtDuration(avgDur) : '—',
      sub: [maxDur != null ? `최장 ${fmtDuration(maxDur)}` : null],
    },
  ];

  for (const t of tiles) {
    const tile = el('div', 'stat-tile');
    tile.appendChild(el('div', 'stat-label', t.label));
    const val = el('div', 'stat-value', t.value);
    if (t.unit) val.appendChild(el('span', 'unit', ' ' + t.unit));
    tile.appendChild(val);
    const sub = el('div', 'stat-sub');
    const parts = (t.sub || []).filter(Boolean);
    parts.forEach((p, i) => {
      if (i) sub.appendChild(document.createTextNode(' · '));
      if (typeof p === 'string') sub.appendChild(document.createTextNode(p));
      else sub.appendChild(el('span', p.cls, p.text));
    });
    tile.appendChild(sub);
    root.appendChild(tile);
  }
}

// ── 진행 현황 ────────────────────────────────────────
function renderNow(f) {
  const root = document.getElementById('now-cards');
  clear(root);
  const gen = state.data.generated_at;
  const active = f.tasks
    .filter((t) => ACTIVE_STATUSES.has(t.status))
    .sort((a, b) => (b.started_at || b.created_at || 0) - (a.started_at || a.created_at || 0));

  if (!active.length) {
    root.appendChild(el('p', 'empty-note', '현재 활성 태스크가 없습니다. 모든 파이프라인이 종료 상태입니다.'));
    return;
  }
  for (const t of active) {
    const card = el('div', 'now-card');
    const head = el('div', 'now-card-head');
    head.append(agentChip(t.assignee), statusChip(t.status));
    card.appendChild(head);
    card.appendChild(el('div', 'now-title', t.title));

    const events = (state.idx.eventsByTask.get(t.id) || []).filter((ev) => ev.note);
    const lastNote = events.length ? events[events.length - 1] : null;
    if (lastNote) {
      const note = el('div', 'now-note', lastNote.note);
      card.appendChild(note);
    }
    const metaBits = [];
    if (t.status === 'running' && t.started_at) metaBits.push(`실행 ${fmtDuration(gen - t.started_at)} 경과`);
    else if (t.started_at) metaBits.push(`시작 ${fmtTs(t.started_at)}`);
    else metaBits.push(`생성 ${fmtTs(t.created_at)}`);
    if (lastNote) metaBits.push(`마지막 노트 ${fmtAgo(lastNote.created_at, gen)}`);
    card.appendChild(el('div', 'now-meta', metaBits.join(' · ')));
    root.appendChild(card);
  }
}

// ── 차트 공통 ────────────────────────────────────────
function renderLegend(rootId) {
  const root = document.getElementById(rootId);
  clear(root);
  for (const s of OUTCOMES) {
    const item = el('span', 'legend-item');
    const sw = el('span', 'legend-swatch');
    sw.style.background = s.color;
    item.append(sw, document.createTextNode(s.label));
    root.appendChild(item);
  }
}
function niceTicks(maxValue) {
  if (maxValue <= 0) return [0, 1];
  const rough = maxValue / 4;
  const pow = Math.pow(10, Math.floor(Math.log10(rough)));
  let step = pow;
  for (const m of [1, 2, 5, 10]) { if (rough <= m * pow) { step = m * pow; break; } }
  step = Math.max(1, step);
  const ticks = [];
  for (let v = 0; v <= maxValue + 1e-9; v += step) ticks.push(v);
  if (ticks[ticks.length - 1] < maxValue) ticks.push(ticks[ticks.length - 1] + step);
  return ticks;
}
function roundedTopRect(x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h);
  return `M${x},${y + h} L${x},${y + rr} Q${x},${y} ${x + rr},${y} L${x + w - rr},${y} Q${x + w},${y} ${x + w},${y + rr} L${x + w},${y + h} Z`;
}
function roundedRightRect(x, y, w, h, r) {
  const rr = Math.min(r, h / 2, w);
  return `M${x},${y} L${x + w - rr},${y} Q${x + w},${y} ${x + w},${y + rr} L${x + w},${y + h - rr} Q${x + w},${y + h} ${x + w - rr},${y + h} L${x},${y + h} Z`;
}

// ── 일별 실행 결과 (stacked column) ──────────────────
function renderDailyChart(f) {
  const root = document.getElementById('daily-chart');
  clear(root);
  renderLegend('daily-legend');

  const gen = state.data.generated_at;
  const terminal = f.runs.filter((r) => r.outcome && (r.ended_at || r.started_at));
  if (!terminal.length) {
    root.appendChild(el('p', 'chart-empty', '이 조건에 해당하는 실행 기록이 없습니다.'));
    return;
  }

  // 버킷: 기간 내 연속된 일자 (활동 시작일 ~ 스냅샷일). 40일 초과 시 주 단위.
  let from = f.from;
  if (from == null) from = Math.min(...terminal.map((r) => r.ended_at || r.started_at));
  const spanDays = Math.max(1, Math.ceil((gen - from) / 86400));
  const weekly = spanDays > 40;
  const buckets = new Map(); // key → {label, segs}
  const keys = [];
  const stepSec = weekly ? 7 * 86400 : 86400;
  let cursor = startOfDaySec(dayKey(from));
  const endSec = gen;
  while (cursor <= endSec && keys.length < 200) {
    const key = dayKey(cursor);
    keys.push(key);
    buckets.set(key, {
      label: weekly ? `${fmtDayShort.format(new Date(cursor * 1000))}주` : fmtDayShort.format(new Date(cursor * 1000)),
      startSec: cursor,
      segs: { completed: 0, blocked: 0, crashed: 0 },
    });
    cursor += stepSec;
  }
  for (const r of terminal) {
    const ts = r.ended_at || r.started_at;
    let key;
    if (weekly) {
      const k = keys.findLast ? keys.findLast((kk) => buckets.get(kk).startSec <= ts) : null;
      key = k || keys[0];
    } else {
      key = dayKey(ts);
    }
    const b = buckets.get(key);
    if (b && b.segs[r.outcome] != null) b.segs[r.outcome] += 1;
  }

  const days = keys.map((k) => buckets.get(k));
  const maxTotal = Math.max(...days.map((d) => OUTCOMES.reduce((a, s) => a + d.segs[s.key], 0)));
  const ticks = niceTicks(maxTotal);
  const yMax = ticks[ticks.length - 1];

  const W = 540, H = 230, mL = 30, mR = 6, mT = 8, mB = 24;
  const plotW = W - mL - mR, plotH = H - mT - mB;
  const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': '일별 실행 결과 누적 막대 차트' });

  for (const tv of ticks) {
    const y = mT + plotH - (tv / yMax) * plotH;
    if (tv > 0) svg.appendChild(svgEl('line', { x1: mL, x2: W - mR, y1: y, y2: y, class: 'gridline' }));
    const label = svgEl('text', { x: mL - 6, y: y + 3.5, 'text-anchor': 'end', class: 'axis-text' });
    label.textContent = String(tv);
    svg.appendChild(label);
  }
  svg.appendChild(svgEl('line', { x1: mL, x2: W - mR, y1: mT + plotH, y2: mT + plotH, class: 'baseline-line' }));

  const band = plotW / days.length;
  const barW = Math.min(24, band * 0.62);
  const labelEvery = Math.ceil(days.length / 9);

  days.forEach((d, i) => {
    const cx = mL + band * i + band / 2;
    const total = OUTCOMES.reduce((a, s) => a + d.segs[s.key], 0);
    const group = svgEl('g', {});
    // 세그먼트: 아래→위 = 완료, 차단, 크래시. 내부 경계에만 1px 인셋(2px 표면 갭).
    let cum = 0;
    const nonZero = OUTCOMES.filter((s) => d.segs[s.key] > 0);
    nonZero.forEach((s, si) => {
      const v = d.segs[s.key];
      const y1 = mT + plotH - (cum / yMax) * plotH;
      const y0 = mT + plotH - ((cum + v) / yMax) * plotH;
      const isTop = si === nonZero.length - 1;
      const isBottom = si === 0;
      const top = y0 + (isTop ? 0 : 1);
      const bottom = y1 - (isBottom ? 0 : 1);
      const h = Math.max(1.5, bottom - top);
      const x = cx - barW / 2;
      let mark;
      if (isTop) mark = svgEl('path', { d: roundedTopRect(x, top, barW, h, 4), fill: s.color });
      else mark = svgEl('rect', { x, y: top, width: barW, height: h, fill: s.color });
      group.appendChild(mark);
      cum += v;
    });
    svg.appendChild(group);

    if (i % labelEvery === 0) {
      const xl = svgEl('text', { x: cx, y: H - 8, 'text-anchor': 'middle', class: 'axis-text' });
      xl.textContent = d.label;
      svg.appendChild(xl);
    }

    // 히트 타깃: 밴드 전체, 키보드 포커스 가능
    const hit = svgEl('rect', {
      x: mL + band * i, y: mT, width: band, height: plotH,
      class: 'bar-hit', tabindex: '0', role: 'img',
      'aria-label': `${d.label}: ` + OUTCOMES.map((s) => `${s.label} ${d.segs[s.key]}`).join(', '),
    });
    attachBarTooltip(hit, group, d.label, OUTCOMES.map((s) => ({ name: s.label, color: s.color, value: d.segs[s.key] })), total);
    svg.appendChild(hit);
  });

  root.appendChild(svg);
}

// ── 에이전트별 실행 결과 (horizontal stacked bar) ────
function renderAgentChart(f) {
  const root = document.getElementById('agent-chart');
  clear(root);
  renderLegend('agent-legend');

  const terminal = f.runs.filter((r) => r.outcome);
  if (!terminal.length) {
    root.appendChild(el('p', 'chart-empty', '이 조건에 해당하는 실행 기록이 없습니다.'));
    return;
  }
  const names = [...new Set(terminal.map((r) => r.profile))];
  names.sort((a, b) => {
    const ia = AGENT_ORDER.indexOf(a), ib = AGENT_ORDER.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  const rows = names.map((name) => {
    const segs = { completed: 0, blocked: 0, crashed: 0 };
    for (const r of terminal) if (r.profile === name && segs[r.outcome] != null) segs[r.outcome] += 1;
    return { name, segs, total: OUTCOMES.reduce((a, s) => a + segs[s.key], 0) };
  });

  const maxTotal = Math.max(...rows.map((r) => r.total));
  const ticks = niceTicks(maxTotal);
  const xMax = ticks[ticks.length - 1];

  const rowH = 38, mL = 76, mR = 34, mT = 6, mB = 22;
  const W = 540, H = mT + rows.length * rowH + mB;
  const plotW = W - mL - mR;
  const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': '에이전트별 실행 결과 누적 가로 막대 차트' });

  for (const tv of ticks) {
    const x = mL + (tv / xMax) * plotW;
    if (tv > 0) svg.appendChild(svgEl('line', { x1: x, x2: x, y1: mT, y2: mT + rows.length * rowH, class: 'gridline' }));
    const label = svgEl('text', { x, y: H - 6, 'text-anchor': 'middle', class: 'axis-text' });
    label.textContent = String(tv);
    svg.appendChild(label);
  }
  svg.appendChild(svgEl('line', { x1: mL, x2: mL, y1: mT, y2: mT + rows.length * rowH, class: 'baseline-line' }));

  rows.forEach((row, i) => {
    const info = agentInfo(row.name);
    const cy = mT + rowH * i + rowH / 2;
    const barH = 20;

    // y 라벨: 에이전트 점 + 이름 (텍스트는 텍스트 토큰)
    svg.appendChild(svgEl('circle', { cx: 10, cy: cy, r: 4.5, fill: info.color }));
    const yl = svgEl('text', { x: 20, y: cy + 3.5, class: 'axis-text' });
    yl.textContent = info.label;
    svg.appendChild(yl);

    const group = svgEl('g', {});
    let cum = 0;
    const nonZero = OUTCOMES.filter((s) => row.segs[s.key] > 0);
    nonZero.forEach((s, si) => {
      const v = row.segs[s.key];
      const x0 = mL + (cum / xMax) * plotW;
      const x1 = mL + ((cum + v) / xMax) * plotW;
      const isEnd = si === nonZero.length - 1;
      const isStart = si === 0;
      const left = x0 + (isStart ? 0 : 1);
      const right = x1 - (isEnd ? 0 : 1);
      const w = Math.max(1.5, right - left);
      const y = cy - barH / 2;
      let mark;
      if (isEnd) mark = svgEl('path', { d: roundedRightRect(left, y, w, barH, 4), fill: s.color });
      else mark = svgEl('rect', { x: left, y, width: w, height: barH, fill: s.color });
      group.appendChild(mark);
      cum += v;
    });
    svg.appendChild(group);

    // 값 라벨: 막대 끝 바깥
    const tip = svgEl('text', { x: mL + (row.total / xMax) * plotW + 6, y: cy + 3.5, class: 'axis-text' });
    tip.textContent = String(row.total);
    svg.appendChild(tip);

    const hit = svgEl('rect', {
      x: 0, y: mT + rowH * i, width: W, height: rowH,
      class: 'bar-hit', tabindex: '0', role: 'img',
      'aria-label': `${info.label}: ` + OUTCOMES.map((s) => `${s.label} ${row.segs[s.key]}`).join(', '),
    });
    attachBarTooltip(hit, group, info.label, OUTCOMES.map((s) => ({ name: s.label, color: s.color, value: row.segs[s.key] })), row.total);
    svg.appendChild(hit);
  });

  root.appendChild(svg);
}

// ── 툴팁 ─────────────────────────────────────────────
const tooltipEl = () => document.getElementById('tooltip');
function showTooltip(title, rows, clientX, clientY) {
  const tt = tooltipEl();
  clear(tt);
  tt.appendChild(el('div', 'tt-title', title));
  for (const r of rows) {
    const row = el('div', 'tt-row');
    const key = el('span', 'tt-key');
    key.style.background = r.color;
    row.append(key, el('span', 'tt-val', String(r.value)), el('span', 'tt-name', r.name));
    tt.appendChild(row);
  }
  tt.classList.add('show');
  tt.setAttribute('aria-hidden', 'false');
  positionTooltip(clientX, clientY);
}
function positionTooltip(x, y) {
  const tt = tooltipEl();
  const pad = 12;
  const rect = tt.getBoundingClientRect();
  let left = x + pad, top = y + pad;
  if (left + rect.width > window.innerWidth - 8) left = x - rect.width - pad;
  if (top + rect.height > window.innerHeight - 8) top = y - rect.height - pad;
  tt.style.left = `${Math.max(4, left)}px`;
  tt.style.top = `${Math.max(4, top)}px`;
}
function hideTooltip() {
  const tt = tooltipEl();
  tt.classList.remove('show');
  tt.setAttribute('aria-hidden', 'true');
}
function attachBarTooltip(hit, markGroup, title, rows, total) {
  const allRows = rows.concat([{ name: '합계', color: 'var(--baseline)', value: total }]);
  hit.addEventListener('pointermove', (e) => {
    markGroup.classList.add('mark-lift');
    showTooltip(title, allRows, e.clientX, e.clientY);
  });
  hit.addEventListener('pointerleave', () => { markGroup.classList.remove('mark-lift'); hideTooltip(); });
  hit.addEventListener('focus', () => {
    markGroup.classList.add('mark-lift');
    const r = hit.getBoundingClientRect();
    showTooltip(title, allRows, r.left + r.width / 2, r.top + 10);
  });
  hit.addEventListener('blur', () => { markGroup.classList.remove('mark-lift'); hideTooltip(); });
}

// ── 파이프라인 히스토리 ──────────────────────────────
const PIPE_STATUS = {
  done: 'done', running: 'running', blocked: 'blocked', waiting: 'ready', archived: 'archived',
};
function renderPipelines(f) {
  const root = document.getElementById('pipeline-list');
  clear(root);
  const gen = state.data.generated_at;
  if (!f.pipelines.length) {
    root.appendChild(el('p', 'empty-note', '이 조건에 해당하는 파이프라인이 없습니다.'));
    return;
  }
  for (const p of f.pipelines) {
    const card = el('div', 'pipeline-card');
    if (state.openPipelines.has(p.id)) card.classList.add('open');

    const head = el('button', 'pipeline-head');
    head.type = 'button';
    head.setAttribute('aria-expanded', card.classList.contains('open') ? 'true' : 'false');
    head.appendChild(el('span', 'caret', '▶'));
    head.appendChild(el('span', 'pipeline-name', p.name));
    head.appendChild(statusChip(PIPE_STATUS[p.status] || p.status));

    const whenBits = [];
    if (p.started_at) whenBits.push(fmtTs(p.started_at));
    if (p.ended_at && p.started_at) whenBits.push(`총 ${fmtDuration(p.ended_at - p.started_at)}`);
    else if (p.status === 'running' && p.started_at) whenBits.push(`${fmtDuration(gen - p.started_at)} 경과`);
    head.appendChild(el('span', 'pipeline-when', whenBits.join(' · ')));
    card.appendChild(head);

    // 스테이지 체인
    const chain = el('div', 'stage-chain');
    p.task_ids.forEach((tid, i) => {
      const t = state.idx.taskById.get(tid);
      if (!t) return;
      if (i) chain.appendChild(el('span', 'stage-arrow', '→'));
      const info = agentInfo(t.assignee);
      const node = el('span', `stage-node st-${nodeStatus(t)}`);
      const dot = el('span', 'dot');
      dot.style.background = info.color;
      node.append(dot, document.createTextNode(info.label));
      node.title = `${t.title} — ${(TASK_STATUS[t.status] || {}).label || t.status}`;
      chain.appendChild(node);
    });
    const artCount = f.artifacts.filter((a) => artifactFolderKey(a) === p.id).length;
    if (artCount) {
      const link = document.createElement('a');
      link.className = 'pipe-artifact-link';
      link.href = folderHref(p.id);
      link.textContent = `📁 산출물 ${artCount}개`;
      link.title = '이 파이프라인의 산출물만 보기';
      chain.appendChild(link);
    }
    card.appendChild(chain);

    const detail = el('div', 'pipeline-detail');
    card.appendChild(detail);

    head.addEventListener('click', () => {
      const open = card.classList.toggle('open');
      head.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        state.openPipelines.add(p.id);
        if (!detail.childElementCount) renderPipelineDetail(detail, p);
      } else {
        state.openPipelines.delete(p.id);
      }
    });
    if (card.classList.contains('open')) renderPipelineDetail(detail, p);

    root.appendChild(card);
  }
}
function nodeStatus(task) {
  if (task.status === 'done') return 'done';
  if (task.status === 'running') return 'running';
  if (task.status === 'blocked') return 'blocked';
  if ((task.consecutive_failures || 0) > 0) return 'crashed';
  return 'idle';
}

function renderPipelineDetail(root, pipeline) {
  clear(root);
  const gen = state.data.generated_at;
  for (const tid of pipeline.task_ids) {
    const t = state.idx.taskById.get(tid);
    if (!t) continue;
    const box = el('div', 'task-detail');

    const head = el('div', 'task-detail-head');
    head.append(agentChip(t.assignee), el('span', 'task-detail-title', t.title), statusChip(t.status), el('span', 'task-id', t.id));
    box.appendChild(head);

    const runs = state.idx.runsByTask.get(tid) || [];
    if (runs.length) {
      box.appendChild(el('div', 'detail-sub', `런 (${runs.length}회 시도)`));
      runs.forEach((r, i) => {
        const row = el('div', 'run-row');
        row.appendChild(el('span', 'when', `#${i + 1} · ${fmtTs(r.started_at)}`));
        const oc = OUTCOMES.find((o) => o.key === r.outcome);
        row.appendChild(statusChip(r.outcome === 'completed' ? 'done' : r.outcome || 'running'));
        if (r.started_at && r.ended_at) row.appendChild(el('span', 'when', fmtDuration(r.ended_at - r.started_at)));
        if (r.summary) row.appendChild(el('span', 'summary', r.summary));
        if (r.error) row.appendChild(el('span', 'err', r.error));
        void oc;
        box.appendChild(row);
      });
    }

    const events = state.idx.eventsByTask.get(tid) || [];
    if (events.length) {
      box.appendChild(el('div', 'detail-sub', '이벤트'));
      const list = el('div');
      const renderEvents = (limit) => {
        clear(list);
        const shown = limit ? events.slice(-limit) : events;
        if (limit && events.length > shown.length) {
          const more = el('button', 'more-btn', `이전 이벤트 ${events.length - shown.length}건 더 보기`);
          more.type = 'button';
          more.addEventListener('click', () => renderEvents(null));
          list.appendChild(more);
        }
        for (const ev of shown) {
          const row = el('div', 'event-row');
          row.appendChild(el('span', 'when', fmtTs(ev.created_at)));
          row.appendChild(el('span', 'event-kind', EVENT_KIND_KO[ev.kind] || ev.kind));
          if (ev.note) row.appendChild(el('span', 'event-note', ev.note));
          list.appendChild(row);
        }
      };
      renderEvents(8);
      box.appendChild(list);
    }

    const taskArtifacts = state.idx.artifactsByTask.get(tid) || [];
    if (taskArtifacts.length) {
      box.appendChild(el('div', 'detail-sub', '산출물'));
      const row = el('div', 'detail-artifacts');
      for (const a of taskArtifacts) {
        const chip = el('button', 'detail-artifact');
        chip.type = 'button';
        if (a.type === 'image') {
          const img = document.createElement('img');
          img.src = a.rel;
          img.alt = '';
          img.loading = 'lazy';
          chip.appendChild(img);
        } else {
          chip.appendChild(document.createTextNode(a.type === 'video' ? '🎬' : DOC_ICONS[a.type] || '📄'));
        }
        chip.appendChild(el('span', 'nm', a.name));
        chip.addEventListener('click', () => openArtifact(a));
        row.appendChild(chip);
      }
      box.appendChild(row);
    }

    const comments = state.idx.commentsByTask.get(tid) || [];
    if (comments.length) {
      box.appendChild(el('div', 'detail-sub', '코멘트'));
      for (const c of comments) {
        const block = el('div', 'comment-block');
        block.appendChild(el('div', 'comment-meta', `${c.author} · ${fmtTs(c.created_at)}`));
        block.appendChild(document.createTextNode(c.body));
        box.appendChild(block);
      }
    }

    void gen;
    root.appendChild(box);
  }
}

// ── 태스크 테이블 ────────────────────────────────────
function renderTable(f) {
  const tbody = document.querySelector('#task-table tbody');
  clear(tbody);
  const gen = state.data.generated_at;
  const tasks = [...f.tasks].sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
  for (const t of tasks) {
    const tr = document.createElement('tr');

    const tdTitle = document.createElement('td');
    tdTitle.appendChild(el('div', 't-title', t.title));
    tdTitle.appendChild(el('div', 'task-id', t.id));
    tr.appendChild(tdTitle);

    const tdAgent = document.createElement('td');
    tdAgent.appendChild(agentChip(t.assignee));
    tr.appendChild(tdAgent);

    const tdStatus = document.createElement('td');
    tdStatus.appendChild(statusChip(t.status));
    tr.appendChild(tdStatus);

    const tdCreated = el('td', 'num', fmtTs(t.created_at, fmtFull));
    tr.appendChild(tdCreated);
    const tdStarted = el('td', 'num', fmtTs(t.started_at, fmtFull));
    tr.appendChild(tdStarted);

    const dur = taskDurationSec(t, gen);
    const tdDur = el('td', 'num', dur != null ? fmtDuration(dur) + (t.status === 'running' ? ' ↻' : '') : '—');
    tr.appendChild(tdDur);

    const runs = state.idx.runsByTask.get(t.id) || [];
    const crashes = runs.filter((r) => r.outcome === 'crashed').length;
    const tdRuns = el('td', 'num', runs.length ? `${runs.length}회${crashes ? ` (크래시 ${crashes})` : ''}` : '—');
    tr.appendChild(tdRuns);

    tbody.appendChild(tr);
  }
}

// ── 필터 UI ──────────────────────────────────────────
function renderAgentFilter() {
  const root = document.getElementById('agent-filter');
  clear(root);
  const seen = new Set(state.data.tasks.map((t) => t.assignee).filter(Boolean));
  const names = AGENT_ORDER.filter((n) => seen.has(n)).concat([...seen].filter((n) => !AGENT_ORDER.includes(n)).sort());

  const mkBtn = (value, labelNode) => {
    const btn = el('button', 'chip-btn' + (state.agent === value ? ' selected' : ''));
    btn.type = 'button';
    btn.dataset.agent = value;
    btn.appendChild(labelNode);
    btn.addEventListener('click', () => {
      state.agent = value;
      renderAgentFilter();
      renderAll();
    });
    return btn;
  };
  root.appendChild(mkBtn('all', document.createTextNode('모든 에이전트')));
  for (const name of names) {
    const info = agentInfo(name);
    const frag = document.createDocumentFragment();
    const dot = el('span', 'dot');
    dot.style.background = info.color;
    frag.append(dot, document.createTextNode(info.label));
    root.appendChild(mkBtn(name, frag));
  }
}
function bindRangeFilter() {
  const root = document.getElementById('range-filter');
  root.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-range]');
    if (!btn) return;
    state.range = btn.dataset.range;
    for (const b of root.querySelectorAll('button')) b.classList.toggle('selected', b === btn);
    renderAll();
  });
}

// ── 데이터 신선도 ────────────────────────────────────
function renderFreshness() {
  const root = document.getElementById('data-freshness');
  clear(root);
  if (!state.data) return;
  const gen = state.data.generated_at;
  const nowSec = Date.now() / 1000;
  root.appendChild(document.createTextNode(`데이터 기준 ${fmtTs(gen, fmtFull)} · `));
  const age = el('span', nowSec - gen > 3600 ? 'stale' : '', fmtAgo(gen, nowSec));
  root.appendChild(age);
}

// ── 테마 ─────────────────────────────────────────────
function initTheme() {
  const saved = localStorage.getItem('agentree-theme');
  if (saved === 'light' || saved === 'dark') document.documentElement.dataset.theme = saved;
  document.getElementById('theme-toggle').addEventListener('click', () => {
    const current = document.documentElement.dataset.theme
      || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('agentree-theme', next);
  });
}

// ── 로드 & 갱신 ──────────────────────────────────────
async function loadData(initial) {
  const main = document.querySelector('main');
  try {
    const res = await fetch(`data.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const changed = !state.data || data.generated_at !== state.data.generated_at;
    if (changed) {
      state.data = data;
      state.idx = buildIndexes(data);
      if (initial) renderAgentFilter();
      renderAll();
      if (initial && state.artifactFolder != null) {
        document.getElementById('artifacts-panel').scrollIntoView();
      }
    }
    renderFreshness();
    document.getElementById('error-banner').hidden = true;
  } catch (err) {
    const banner = document.getElementById('error-banner');
    banner.textContent = `data.json 을 불러오지 못했습니다 (${err.message}). 로컬에서 볼 때는 python3 -m http.server 로 서빙하세요.`;
    banner.hidden = false;
  } finally {
    main.classList.remove('refreshing');
  }
}

function renderAll() {
  const f = getFiltered();
  renderKpis(f);
  renderNow(f);
  renderDailyChart(f);
  renderAgentChart(f);
  renderArtifacts(f);
  renderPipelines(f);
  renderTable(f);
}

initTheme();
initViewer();
bindRangeFilter();
parseArtifactHash();
loadData(true);
setInterval(() => { renderFreshness(); }, 30 * 1000);
setInterval(() => {
  document.querySelector('main').classList.add('refreshing');
  loadData(false);
}, 60 * 1000);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) loadData(false);
});
