# 🎭 Agentree Operations Dashboard

hermes kanban 파이프라인의 **실행 히스토리·진행현황**을 보여주는 정적 대시보드.
배포 대상: <https://agentsoperation.netlify.app/>

## 구조

```
dashboard/
├── netlify.toml            # publish=site, data.json no-cache 헤더
├── scripts/
│   ├── export_data.py      # ~/.hermes/kanban.db → site/data.json 스냅샷
│   └── deploy.sh           # export + netlify 프로덕션 배포
└── site/                   # 배포되는 정적 사이트
    ├── index.html
    ├── app.css
    ├── app.js
    └── data.json           # 마지막 export 시점의 스냅샷
```

데이터 소스는 로컬 SQLite(`~/.hermes/kanban.db`)이므로, Netlify에 올라가는 것은
**export 시점의 스냅샷**입니다. 대시보드 상단에 데이터 기준 시각이 표시되고,
1시간 이상 오래되면 경고색으로 바뀝니다.

## 배포 방법

최초 1회 Netlify 인증:

```bash
npx --yes netlify-cli login              # 브라우저 열림
# 또는 토큰 방식 (헤드리스 환경 권장):
export NETLIFY_AUTH_TOKEN=<personal-access-token>
```

이후 배포는 한 줄:

```bash
~/Documents/AgentreeCompany/dashboard/scripts/deploy.sh
```

## 자동 갱신 (선택)

hermes cron 또는 시스템 crontab으로 주기 배포:

```bash
# 매시 정각에 스냅샷 갱신 + 배포 (NETLIFY_AUTH_TOKEN 필요)
crontab -e
0 * * * * NETLIFY_AUTH_TOKEN=<token> /home/leehg/Documents/AgentreeCompany/dashboard/scripts/deploy.sh >> /tmp/agentree-dashboard-deploy.log 2>&1
```

## 로컬 미리보기

`file://` 로 열면 `fetch(data.json)` 이 차단되므로 로컬 서버로 서빙:

```bash
cd ~/Documents/AgentreeCompany/dashboard/site
python3 -m http.server 8899
# → http://localhost:8899
```

## 대시보드 구성

- **KPI 행** — 파이프라인 수, 태스크 완료율, 실행 중, 런 성공률, 평균 소요
- **진행 현황** — 스냅샷 시점의 활성(running/blocked/ready/todo) 태스크와 최신 heartbeat 노트
- **차트** — 일별 실행 결과(완료/차단/크래시), 에이전트별 실행 결과
- **파이프라인 히스토리** — task_links 연결 성분 기준 그룹. 카드를 펼치면
  태스크별 런 시도 이력, 이벤트 타임라인, 코멘트가 보입니다
- **전체 태스크 표** — 접근성용 테이블 뷰 (차트의 모든 값 도달 가능)

필터(기간·에이전트)는 아래 모든 섹션에 동일하게 적용됩니다.
시간대는 Asia/Seoul 고정입니다.
