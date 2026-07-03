# AI 에이전트(오픈소스) 트렌드 2026 조사

기준 시점: 2026-07-03 KST
작성 목적: Green의 글 정리와 Blue의 인포그래픽 제작을 위한 원자료. 수치는 GitHub API/공식 문서/공식 릴리스 페이지 확인 기준이며, 빠르게 변동될 수 있다.

---

## 1. 한 줄 결론

2026년 7월 현재 오픈소스 AI 에이전트 생태계는 “챗봇/데모”에서 “운영 가능한 작업 실행 인프라”로 이동하고 있다. 핵심 키워드는 멀티채널 게이트웨이, 장기 작업/백그라운드 실행, 워크플로·그래프 기반 오케스트레이션, 정책/보안/권한, 기업·공공 AX 도입이다.

---

## 2. 핵심 트렌드 요약

| 트렌드 | 관찰 내용 | 콘텐츠화 포인트 |
|---|---|---|
| 개인 비서형 에이전트의 OS화 | Hermes, OpenClaw처럼 터미널·데스크톱·메신저·웹 대시보드가 결합된 “항상 켜진 작업자” 형태가 부상 | “AI 에이전트는 앱이 아니라 업무 운영체제에 가까워지는 중” |
| 멀티에이전트/워크플로의 실무화 | CrewAI는 crews/flows, LangGraph는 그래프·체크포인트·스트리밍 안정성, AutoGPT는 빌더/코파일럿 플랫폼으로 진화 | “자율성보다 재현 가능한 실행 흐름과 관측 가능성이 중요해짐” |
| 배포·운영·거버넌스 경쟁 | 최근 릴리스들이 기능 추가만큼 보안 수정, 채널 안정성, 권한, 비용 제한, 관리자 기본값을 강조 | “POC 다음 병목은 성능보다 신뢰·권한·감사” |
| 코딩 에이전트와 채팅 채널의 결합 | Telegram/Slack/WhatsApp/iMessage 등에서 Codex/Claude류 코딩 워크플로를 시작·조정·회수하는 패턴 확산 | “IDE 안의 에이전트 → 메신저에서 부르는 원격 작업자” |
| 한국 시장은 공공·대기업 AX부터 확산 | 삼성SDS가 2026 Korea Public AI Expo에서 FabriX AI agent platform, Brity Works, AI Data Center 기반 공공 AI 전환 사례를 전시 | “국내 도입은 범용 개인 에이전트보다 업무·행정 자동화 패키지로 먼저 확산” |

---

## 3. 주요 오픈소스 AI 에이전트 프레임워크/플랫폼 동향

### 3.1 Hermes Agent

- 포지션: Nous Research의 오픈소스 AI 에이전트. 터미널, 메시징 플랫폼, IDE/ACP, 크론, 칸반, 스킬·메모리 등 “자기 개선형 작업 에이전트”를 지향한다.
- 2026-07-03 GitHub API 확인: 별 약 208,050개, 포크 약 37,853개, 최근 push 2026-07-03.
- 2026-07-01 v2026.7.1 / v0.18.0 “The Judgment Release”: 릴리스 노트는 P0/P1 이슈·PR 100% 정리, “작업이 실제로 끝났는지 판단하는 능력”, mixture-of-agents, judgment/verification 계열 개선을 강조한다.
- 2026-06-19 v0.17.0 “The Reach Release”: iMessage/RAFT 등 채널 확장, 데스크톱 앱, 백그라운드 subagent, 이미지 편집, 프로필 빌더 등을 강조한다.
- 해석: Hermes는 단일 프롬프트 실행기보다 “장기 기억 + 스킬 + 멀티플랫폼 + 작업 큐”를 묶은 개인/팀 운영 에이전트 쪽으로 차별화하고 있다.

출처:
- https://github.com/NousResearch/hermes-agent
- https://github.com/NousResearch/hermes-agent/releases/tag/v2026.7.1
- https://github.com/NousResearch/hermes-agent/releases/tag/v2026.6.19
- https://hermes-agent.nousresearch.com/docs

