# 🎭 AgentreeCompany Pipeline — Skill Reference

> **Skill 이름**: `content-create`  
> **버전**: 1.0.0  
> **작성일**: 2026-07-03

---

## 개요

`agentree-pipeline`은 LetsCoding 4인조 AI 에이전트 팀(🟡 Yellow, 🟣 Nana, 🟢 Green, 🔵 Blue)의 협업 파이프라인을 실행하는 Skill입니다.  
Yellow가 지휘자로서 사용자 요청을 분해하고 Kanban 태스크를 생성·모니터링·종합합니다.

---

## 팀 구성

| 프로필 | 이름 | 모델 | 역할 | 작업 디렉토리 |
|--------|------|------|------|---------------|
| `yellow` | 🟡 Yellow | deepseek-v4-pro | 지휘자 (Orchestrator) | `~/Documents/AgentreeCompany/` |
| `nana` | 🟣 Nana | gpt-5.5 | 연구원 (Researcher) | `~/Documents/AgentreeCompany/RND_Team/` |
| `green` | 🟢 Green | deepseek-v4-pro | 작가 (Writer) | `~/Documents/AgentreeCompany/BlogTeam/` |
| `blue` | 🔵 Blue | gpt-5.5 | 디자이너 (Designer) | `~/Documents/AgentreeCompany/DesignTeam/` |

---

## 📐 파이프라인 패턴

### 1. 순차 파이프라인 (Sequential Pipeline)

**Nana 조사 → Green 집필 → Blue 디자인**

```
사용자 요청
    │
    ▼
🟣 Nana: 조사 (research)
    │
    ▼
🟢 Green: 집필 (write)
    │
    ▼
🔵 Blue: 인포그래픽 (design)
    │
    ▼
🟡 Yellow: 결과 종합
```

**사용 예시**:
```bash
# 1단계: Nana에게 조사 태스크
hermes kanban create "2026년 AI 에이전트 트렌드 조사" \
  --assignee nana \
  --body "목표: 2026년 AI 에이전트 분야의 주요 트렌드와 통계 조사
입력: 없음
완료 기준: 마크다운 파일로 RND_Team/ 디렉토리에 저장, 출처 포함" \
  --workspace dir:/home/leehg/Documents/AgentreeCompany/RND_Team

# 2단계: Green에게 집필 태스크 (부모: 1단계)
hermes kanban create "AI 에이전트 트렌드 블로그 글 작성" \
  --assignee green \
  --body "목표: Nana의 조사 결과를 바탕으로 블로그 글 작성
입력: 부모 태스크 결과 (RND_Team/의 마크다운 파일)
완료 기준: BlogTeam/ 디렉토리에 마크다운 포스트 저장, 이미지 참조 경로 포함" \
  --parent <nana_task_id> \
  --workspace dir:/home/leehg/Documents/AgentreeCompany/BlogTeam

# 3단계: Blue에게 디자인 태스크 (부모: 2단계)
hermes kanban create "AI 에이전트 트렌드 인포그래픽 제작" \
  --assignee blue \
  --body "목표: Green의 원고를 기반으로 A4 세로 인포그래픽 제작
입력: 부모 태스크 결과 (BlogTeam/의 마크다운 파일)
완료 기준: DesignTeam/ 디렉토리에 PNG 이미지 저장" \
  --parent <green_task_id> \
  --workspace dir:/home/leehg/Documents/AgentreeCompany/DesignTeam
```

---

### 2. Fan-out / Fan-in (병렬 조사 → 종합)

```
사용자 요청
    │
    ├──────────────────┐
    ▼                  ▼
🟣 Nana: 트렌드 조사   🟢 Green: 기술 분석
    │                  │
    └──────┬───────────┘
           ▼
    🔵 Blue: 종합 인포그래픽
```

