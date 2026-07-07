# Higgsfield MCP 종합 조사

조사일: 2026-07-06 23:11 KST  
작성자: Nana / RND_Team  
상태: 공개 문서·설치 패키지·로컬 운영 문서 기반 조사 완료. 단, 이 Nana 실행 세션의 도구 스키마에는 `mcp_higgsfield_*` 호출 함수가 노출되지 않았고 Nana 프로필 설정의 Higgsfield 키는 `***` 형태로 마스킹되어 있어, 실제 생성/조회 MCP 호출은 실패 로그로만 확인했다. Purple 프로필/ContentsTeam `.env`에는 별도 Higgsfield 키가 존재하지만, 비밀값을 읽거나 출력하지 않는 원칙 때문에 사용하지 않았다.

---

## 1. 핵심 요약

- Higgsfield는 이미지·비디오·보이스/오디오 생성 모델을 하나의 API로 제공하는 generative media 플랫폼이다. 공식 문서는 “100+ generative models”, 이미지·비디오·voice/audio 생성, 자동 스케일링, 비동기 request queue 방식을 강조한다.
- 설치된 MCP 패키지는 `higgsfield-mcp` v0.2.0이며, `@modelcontextprotocol/sdk` 기반 stdio MCP 서버다. 로컬 설치 경로는 `/home/leehg/.hermes/node/lib/node_modules/higgsfield-mcp`.
- MCP 서버 소스 기준 사용 가능한 tool은 20개다. Hermes 로그에는 “22 tool(s)”로 기록되어 있으나, 설치된 `src/server.js`에서 확인되는 `server.tool(...)` 등록은 20개였다.
- 주요 이미지 모델: Soul, Reve, ByteDance Seedream v4, Seedream v4 Edit.
- 주요 비디오 모델: DoP lite/turbo/standard, Higgsfield DoP Standard(new API), Kling v2.1 Pro, ByteDance Seedance v1 Pro, Speak v2 Talking Head.
- 비용 정보는 출처별로 차이가 있다.
  - MCP README: Image 720p 1.5 credits/$0.09, Image 1080p 3 credits/$0.19, Video lite 2 credits/$0.13, Video turbo 6.5 credits/$0.41, Video standard 9 credits/$0.56, Character 40 credits/$2.50.
  - Agentree 운영 skill: 이미지 10~60 credits, 영상 100~300 credits, 토킹헤드 500~1000+ credits로 더 보수적으로 안내. 실제 운영 판단은 generation 거부 메시지(`Not enough credits`)와 Higgsfield dashboard 기준으로 해야 한다.

---

## 2. 출처 목록

| 구분 | URL/파일 | 확인 내용 |
|---|---|---|
| Higgsfield 공식 사이트 | https://higgsfield.ai | AI-native creative suite, images/videos/voice, 30+ models 및 40+ creative tools 홍보 문구 확인 |
| Higgsfield API introduction | https://docs.higgsfield.ai/docs/index.md | 100+ generative models, image/video/voice/audio, unified integration point |
| API 사용 가이드 | https://docs.higgsfield.ai/docs/how-to/introduction.md | Base URL, async request-response, status/cancel endpoint, 상태값 |
| 이미지 가이드 | https://docs.higgsfield.ai/docs/guides/images.md | Soul/Reve 등 text-to-image 모델, prompt best practices |
| 비디오 가이드 | https://docs.higgsfield.ai/docs/guides/video.md | DoP/Seedance/Kling image-to-video 모델 및 예시 endpoint |
| FAQ | https://docs.higgsfield.ai/docs/help/faq.md | 결과물 7일 보관, 실패/NSFW 과금 없음, rate limit은 plan/model별 상이 |
| SDK 문서 | https://docs.higgsfield.ai/docs/how-to/sdk.md | Python SDK, `HF_KEY`/`HF_API_KEY`+`HF_API_SECRET`, subscribe/submit 패턴 |
| MCP package README | `/home/leehg/.hermes/node/lib/node_modules/higgsfield-mcp/README.md` | 설치법, 도구 목록, 크레딧 표, job polling 방식 |
| MCP source | `/home/leehg/.hermes/node/lib/node_modules/higgsfield-mcp/src/server.js`, `src/client.js` | 실제 tool schema, endpoint, 파라미터, model id 확인 |
| Purple AGENTS | `/home/leehg/Documents/AgentreeCompany/ContentsTeam/AGENTS.md` | Agentree 팀 내 Higgsfield MCP 사용 담당 및 도구 요약 |
| Yellow skill | `/home/leehg/.hermes/profiles/yellow/skills/productivity/agentree-contents-pipeline/SKILL.md` | 운영상 크레딧 가이드, credential 함정, Purple 라우팅 |