### 3.2 OpenClaw

- 포지션: “The AI that actually does things”를 내세우는 개인 AI assistant/gateway. WhatsApp, Telegram 등 채팅 앱에서 이메일, 일정, 체크인 등 실제 작업을 수행하는 방향을 강조한다.
- 2026-07-03 GitHub API 확인: openclaw/openclaw 별 약 381,491개, 포크 약 79,959개, 최근 push 2026-07-03.
- 2026-07-02 v2026.7.1-beta.1: GPT-5.6 model family 인식, external harness attachment, Telegram Codex workflow, event-driven cron, iOS native app refresh 등을 강조.
- 2026-06-30 v2026.6.11: Telegram, WhatsApp, Matrix, Google Chat, iMessage, Feishu, Mattermost, WebChat, Control UI, terminal UI 등 채널 delivery/reconnect reliability를 대대적으로 개선.
- 해석: OpenClaw는 “여러 채팅 채널에 붙는 에이전트 게이트웨이”와 “코딩/자동화 워크플로의 원격 조작”을 핵심 전장으로 삼고 있다.

출처:
- https://github.com/openclaw/openclaw
- https://github.com/openclaw/openclaw/releases/tag/v2026.7.1-beta.1
- https://github.com/openclaw/openclaw/releases/tag/v2026.6.11
- https://openclaw.ai/
- https://docs.openclaw.ai/

### 3.3 CrewAI

- 포지션: role-playing autonomous agents, crews, flows를 설계·배포하기 위한 프레임워크. 공식 문서는 “collaborative AI agents, crews, and flows — production ready from day one”을 전면에 둔다.
- 2026-07-03 GitHub API 확인: 별 약 54,792개, 포크 약 7,678개, 최근 push 2026-07-02.
- 최근 릴리스:
  - 2026-07-01 1.15.2a2: Bedrock extra에 aiobotocore 추가, flow agent options 문서화, streaming docs 추가, self-listening flow methods 거부.
  - 2026-06-30 1.15.2a1: inline skill definitions, stream frame protocol for flows, generated Flow Definition authoring skill, Agent Control Plane의 Cost Limit rule 문서화.
  - 2026-06-27 1.15.1: generated project의 Git repo 초기화, explicit CrewAI project definitions 요구, CLI deploy 후 deployment page open, scraping fetch SSRF redirect bypass 수정.
- 해석: CrewAI는 “여러 역할의 에이전트 협업”을 넘어서 flow 정의, 스트리밍 프로토콜, 비용 제한, 배포 UX 등 운영 기능을 강화 중이다.

출처:
- https://github.com/crewAIInc/crewAI
- https://github.com/crewAIInc/crewAI/releases/tag/1.15.2a2
- https://github.com/crewAIInc/crewAI/releases/tag/1.15.2a1
- https://github.com/crewAIInc/crewAI/releases/tag/1.15.1
- https://docs.crewai.com/

### 3.4 AutoGPT

- 포지션: “accessible AI for everyone”을 내세우며 AutoGPT Platform/Builder/Copilot 중심으로 발전. 초기의 자율 에이전트 상징에서, 2026년에는 자동화 빌더와 코파일럿 플랫폼으로 재정렬된 모습이다.
- 2026-07-03 GitHub API 확인: 별 약 185,286개, 포크 약 46,118개, 최근 push 2026-07-02.
- 최근 릴리스:
  - 2026-06-25 autogpt-platform-beta-v0.6.65: AutoPilot Context Panel, Global Search(Cmd+K), read-only Builder, Copilot Webhook Triggers, background “dream” pass, Discord/outbound delivery 계열 기능.
  - 2026-06-18 v0.6.64: 유사한 플랫폼 기능 업데이트와 webhook/builder/copilot 개선.
  - 2026-06-10 v0.6.63: agent building 전 goal decomposition step, credential mask forwarding, webhook preset auto-migration 등.