**사용 예시**:
```bash
# 병렬 조사: Nana(트렌드) + Green(기술 분석) — 동시 실행
t1=$(hermes kanban create "AI 에이전트 트렌드 조사" \
  --assignee nana \
  --body "..." \
  --workspace dir:/home/leehg/Documents/AgentreeCompany/RND_Team \
  --format json | jq -r '.task_id')

t2=$(hermes kanban create "AI 에이전트 기술 스택 분석" \
  --assignee green \
  --body "목표: 주요 오픈소스 AI 에이전트 프레임워크 기술 분석
입력: 없음 (Nana와 독립적)
완료 기준: BlogTeam/ 디렉토리에 분석 마크다운 저장" \
  --workspace dir:/home/leehg/Documents/AgentreeCompany/BlogTeam \
  --format json | jq -r '.task_id')

# 종합: Blue — 부모가 t1, t2 (둘 다 완료되어야 시작)
hermes kanban create "종합 인포그래픽 제작" \
  --assignee blue \
  --body "목표: Nana의 트렌드 조사 + Green의 기술 분석을 하나의 인포그래픽으로 통합
입력: t1, t2 결과
완료 기준: DesignTeam/ 디렉토리에 PNG 저장" \
  --parents $t1 $t2 \
  --workspace dir:/home/leehg/Documents/AgentreeCompany/DesignTeam
```

---

### 3. 병렬 제작 (글 ↔ 삽화)

```
사용자 요청
    │
    ├──────────────────┐
    ▼                  ▼
🟢 Green: 블로그 글     🔵 Blue: 삽화 제작
    │                  │
    └──────┬───────────┘
           ▼
    🟢 Green: 내용화 (최종 조립)
           │
           ▼
    🟡 Yellow: 결과 종합
```

---

## 🔧 Kanban 명령어 파라미터

### `hermes kanban create` — 태스크 생성

| 파라미터 | 타입 | 필수 | 설명 | 예시 |
|----------|------|------|------|------|
| `<title>` | string | ✅ | 태스크 제목 | `"AI 트렌드 조사"` |
| `--assignee` | string | ✅ | 담당 프로필 이름 | `nana`, `green`, `blue` |
| `--body` | string | ✅ | 태스크 설명 (목표·입력·완료 기준 포함) | `"목표: ... 입력: ... 완료 기준: ..."` |
| `--parent` | string | ❌ | 단일 부모 태스크 ID | `t_abc123def` |
| `--parents` | string[] | ❌ | 다중 부모 태스크 ID (모두 완료 시 시작) | `t_abc123 t_def456` |
| `--workspace` | string | ✅ | 작업 디렉토리 (dir: 접두사 필수) | `dir:/home/leehg/Documents/AgentreeCompany/RND_Team` |
| `--format` | string | ❌ | 출력 형식 (`json`) | `json` |
| `--goal-mode` | flag | ❌ | 목표 달성까지 자동 재시도 | — |

### `hermes kanban list` — 보드 현황

| 파라미터 | 타입 | 설명 | 예시 |
|----------|------|------|------|
| `--assignee` | string | 특정 프로필로 필터링 | `nana` |
| `--status` | string | 상태별 필터링 | `ready`, `running`, `blocked` |
| `--limit` | int | 최대 표시 개수 | `20` |

### `hermes kanban show` — 태스크 상세

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `<task_id>` | string | 조회할 태스크 ID |

### `hermes kanban tail` — 실시간 활동 로그

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `<task_id>` | string | (선택) 특정 태스크만 추적 |

---

## 📊 태스크 상태 다이어그램

```
       생성
        │
        ▼
   ┌─ todo ──────────────────────┐
   │  (부모 태스크 대기 중)        │
   │                              │
   │  모든 부모 완료 → 자동 전환   │
   └──────────┬──────────────────┘
              ▼
          ready ──────────┐
          (디스패처 대기)   │ reclaim
              │           │
              ▼           │
          running ────────┤ crash/timed_out
          (작업 중)        │ → ready 로 복귀
              │           │
         ┌────┴────┐      │
         ▼         ▼      │
      done     blocked ───┘
      (완료)   (차단)  unblock → ready
         │         │
         ▼         ▼
      archived  archived
```