---

## 3. Higgsfield 개요

공식 문서 기준 Higgsfield API는 “cutting-edge generative media models”를 단일 통합 지점으로 제공하는 플랫폼이다. 이미지, 비디오, voice, audio 생성을 포괄하며, 모델 컬렉션은 계속 업데이트된다. API는 개별 모델별 고유 `model_id`를 `https://platform.higgsfield.ai/{model_id}`로 호출하는 구조다.

공식 사이트 메타 설명 기준 Higgsfield 웹 제품은 텍스트 prompt 또는 reference 기반 이미지·비디오·voice content 생성, media editing/upscaling, AI agent 기반 creative workflow automation, web/mobile 생성을 제공한다. 사이트 structured data에는 “AI video and image generation platform with 30+ models including Sora 2, Kling 3.0, Veo 3.1. Face swap, virtual try-on, cinema studio, 40+ creative AI tools. 4.5M video generations per day.”라는 설명도 포함되어 있었다.

API 처리 방식은 비동기 queue다.

1. generation request 제출
2. `request_id` 반환
3. status endpoint polling 또는 webhook으로 완료 확인
4. 완료 시 images/video URL 수령
5. queued 상태에서만 cancel 가능

---

## 4. 설치 상태 및 구성

| 항목 | 확인 결과 |
|---|---|
| npm package | `higgsfield-mcp` |
| 설치 버전 | 0.2.0 |
| 설치 경로 | `/home/leehg/.hermes/node/lib/node_modules/higgsfield-mcp` |
| binary | `/home/leehg/.hermes/node/bin/higgsfield-mcp` |
| main | `src/server.js` |
| Node requirement | Node.js 18+ |
| dependencies | `@modelcontextprotocol/sdk ^1.12.1`, `dotenv ^16.4.7` |
| Hermes config | `mcp_servers.higgsfield.command: /home/leehg/.hermes/node/bin/higgsfield-mcp` 확인. 다만 Nana에서 보이는 config 값은 `***`로 마스킹되어 API 호출에는 사용할 수 없었다. |
| Hermes log | `tools.mcp_tool: MCP server 'higgsfield' (stdio): registered 22 tool(s)` 기록 확인 |
| Nana 세션 tool schema | 현재 이 작업 세션의 사용 가능 도구 목록에는 `mcp_higgsfield_*` 함수가 노출되지 않음 |

설치 패키지 README는 Claude Desktop/Claude Code 설정 예시에서 `HF_API_KEY`, `HF_SECRET` 환경변수를 요구한다. 공식 Python SDK 문서는 `HF_KEY` 또는 `HF_API_KEY` + `HF_API_SECRET`를 안내한다. 설치된 MCP client 구현은 header에 `hf-api-key`, `hf-secret`, `Authorization: Key {apiKey}:{secret}`를 모두 넣는다.

---

## 5. 실제 MCP/API 호출 시도 결과