- 해석: AutoGPT는 “무작정 자율 실행”보다 사용자가 그래프/빌더에서 통제하고 코파일럿이 보조하는 플랫폼형 자동화로 이동했다.

출처:
- https://github.com/Significant-Gravitas/AutoGPT
- https://github.com/Significant-Gravitas/AutoGPT/releases/tag/autogpt-platform-beta-v0.6.65
- https://github.com/Significant-Gravitas/AutoGPT/releases/tag/autogpt-platform-beta-v0.6.64
- https://github.com/Significant-Gravitas/AutoGPT/releases/tag/autogpt-platform-beta-v0.6.63

### 3.5 LangGraph

- 포지션: LangChain 계열의 “resilient agents” 구축 프레임워크. 상태 그래프, 체크포인트, 스트리밍, durable execution을 통해 LLM 애플리케이션/에이전트를 안정적으로 운영하는 쪽에 초점.
- 2026-07-03 GitHub API 확인: 별 약 36,348개, 포크 약 6,080개, 최근 push 2026-07-01.
- 최근 릴리스:
  - 2026-06-30 1.2.7: DeltaChannel overwrite supersteps, Overwrite JSON roundtrip, valid UUIDs for exit-mode delta task_ids 등 안정성/정합성 수정.
  - 2026-06-18 1.2.6: nested subgraph checkpoint namespace 회귀 수정, v3 stream abort 시 running subgraphs cancel.
  - 2026-06-16 cli 0.4.30: compatible API version ranges 지원.
- 해석: LangGraph는 화려한 자율성보다 “중단/재개/상태/스트리밍/서브그래프 정합성”처럼 프로덕션 에이전트의 뼈대 문제를 해결하는 프레임워크로 자리 잡고 있다.

출처:
- https://github.com/langchain-ai/langgraph
- https://github.com/langchain-ai/langgraph/releases/tag/1.2.7
- https://github.com/langchain-ai/langgraph/releases/tag/1.2.6
- https://github.com/langchain-ai/langgraph/releases/tag/cli%3D%3D0.4.30
- https://langchain-ai.github.io/langgraph/

---

## 4. 최근 1개월 주목 릴리스/업데이트 타임라인

| 날짜 | 프로젝트 | 릴리스/업데이트 | 핵심 의미 |
|---|---|---|---|
| 2026-07-02 | OpenClaw | v2026.7.1-beta.1 | GPT-5.6 model family, external harness, Telegram Codex, event-driven cron 등 채널형 코딩/자동화 강화 |
| 2026-07-01 | Hermes | v2026.7.1 / v0.18.0 | P0/P1 정리, judgment/verification, 완료 판단 능력 강조 |
| 2026-07-01 | CrewAI | 1.15.2a2 | flow agent option, streaming docs, self-listening flow method 방지 |
| 2026-06-30 | OpenClaw | v2026.6.11 | 다수 메시징 채널의 delivery/reconnect reliability 개선 |
| 2026-06-30 | CrewAI | 1.15.2a1 | inline skill definitions, flow stream frame protocol, cost limit 문서화 |
| 2026-06-30 | LangGraph | 1.2.7 | 그래프 실행의 상태/JSON roundtrip/UUID 정합성 수정 |
| 2026-06-27 | CrewAI | 1.15.1 | 프로젝트 정의 명시화, deploy UX, SSRF redirect bypass fix |
| 2026-06-25 | AutoGPT | platform beta v0.6.65 | AutoPilot Context Panel, Cmd+K global search, read-only Builder, webhook trigger, proactive output |
| 2026-06-19 | Hermes | v0.17.0 | iMessage/RAFT, desktop app, background subagents, image edit, profile builder |
| 2026-06-18 | LangGraph | 1.2.6 | nested subgraph checkpoint, stream abort 시 subgraph cancel |
| 2026-06-18 | AutoGPT | platform beta v0.6.64 | Builder/Copilot/Webhook 계열 플랫폼 기능 개선 |
| 2026-06-10 | AutoGPT | platform beta v0.6.63 | goal decomposition, credential masking, webhook preset migration |
| 2026-06-05 | Hermes | v0.16.0 | native desktop app, multi-profile sessions, dashboard/desktop 표면 확장 |