---

## 📁 산출물 규칙

| 팀 | 디렉토리 | 파일명 패턴 | 예시 |
|----|----------|-------------|------|
| 🟣 Nana | `RND_Team/` | `YYYY-MM-DD_<주제>_research.md` | `2026-07-03_ai-trends_research.md` |
| 🟢 Green | `BlogTeam/` | `YYYY-MM-DD_<주제>_post.md` (초안: `_draft.md`) | `2026-07-03_ai-trends_post.md` |
| 🔵 Blue | `DesignTeam/` | `YYYY-MM-DD_<주제>_<유형>.<확장자>` | `2026-07-03_ai-trends_infographic.png` |

---

## 🟡 Yellow 지휘자 워크플로우

### 전체 프로세스

```
1. 요청 수신
       │
2. 작업 분해 (패턴 선택)
       │
3. Kanban 태스크 생성 (의존성 연결)
       │
4. 진행 모니터링 (list / tail / show)
       │
5. Block 해결 (blocked 태스크 → unblock)
       │
6. 결과 종합 (산출물 수집·검수)
       │
7. 사용자에게 전달
```

### 모니터링 명령어

```bash
# 전체 보드 확인
hermes kanban list

# 실시간 활동 로그
hermes kanban tail

# 특정 태스크 상태 + 댓글 스레드
hermes kanban show <task_id>

# 통계
hermes kanban stats
```

### Slack 보고 (Yellow → Home Channel)

```bash
# 태스크 할당 시
hermes send -t slack "🟣 Nana: 'AI 트렌드 조사' → 🟢 Green: '블로그 원고' (Nana 완료 후) → 🔵 Blue: '인포그래픽' (Green 완료 후)"

# 완료 시
hermes send -t slack "✅ AI 트렌드 파이프라인 완료! 결과: ~/Documents/AgentreeCompany/DesignTeam/2026-07-03_ai-trends_infographic.png"
```

---

## 💡 모범 사례 (Best Practices)

1. **태스크 body는 항상 채울 것**: 목표·입력·완료 기준을 반드시 명시
2. **workspace는 dir: 접두사 필수**: `dir:/absolute/path`
3. **의존성은 --parent 로**: prose로 "task-1 끝나면" 쓰지 말고 `--parent`로 연결
4. **Block 방치 금지**: blocked 태스크는 즉시 확인하고 unblock
5. **crash 반복 시 재할당**: 동일 태스크 2회 이상 crash는 body를 더 구체화하여 재할당

---

## 🐛 트러블슈팅

| 증상 | 원인 | 해결 |
|------|------|------|
| 태스크가 `ready`에서 멈춤 | 디스패처가 프로필을 찾지 못함 | `hermes profile list`로 프로필 존재 확인 |
| 태스크가 `todo`에서 멈춤 | 부모 태스크 미완료 | `hermes kanban show <parent_id>`로 부모 상태 확인 |
| Worker가 crash 반복 | 모델/스킬 문제, 메모리 부족 | `hermes kanban reclaim <id>` → body 구체화 후 재할당 |
| Body가 빈 태스크 | Worker가 block됨 | `hermes kanban tail <id>` 로 질문 확인 → unblock |

---

## 관련 문서

- 전체 파이프라인: `~/Documents/letscoding-pipeline.md`
- 팀 AGENTS: `~/Documents/AgentreeCompany/{RND_Team,BlogTeam,DesignTeam}/AGENTS.md`
- Kanban DB: `~/.hermes/kanban.db`
- Skill 위치: `~/.hermes/profiles/yellow/skills/agentree-pipeline/SKILL.md`

---

*문서 버전: 1.0 · 마지막 수정: 2026-07-03*