이번 Nana 작업 세션에서는 MCP 도구가 직접 노출되지 않아 `mcp_higgsfield_list_styles`, `mcp_higgsfield_list_motions` 같은 함수를 호출할 수 없었다. 대체로 설치된 client를 직접 실행해 보았으나, Nana에서 접근 가능한 config 값은 마스킹되어 실패했다.

| 시도 | 명령/방법 | 결과 | 의미 |
|---|---|---|---|
| Hermes tool listing | `hermes tools` | “requires an interactive terminal” | 비대화형 subprocess에서는 Hermes tool 목록 확인 불가 |
| Python `urllib` 직접 API | `/v1/text2image/soul-styles`, `/v1/motions`, `/v1/custom-references/list` | HTTP 403 Cloudflare Error 1010 `browser_signature_banned` | Python UA/환경이 Cloudflare 정책에 차단됨. retry 권장 안 함으로 응답 |
| Node + 설치 client | `HiggsfieldClient.listStyles/listMotions/listCharacters` | HTTP 422 `hf-api-key` UUID parsing error, input `***` | Nana에서 읽힌 config는 실제 키가 아니라 마스킹 placeholder |
| MCP binary 직접 실행 | `/home/leehg/.hermes/node/bin/higgsfield-mcp --help` | `Warning: Missing HF_API_KEY and/or HF_SECRET environment variables.` | 현재 terminal 환경에는 HF env가 주입되지 않음 |
| Purple credential 존재 확인 | `/home/leehg/.hermes/profiles/purple/.env`, `ContentsTeam/.env` 존재 여부만 확인 | 두 파일 모두 `HF_API_KEY`, `HF_SECRET` 존재, ellipsis 없음 | Purple 실행 프로필에서 실제 MCP 호출 가능성이 높음. 비밀값은 읽거나 출력하지 않음 |

따라서 "실제 생성 결과물" 또는 "실제 list_styles/list_motions 응답 payload"는 이번 Nana 세션만으로는 확보하지 못했다.

### 5.1 Purple Live 검증 결과 (2026-07-06, task t_9494a660)

Nana의 후속 task `t_9494a660`에서 Purple 프로필로 실제 MCP 도구 호출을 수행하여 다음 결과를 확보했다. 전체 상세는 `/home/leehg/Documents/AgentreeCompany/RND_Team/higgsfield-mcp-live-results.md` 참조.

| 호출 | 결과 | 비고 |
|---|---|---|
| `mcp_higgsfield_debug_credentials()` | ✅ `api_key_configured: true`, `secret_configured: true`, `api_key_preview: 1df8b3f3...` | Purple credentials 정상 작동 확인 |
| `mcp_higgsfield_list_styles()` | ✅ **106개** style preset 확보 | style_id, name, description, preview_url 모두 존재 |
| `mcp_higgsfield_list_motions()` | ✅ **121개** motion preset 확보 | motion_id, name, description, preview_url, start_end_frame 모두 존재 |
| `mcp_higgsfield_list_characters()` | ✅ 0개 (정상 — 아직 생성된 캐릭터 없음) | 40 credits/$2.50 필요 |

**핵심 교훈**: Nana 세션에 MCP tool이 노출되지 않더라도 Purple 프로필은 정상적으로 모든 Higgsfield MCP 도구를 사용할 수 있다. 향후 Higgsfield 관련 모든 호출(조회·생성)은 Purple에게 할당해야 한다.

---

## 6. MCP 도구 목록 및 파라미터

아래 표는 설치된 `src/server.js`에서 확인한 실제 tool schema 기준이다. Hermes MCP wrapper에서는 일반적으로 `mcp_higgsfield_<tool_name>` 형태로 노출된다.

### 6.1 이미지 생성/편집