---

## 5. 업계 주요 인물/기관의 발언·전망

### 5.1 Jensen Huang / NVIDIA

- NVIDIA GTC 2026 keynote 페이지는 Jensen Huang의 키노트 범위를 “accelerated computing and AI factories to open models, agentic systems, and physical AI”라고 설명한다. 즉 2026년 NVIDIA의 산업 방향성 설명에서 agentic systems가 AI factories, open models, physical AI와 같은 레벨의 핵심 축으로 다뤄진다.
- NVIDIA의 autonomous AI agents glossary는 에이전트를 “AI models that orchestrate and collaborate with other agents and utilize tools such as LLMs, RAG, vector databases, APIs, frameworks, and Python”로 설명하며, sandbox, identity controls, policy engines 같은 보안 인프라가 필요하다고 명시한다.
- 해석: Jensen/NVIDIA 관점에서 에이전트는 단순 앱 기능이 아니라 AI factory·기업 인프라 위에서 돌아가는 “작업 실행 계층”이다. 특히 enterprise agent는 모델 성능보다 tool access, permission, security, policy가 중요하다.

출처:
- https://www.nvidia.com/gtc/keynote/
- https://www.nvidia.com/en-us/glossary/ai-agents/

### 5.2 Andrej Karpathy

- Karpathy는 2026년에도 LLM/AI 교육 콘텐츠와 “Software 2.0” 이후의 소프트웨어 변화 논의를 이어가고 있다. “Software Is Changing (Again)” 강연/영상은 LLM이 코드를 생성하는 도구를 넘어, 자연어·프롬프트·데이터·에이전트적 워크플로가 소프트웨어 제작 방식을 바꾸는 흐름을 대표한다.
- 그의 과거 연구 이력에는 World of Bits: An Open-Domain Platform for Web-Based Agents(ICML 2017)가 있으며, 웹 기반 에이전트 문제의 초기 학술적 맥락을 제공한다.
- 해석: Karpathy의 관점은 “개발자가 코드를 한 줄씩 쓰는 방식”에서 “LLM과 함께 사양/의도/검증을 다루는 방식”으로 이동한다는 시사점을 준다. 이는 2026년 코딩 에이전트·에이전트 프레임워크가 verification, harness, state, task decomposition에 집중하는 흐름과 맞닿아 있다.

출처:
- https://www.youtube.com/watch?v=LCEmiRjPEtQ
- https://karpathy.ai/
- https://karpathy.medium.com/software-2-0-a64152b37c35
- http://proceedings.mlr.press/v70/shi17a/shi17a.pdf

---

## 6. 한국에서의 AI 에이전트 도입 현황

### 6.1 공공 AX와 대기업 SI 중심 확산

- 삼성SDS는 2026년 6월 25일 공식 뉴스에서 Korea Public AI Expo 2026 참가를 발표했다. 내용상 FabriX AI agent platform, Brity Works AI collaboration solution, AI Data Center를 기반으로 공공 행정/민원 지원 등 public AX use case를 전시했다.
- 해당 행사는 행정안전부와 NIA가 주최/주관한 공공 AI 행사로 설명되어, 한국에서는 공공기관의 행정 혁신·민원·협업 업무를 중심으로 AI 에이전트/AI 협업 솔루션이 소개되고 있음을 보여준다.
- 관찰 포인트: 국내 시장은 GitHub 오픈소스 프레임워크를 그대로 도입하기보다는, 대기업 SI/클라우드/데이터센터 패키지와 결합된 “업무 AX 솔루션” 형태로 도입되는 경향이 강하다.

출처:
- https://www.samsungsds.com/en/news/1294947_5252.html

