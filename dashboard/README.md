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

## 배포 / 데이터 갱신

**중요**: "데이터 기준" 시각은 배포 시각이 아니라 `export_data.py` 실행 시각입니다.
commit & push만 하면 예전 스냅샷이 그대로 올라가므로, **push 전에 반드시 export를 다시 실행**해야 합니다.

레포가 Netlify에 연결되어 있으면 (git push = 자동 배포) 한 줄로 끝:

```bash
~/Documents/AgentreeCompany/dashboard/scripts/publish.sh
# = export_data.py 실행 → data.json/assets 커밋 → push
```

Netlify CLI로 직접 배포하려면 (`npx netlify-cli login` 1회 필요):

```bash
~/Documents/AgentreeCompany/dashboard/scripts/deploy.sh
```

## 자동 갱신 (선택)

crontab으로 주기 갱신 (git push 방식이므로 토큰 불필요):

```bash
crontab -e
# 매시 정각에 스냅샷 갱신 + push
0 * * * * /home/leehg/Documents/AgentreeCompany/dashboard/scripts/publish.sh >> /tmp/agentree-dashboard-publish.log 2>&1
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
- **산출물** — 파이프라인별 폴더(디렉터리) 목록. 폴더를 클릭하면 해당
  파이프라인의 산출물만 표시됩니다 (`#outputs/<파이프라인id>` 해시 링크라
  뒤로가기·URL 공유 가능). 태스크에 연결되지 않은 파일은 "파이프라인 미연결"
  폴더로 묶입니다
- **파이프라인 히스토리** — task_links 연결 성분 기준 그룹. 카드를 펼치면
  태스크별 런 시도 이력, 이벤트 타임라인, 코멘트가 보입니다.
  카드의 "📁 산출물 N개" 링크로 해당 산출물 폴더로 이동합니다
- **전체 태스크 표** — 접근성용 테이블 뷰 (차트의 모든 값 도달 가능)

필터(기간·에이전트)는 아래 모든 섹션에 동일하게 적용됩니다.
시간대는 Asia/Seoul 고정입니다.