| MCP tool | 모델/endpoint | 주요 파라미터 | 결과 ID | 설명/제약 |
|---|---|---|---|---|
| `mcp_higgsfield_generate_image` | Soul old API `/v1/text2image/soul` | `prompt` string, `quality` enum `720p`/`1080p` default `1080p`, optional `character_id`, optional `style_id` | `job_set_id` | 고품질 text-to-image. style preset 및 character reference 사용 가능. 내부 default `width_and_height=2048x1152`, `batch_size=1`, `enhance_prompt=false`. |
| `mcp_higgsfield_generate_image_reve` | Reve `/reve/text-to-image` | `prompt`, `aspect_ratio` enum `1:1`/`16:9`/`9:16`/`4:3`/`3:4` default `16:9`, `resolution` enum `720p`/`1080p` default `1080p`, optional `webhook_url` | `request_id` | 범용 text-to-image. new unified API. |
| `mcp_higgsfield_generate_image_seedream` | ByteDance Seedream v4 `/bytedance/seedream/v4/text-to-image` | `prompt`, `aspect_ratio`, `resolution`, optional `camera_fixed`, optional `webhook_url` | `request_id` | Seedream v4 text-to-image. `camera_fixed`로 카메라 고정 옵션 제공. |
| `mcp_higgsfield_edit_image_seedream` | Seedream v4 Edit `/bytedance/seedream/v4/edit` | `prompt`, `aspect_ratio`, `resolution`, optional `webhook_url` | `request_id` | 이미지 편집/변환용. 단, 현재 MCP schema에는 `image_url` 파라미터가 없다. prompt만 전달하는 구현이라 실제 edit API 요구사항과 불일치 가능성 점검 필요. |
| `mcp_higgsfield_upload_image` | `/files/generate-upload-url` + presigned PUT | `image_base64`, `content_type` enum `image/jpeg`/`image/png`/`image/webp` default `image/jpeg` | `public_url` | 로컬/생성 이미지를 Higgsfield hosting에 올려 비디오/캐릭터 tool의 public HTTPS URL로 사용. |

### 6.2 비디오/토킹헤드 생성

| MCP tool | 모델/endpoint | 주요 파라미터 | 결과 ID | 설명/제약 |
|---|---|---|---|---|
| `mcp_higgsfield_generate_video` | DoP old API `/v1/image2video/dop` | `image_url`, `motion_id`, optional `prompt`, `quality` enum `lite`/`turbo`/`standard` default `standard` | `job_set_id` | 공개 접근 가능한 HTTPS 이미지 필요. 5초 cinematic video. quality→model map: `lite=dop-lite`, `turbo=dop-turbo`, `standard=dop-preview`. motion preset 필수. 처리 20~60초 설명. |
| `mcp_higgsfield_generate_video_dop_standard` | Higgsfield DoP Standard `/higgsfield-ai/dop/standard` | `image_url`, `prompt`, optional `duration` int 2~10, optional `webhook_url` | `request_id` | new unified API. duration 2~10초. |
| `mcp_higgsfield_generate_video_kling` | Kling v2.1 Pro `/kling-video/v2.1/pro/image-to-video` | `image_url`, `prompt`, optional `webhook_url` | `request_id` | prompt는 camera movement/motion instructions. 공개 HTTPS source image 필요. |
| `mcp_higgsfield_generate_video_seedance` | ByteDance Seedance v1 Pro `/bytedance/seedance/v1/pro/image-to-video` | `image_url`, `prompt`, optional `webhook_url` | `request_id` | prompt는 movement/action description. 공개 HTTPS source image 필요. |
| `mcp_higgsfield_generate_talking_head` | Speak v2 old API `/v1/speak/higgsfield` | `image_url`, `audio_url`, `prompt`, `quality` enum `high`/`mid` default `high`, `duration` enum 5/10/15 default 5, `enhance_prompt` boolean default false, `seed` number 1~1,000,000 default 42 | `job_set_id` | portrait/headshot + WAV audio → lip-synced talking head. README 명시: audio는 WAV 필요, ffmpeg 변환 예시 제공. 처리 2~3분 설명. |