### 6.2 기업 도입의 실제 병목

- 국내 기업/공공 도입에서 핵심은 “어떤 모델을 쓰는가”보다 다음 세 가지다.
  1. 내부 시스템 연동: 그룹웨어, 메일, 문서, ERP, 콜센터, 민원 시스템
  2. 권한/감사: 누가 어떤 데이터를 조회했고 어떤 작업을 실행했는지 추적
  3. 보안/망분리/데이터 거버넌스: 공공·금융·제조는 agent의 tool access가 곧 보안 리스크
- 따라서 한국형 AI 에이전트 시장은 오픈소스 프레임워크 단독보다 SI, 클라우드, 보안, 데이터센터, RAG/검색, 업무 자동화가 결합된 통합 패키지로 커질 가능성이 높다.

### 6.3 한국 콘텐츠 관점의 메시지

- “해외는 Hermes/OpenClaw/CrewAI/AutoGPT/LangGraph처럼 오픈소스 생태계가 빠르게 실험한다.”
- “한국은 삼성SDS 사례처럼 공공·기업 AX 프로젝트 안에서 에이전트가 업무 시스템에 흡수되는 방식으로 확산된다.”
- “따라서 한국 독자는 프레임워크 이름보다 ‘권한, 로그, 비용, 실패 복구, 기존 업무 시스템 연결’을 체크해야 한다.”

---

## 7. 프레임워크별 비교 표

| 프로젝트 | 강점 | 2026년 방향성 | 리스크/주의점 | 적합한 사용 사례 |
|---|---|---|---|---|
| Hermes | 스킬/메모리, 멀티플랫폼, 크론, 칸반, 자기개선 루프 | 개인/팀의 장기 작업 운영 에이전트 | 기능 폭이 넓어 설정·운영 복잡도 존재 | 연구, 개발, 운영 자동화, 멀티채널 개인 비서 |
| OpenClaw | 채팅 앱 기반 개인 assistant/gateway, 채널 통합 | WhatsApp/Telegram 등에서 실제 업무 실행 | 채널 안정성·보안·권한 관리가 핵심 | 메시징 기반 원격 작업, 개인/팀 assistant |
| CrewAI | role/crew/flow 기반 멀티에이전트 설계 | flow, streaming, deploy, cost limit 등 운영화 | 복잡한 crew 설계 시 디버깅/관측성 필요 | 업무 프로세스 자동화, 멀티역할 협업 워크플로 |
| AutoGPT | 대중적 인지도, Builder/Platform/Copilot | 그래프 빌더와 코파일럿 기반 자동화 플랫폼 | 초기 AutoGPT식 “무한 자율성” 기대와 현재 방향의 차이 | 비개발자/운영자용 자동화 빌더, webhook 기반 업무 자동화 |
| LangGraph | 상태 그래프, 체크포인트, durable execution | 프로덕션 에이전트의 상태/복구/스트리밍 안정성 | 직접 앱/UX를 만들어야 함 | 엔터프라이즈 LLM 앱, 안정적 agent backend |

---

## 8. Green/Blue용 콘텐츠 소재

### 제목 후보

1. 2026년 AI 에이전트는 어디까지 왔나: 오픈소스 5대 흐름 정리
2. 챗봇 다음은 업무 운영체제: Hermes·OpenClaw·CrewAI·AutoGPT·LangGraph 비교
3. AI 에이전트의 진짜 전쟁터는 모델이 아니라 권한·채널·워크플로다
4. 한국의 AI 에이전트 도입은 왜 “공공 AX”부터 시작될까

### 인포그래픽 구성 아이디어

- 중앙 키워드: “Agentic Systems = Model + Tools + Memory + Workflow + Permission + Channels”
- 좌측: 오픈소스 생태계 5개 프로젝트 비교
- 우측: 최근 1개월 릴리스 타임라인
- 하단: 한국 도입 체크리스트
  - 내부 시스템 연결
  - 권한/감사 로그
  - 실패 복구
  - 비용 제한
  - 보안 샌드박스