### 6.3 상태/제어/조회

| MCP tool | 파라미터 | 대상 | 설명 |
|---|---|---|---|
| `mcp_higgsfield_get_generation_status` | `job_set_id` | old API: Soul/DoP/TalkingHead | `queued`, `in_progress`, `completed`, `failed`, `nsfw` 상태. 결과 URL은 7일 보관. |
| `mcp_higgsfield_get_request_status` | `request_id` | new API: Reve/Seedream/Kling/Seedance/DoPStandard | `queued`, `in_progress`, `completed`, `failed`, `nsfw`, `cancelled`. 완료 시 `images` 또는 `video` 반환. |
| `mcp_higgsfield_cancel_request` | `request_id` | new API queued request | queued 상태에서만 취소 가능. in_progress는 취소 불가. |
| `mcp_higgsfield_list_styles` | 없음 | Soul style preset | `style_id`, `name`, `description`, `preview_url` 반환하도록 구현. 이번 세션에서는 실제 payload 미확보. |
| `mcp_higgsfield_list_motions` | 없음 | DoP motion preset | `motion_id`, `name`, `description`, `preview_url`, `start_end_frame` 반환하도록 구현. 이번 세션에서는 실제 payload 미확보. |
| `mcp_higgsfield_debug_credentials` | 없음 | credentials | `api_key_configured`, `secret_configured`, `api_key_preview`, `base_url` 반환. 비밀 전체값은 반환하지 않도록 구현. |

### 6.4 캐릭터 관리

| MCP tool | 파라미터 | 비용/제약 | 설명 |
|---|---|---|---|
| `mcp_higgsfield_create_character` | `name`, `image_urls` array 1~5 | README/source: 40 credits, $2.50 | 1~5 face image로 reusable character reference 생성. 상태 흐름: `not_ready → queued → in_progress → completed`. |
| `mcp_higgsfield_list_characters` | 없음 | page 1, page_size 50으로 구현 | created character 목록: `character_id`, `name`, `status`, `thumbnail_url`, `created_at`. |
| `mcp_higgsfield_get_character` | `character_id` | - | 단일 character 상세. |
| `mcp_higgsfield_delete_character` | `character_id` | irreversible | character reference 영구 삭제. |

---

## 7. 모델별 비교

### 7.1 이미지 모델

| 모델 | MCP tool | 강점 | 입력 | 출력/상태 | 추천 용도 |
|---|---|---|---|---|---|
| Soul | `generate_image` | Higgsfield flagship/고품질 이미지, style preset·character reference 연동 | text prompt, quality, optional style/character | `job_set_id` → old status | 브랜드 이미지, 광고 키비주얼, 캐릭터 일관성이 필요한 시리즈 |
| Reve | `generate_image_reve` | 범용 text-to-image, 단순 unified API | prompt, aspect_ratio, resolution | `request_id` → new status | 빠른 일반 이미지 생성, 모델간 비교용 baseline |
| Seedream v4 | `generate_image_seedream` | ByteDance 계열 이미지 모델, `camera_fixed` 옵션 | prompt, aspect_ratio, resolution, camera_fixed | `request_id` | 움직임/영상화 전 단계의 안정된 구도 이미지, 다양한 비율 출력 |
| Seedream v4 Edit | `edit_image_seedream` | 이미지 편집/변환 목적 | prompt, aspect_ratio, resolution | `request_id` | 편집/리터칭. 단 현재 MCP wrapper에는 image input schema가 없어 검증 필요 |

공식 이미지 가이드는 prompt 작성 시 구체성, 스타일/무드/색/구도 명시, “photorealistic/watercolor/digital art” 같은 style keyword, “highly detailed/8k/professional” 등 quality modifier 사용을 권장한다.

### 7.2 비디오 모델

| 모델 | MCP tool | 강점 | 입력 | duration/품질 | 추천 용도 |
|---|---|---|---|---|---|
| DoP old API | `generate_video` | motion preset 기반 image-to-video, cinematic motion | public HTTPS image, `motion_id`, optional prompt | 5초 설명, quality `lite/turbo/standard` | 프리셋 기반 안정적 카메라/모션 적용 |
| Higgsfield DoP Standard | `generate_video_dop_standard` | new unified DoP endpoint, prompt 중심 | image_url, prompt | duration 2~10초 optional | 프리셋보다 prompt로 직접 모션 지정할 때 |
| Kling v2.1 Pro | `generate_video_kling` | advanced cinematic animations | image_url, camera movement prompt | duration 파라미터 없음(MCP 기준) | 카메라 pan/zoom/orbit 등 영화적 움직임 |
| Seedance v1 Pro | `generate_video_seedance` | professional-grade video generation | image_url, movement/action prompt | duration 파라미터 없음(MCP 기준) | 인물 동작, 배경 움직임, 액션 묘사 |
| Speak v2 | `generate_talking_head` | portrait + WAV → lip sync talking head | image_url, WAV audio_url, prompt | 5/10/15초, high/mid | 아바타/인물 설명 영상, 릴스/쇼츠 내레이션 |

공식 비디오 가이드는 motion prompt에 이동 유형(pan/zoom/rotation), 속도(slowly/quickly/smoothly), camera action, atmospheric details(wind/water/lights)을 명확히 쓰라고 권장한다. Source image는 고품질, 선명한 주제와 좋은 구도, 낮은 compression, 목표 aspect ratio에 맞는 이미지를 권장한다.

---

## 8. 스타일/모션 프리셋

### 8.1 style preset

- 조회 tool: `mcp_higgsfield_list_styles`
- MCP resource: `higgsfield://styles`
- 반환 schema: `style_id`, `name`, `description`, `preview_url`
- 사용 위치: `mcp_higgsfield_generate_image`의 optional `style_id`
- **실제 payload (Purple Live)**: **106개** 스타일 확보 완료. 주요 예시로 `464ea177...` General(범용 기본), `1cb4b936...` Realistic(사실적), `710f9073...` 90's Editorial(레트로 매거진), `62355e77...` Glitch(디지털 노이즈), `0089e17c...` Japandi(미니멀리즘), `493bda5b...` Clouded Dream(몽환적) 등. 전체 목록과 용도별 추천은 `higgsfield-mcp-live-results.md` 섹션 3 참조.

### 8.2 motion preset

- 조회 tool: `mcp_higgsfield_list_motions`
- MCP resource: `higgsfield://motions`
- 반환 schema: `motion_id`, `name`, `description`, `preview_url`, `start_end_frame`
- 사용 위치: `mcp_higgsfield_generate_video`의 필수 `motion_id`
- **실제 payload (Purple Live)**: **121개** 모션 확보 완료. 주요 예시로 `31177282...` General(범용), `ea035f68...` 360 Orbit(카메라 회전), `2bae49e6...` 3D Rotation(피사체 회전), `81ca2cd2...` Dolly In(접근), `b604bd5f...` Super 8MM(노스탤지어), `2b7c1db3...` VHS(레트로), `a2046ff7...` Glam(슬로우모션), `0a5a48d7...` Levitation(부양) 등. `start_end_frame`은 121개 중 100개가 true, 21개가 false. 전체 목록과 용도별 추천은 `higgsfield-mcp-live-results.md` 섹션 4 참조.

### 8.3 공개 사이트에서 관찰된 preset 계열

Higgsfield public site HTML에는 community/gallery 및 preset 관련 데이터가 포함되어 있었고, 예시로 `Higgsfield Soul Cinema`, `DRIFT RACING`, `presetFamily: seedance`, `model: kling3_0`, `costCredits` 같은 필드가 관찰되었다. 다만 이것은 웹 앱 내부 데이터이며 MCP `list_styles/list_motions`의 정식 API 응답과 동일하다고 단정하면 안 된다.