### 짧은 결론 문장

- “2026년 AI 에이전트의 핵심은 더 똑똑한 답변이 아니라, 안전하게 실제 일을 끝내는 능력이다.”
- “오픈소스는 빠르게 실험하고, 기업 시장은 권한·보안·운영으로 수렴한다.”
- “한국의 AI 에이전트 도입은 개인용 비서보다 공공·대기업 업무 AX에서 먼저 본격화되고 있다.”

---

## 9. 전체 출처 목록

### 프로젝트/문서

- Hermes Agent GitHub: https://github.com/NousResearch/hermes-agent
- Hermes Agent docs: https://hermes-agent.nousresearch.com/docs
- Hermes v2026.7.1 release: https://github.com/NousResearch/hermes-agent/releases/tag/v2026.7.1
- Hermes v2026.6.19 release: https://github.com/NousResearch/hermes-agent/releases/tag/v2026.6.19
- Hermes v2026.6.5 release: https://github.com/NousResearch/hermes-agent/releases/tag/v2026.6.5
- OpenClaw GitHub: https://github.com/openclaw/openclaw
- OpenClaw site: https://openclaw.ai/
- OpenClaw docs: https://docs.openclaw.ai/
- OpenClaw v2026.7.1-beta.1 release: https://github.com/openclaw/openclaw/releases/tag/v2026.7.1-beta.1
- OpenClaw v2026.6.11 release: https://github.com/openclaw/openclaw/releases/tag/v2026.6.11
- CrewAI GitHub: https://github.com/crewAIInc/crewAI
- CrewAI docs: https://docs.crewai.com/
- CrewAI 1.15.2a2 release: https://github.com/crewAIInc/crewAI/releases/tag/1.15.2a2
- CrewAI 1.15.2a1 release: https://github.com/crewAIInc/crewAI/releases/tag/1.15.2a1
- CrewAI 1.15.1 release: https://github.com/crewAIInc/crewAI/releases/tag/1.15.1
- AutoGPT GitHub: https://github.com/Significant-Gravitas/AutoGPT
- AutoGPT platform beta v0.6.65 release: https://github.com/Significant-Gravitas/AutoGPT/releases/tag/autogpt-platform-beta-v0.6.65
- AutoGPT platform beta v0.6.64 release: https://github.com/Significant-Gravitas/AutoGPT/releases/tag/autogpt-platform-beta-v0.6.64
- AutoGPT platform beta v0.6.63 release: https://github.com/Significant-Gravitas/AutoGPT/releases/tag/autogpt-platform-beta-v0.6.63
- LangGraph GitHub: https://github.com/langchain-ai/langgraph
- LangGraph docs redirect: https://langchain-ai.github.io/langgraph/
- LangGraph 1.2.7 release: https://github.com/langchain-ai/langgraph/releases/tag/1.2.7
- LangGraph 1.2.6 release: https://github.com/langchain-ai/langgraph/releases/tag/1.2.6
- LangGraph CLI 0.4.30 release: https://github.com/langchain-ai/langgraph/releases/tag/cli%3D%3D0.4.30

### 업계 전망/인물

- NVIDIA GTC 2026 Keynote: https://www.nvidia.com/gtc/keynote/
- NVIDIA Autonomous AI Agents glossary: https://www.nvidia.com/en-us/glossary/ai-agents/
- Andrej Karpathy “Software Is Changing (Again)” YouTube: https://www.youtube.com/watch?v=LCEmiRjPEtQ
- Andrej Karpathy website: https://karpathy.ai/
- Andrej Karpathy “Software 2.0”: https://karpathy.medium.com/software-2-0-a64152b37c35
- World of Bits paper: http://proceedings.mlr.press/v70/shi17a/shi17a.pdf

### 한국 도입

- Samsung SDS Korea Public AI Expo 2026 news: https://www.samsungsds.com/en/news/1294947_5252.html