---

## 9. 요금/크레딧 체계

### 9.1 MCP README 기준

| Operation | Credits | USD | 비고 |
|---|---:|---:|---|
| Image 720p | 1.5 | $0.09 | README 표 기준 |
| Image 1080p | 3 | $0.19 | README 표 기준 |
| Video lite | 2 | $0.13 | README 표 기준 |
| Video turbo | 6.5 | $0.41 | README 표 기준 |
| Video standard | 9 | $0.56 | README 표 기준 |
| Character one-time | 40 | $2.50 | create_character |

Top-up URL: https://cloud.higgsfield.ai/credits

### 9.2 Agentree 운영 skill 기준

| Tool | 종류 | 예상 credits | 비고 |
|---|---|---:|---|
| `generate_image` Soul | 이미지 | 10~50 | 가장 저렴한 편으로 운영 메모 |
| `generate_image_reve` Reve | 이미지 | 10~50 | 운영 메모 |
| `generate_image_seedream` | 이미지 | 20~60 | 운영 메모 |
| `generate_video` DoP | 영상 | 100~300 | 이미지→시네마틱 |
| `generate_video_kling` | 영상 | 100~300 | Kling v2.1 |
| `generate_video_seedance` | 영상 | 100~300 | Seedance v1 |
| `generate_talking_head` Speak v2 | 토킹헤드 | 500~1000+ | 가장 비쌈 — 립싱크+렌더링 |

두 표의 차이가 크므로 실제 작업 전에는 다음 순서로 확인해야 한다.

1. 가능한 가장 작은 resolution/duration으로 테스트
2. generation 실패 메시지 확인 (`Not enough credits` 등)
3. https://cloud.higgsfield.ai dashboard에서 현재 잔액/rate limit 확인
4. 대량 작업 전 산출물 수 × 모델별 예상 credits를 보수적으로 계산

공식 FAQ 기준 failed request와 NSFW request는 과금되지 않고 credits/cost가 refund된다. Rate limit은 subscription plan과 model usage에 따라 달라지며 dashboard에서 확인해야 한다.

---

## 10. 기타 기능 및 운영 주의점

### 10.1 결과 보관

- MCP README: 결과는 7일 보관.
- 공식 FAQ: generated output files는 생성 시점부터 최소 7일 접근 가능하며, 장기 보관은 자체 인프라에 다운로드 권장. 7일 이후 언제든 제거될 수 있다.

### 10.2 Webhook

- new API generation tools는 optional `webhook_url` 파라미터 제공.
- 공식 API 문서도 polling 대신 webhook 사용을 production best practice로 언급.

### 10.3 공개 URL 제약

- video/talking-head/character tools는 source image/audio URL이 public accessible HTTPS여야 한다.
- 로컬 이미지는 먼저 `upload_image`로 public URL을 만든 뒤 사용해야 한다.
- Talking Head audio는 WAV 형식 필요. README 예시: `ffmpeg -i speech.mp3 -acodec pcm_s16le -ar 44100 speech.wav`.

### 10.4 상태값 및 오류 처리

| 상태 | 의미 | 과금 |
|---|---|---|
| `queued` | 대기열 | 아직 완료 전 |
| `in_progress` | 처리 중 | cancel 불가 |
| `completed` | 성공, output URL 제공 | 과금 |
| `failed` | 생성 오류 | 공식 FAQ 기준 환불/비과금 |
| `nsfw` | moderation 실패 | 공식 FAQ 기준 환불/비과금 |
| `cancelled` | 취소됨(new API wrapper status) | queued에서만 취소 가능 |

### 10.5 Agentree 팀 라우팅

Agentree 운영 문서상 Higgsfield MCP를 사용하는 이미지/영상 생성은 Purple(ContentsTeam)의 담당 영역이다. Green에게 이미지/영상 생성을 맡기지 말고, Higgsfield MCP 필요 태스크는 Purple에게 할당하는 규칙이 있다. Nana는 조사/팩트체크 역할이므로, 실제 생성 payload·크레딧 테스트가 필요한 경우 Purple child task가 적합하다.

---

## 11. 확인된 문제/리스크

1. **Nana 세션에 MCP tool 미노출**
   - Hermes 로그상 Higgsfield MCP는 등록되었지만, 이 task runner의 tool schema에는 `mcp_higgsfield_*`가 없다.
   - 실제 `list_styles/list_motions` 호출 결과를 보고서에 넣으려면 Purple 프로필 또는 MCP toolset이 포함된 세션이 필요하다.

2. **Nana config의 credential masking**
   - `/home/leehg/.hermes/config.yaml`에서 Nana에게 보이는 값은 `***`였고, Node client 호출 시 실제로 API가 `hf-api-key: ***`를 받아 UUID parsing 422를 반환했다.
   - secret 전체값을 읽지 않는 원칙 때문에 Purple `.env`는 존재 여부만 확인했다.

3. **Cloudflare 1010**
   - Python `urllib` 직접 호출은 Cloudflare browser signature ban으로 403을 반환했다.
   - MCP/Node fetch 경로 또는 공식 SDK 경로에서는 다른 결과가 날 수 있다.

4. **README와 운영 skill의 credits 불일치**
   - MCP README의 credits는 매우 낮고, Yellow 운영 skill은 실제 작업 경험 기반으로 훨씬 보수적이다.
   - 실제 대량 생성 전에는 작은 테스트를 통해 dashboard와 generation response를 확인해야 한다.

5. **`edit_image_seedream` schema 의심점**
   - 도구 설명은 image edit지만 현재 MCP wrapper schema에는 입력 이미지 URL/base64 파라미터가 없다.
   - 실제 API가 image input을 요구한다면 wrapper 수정 또는 upstream 확인이 필요하다.

---

## 12. Purple에서 추가로 실행하면 좋은 검증 명령/도구 호출

Nana가 직접 실행하지 못한 필수 검증은 Purple 프로필에서 아래 순서로 진행하는 것이 좋다.

1. `mcp_higgsfield_debug_credentials()`
   - 기대: `api_key_configured: true`, `secret_configured: true`, `base_url: https://platform.higgsfield.ai`
2. `mcp_higgsfield_list_styles()`
   - 결과 중 style 10~20개를 `style_id/name/description` 표로 저장
3. `mcp_higgsfield_list_motions()`
   - 결과 중 motion 10~20개를 `motion_id/name/description/start_end_frame` 표로 저장
4. `mcp_higgsfield_list_characters()`
   - 개인 character reference가 있으면 ID는 부분 마스킹해 문서화
5. 비용 소모를 피하려면 생성 호출은 생략. 생성 확인이 꼭 필요하면 720p 이미지 1장만 생성하고 `get_request_status`/`get_generation_status`까지 polling.

---

## 13. 결론

Higgsfield MCP는 Agentree/Purple의 AI 이미지·비디오 제작 파이프라인에 바로 활용 가능한 도구이며, 설치된 패키지 기준 이미지 생성(Soul/Reve/Seedream), 이미지 편집(Seedream Edit), 비디오 생성(DoP/Kling/Seedance), 토킹헤드(Speak v2), 캐릭터 reference, upload, style/motion lookup, status/cancel을 포괄한다. 다만 이번 Nana 실행 환경에서는 MCP tool 자체와 실제 credentials가 노출되지 않아 style/motion의 실제 목록과 live generation 응답은 확보하지 못했다. 실제 제작 운영에는 Purple 프로필에서 `list_styles`/`list_motions`를 먼저 실행해 프리셋 ID를 확보하고, credits를 dashboard와 소규모 테스트로 확인하는 절차가 필요하다.
