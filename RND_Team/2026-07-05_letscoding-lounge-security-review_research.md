# 렛츠코딩 라운지 보안 검토 보고서

- 작성일: 2026-07-05
- 대상 코드베이스: `/home/leehg/Documents/workspace/letscoding_lounge`
- 검토 방식: 정적 코드 검토(Next.js API route, Supabase migration/RLS, storage, 사용자 콘텐츠 렌더링). 원격 DB 권한 상태와 운영 로그는 접속하지 않았으므로 실제 운영 DB와 마이그레이션 적용 상태가 다르면 결과가 달라질 수 있음.

## 핵심 요약

1. **일반적인 문자열 결합 SQL 인젝션 패턴은 크게 보이지 않지만**, `service role`/`SECURITY DEFINER`/public storage/API 권한 검증이 결합된 고위험 지점이 여러 곳 확인됨.
2. 가장 먼저 막아야 할 항목은 **SSRF 가능 API**, **비공개/제한 작품 파일 우회 조회 가능성**, **사용자 HTML을 메인 오리진에서 실행하는 구조**, **타인 지갑으로 광고/끌어올리기 RPC 호출 가능성**임.
3. 데이터 관리 측면에서는 Supabase RLS 자체보다 **서버 API가 service role로 RLS를 우회한 뒤 자체 권한 검사를 누락하거나 과도하게 허용하는 문제**가 주요 리스크임.
4. 이미지·ZIP 업로드는 일부 안전한 패턴도 있으나, API별 검증 수준이 달라 **SVG/위장 이미지/ZIP bomb/경로 오염** 리스크가 남아 있음.
5. 과제·학습노트 이미지처럼 원래 맥락상 제한되어야 할 수 있는 콘텐츠가 public bucket에 저장되어, URL 유출 시 DB 공개 상태와 무관하게 열람될 수 있음.

## 우선순위별 주요 발견

### P0 — 즉시 조치 권장

#### 1) 공개 OG 이미지 프록시의 SSRF 가능성

- 위험도: 높음
- 위치: `src/app/api/tools/og-image/route.ts:3-15`
- 근거:
  - `url` 쿼리 파라미터를 받아 `url.startsWith("http") ? url : https://${url}`로 대상 URL을 만들고 서버에서 직접 `fetch(target)`를 수행함.
  - localhost, 사설 IP, link-local/metadata IP, 리다이렉트 목적지 차단이 없음.
  - `await res.text()`로 응답 본문을 읽으므로 내부 서비스 탐색/메타데이터 접근/대용량 응답에 의한 자원 소모 가능성이 있음.
- 영향:
  - 외부 사용자가 서버 네트워크에서만 접근 가능한 리소스를 간접 요청하게 만들 수 있음.
- 권고:
  - `https:`만 허용하거나 명시 allowlist 도입.
  - DNS 해석 후 private/loopback/link-local/metadata IP 차단.
  - 리다이렉트 후 최종 URL도 재검증.
  - 응답 크기 제한, content-type 확인, 타임아웃 유지.

#### 2) `/play/{projectId}` 파일 서빙이 service role로 비공개/제한 작품을 우회 조회할 가능성

- 위험도: 높음
- 위치: `src/app/play/[projectId]/[[...path]]/route.ts:30-40`
- 근거:
  - 공개 GET 라우트가 `createAdminClient()`로 Supabase storage `projects` bucket에서 `${projectId}/${filePath}`를 직접 다운로드함.
  - 다운로드 전 `projects.is_published`, `is_restricted`, 소유자, teacher/admin 권한 확인이 없음.
- 영향:
  - projectId와 파일 경로를 알거나 추측할 수 있으면 DB의 공개/제한 상태와 무관하게 배포 파일 접근 가능.
- 권고:
  - storage 다운로드 전 프로젝트 공개 상태와 권한 확인.
  - 비공개/제한 작품은 owner/admin/담당 teacher만 허용.
  - 가능하면 service role 대신 RLS가 적용되는 client를 사용하거나, service role 사용 시 API 레이어 권한 검사를 필수화.

#### 3) 사용자 업로드 HTML/JS가 메인 앱 동일 오리진에서 실행됨

- 위험도: 높음
- 위치: `src/app/play/[projectId]/[[...path]]/route.ts:48-73`, `src/app/api/projects/deploy/route.ts:76-117`
- 근거:
  - 사용자가 업로드한 HTML/JS/CSS를 `/play/{projectId}`에서 `text/html`로 제공함.
  - CSP가 있으나 `script-src 'self' 'unsafe-inline' 'unsafe-eval' ...`, `connect-src 'self'`가 포함되어 업로드 HTML 내 스크립트가 메인 앱 API로 요청할 수 있는 구조.
- 영향:
  - 업로드 콘텐츠가 로그인 사용자의 쿠키를 동반해 `/api/...` 상태 변경 요청을 보낼 수 있음. API에 CSRF 방어가 일관되지 않으면 권한 오남용으로 이어질 수 있음.
- 권고:
  - 사용자 배포물은 별도 도메인/서브도메인에서 제공하고 쿠키 scope 분리.
  - `/play`를 iframe sandbox로 격리하거나 `Content-Security-Policy: sandbox` 검토.
  - 전체 상태 변경 API에 Origin/Sec-Fetch-Site 검증 또는 CSRF 토큰 적용.

#### 4) `SECURITY DEFINER` RPC가 `p_user_id`를 신뢰하여 타인 지갑 사용 가능성

- 위험도: 높음
- 위치:
  - `supabase/migrations/20260619020000_add_project_promotion.sql:35-80`, `83-166`
  - `supabase/migrations/20260620010000_remove_featured_slot_limit.sql:2-77`
- 근거:
  - `promote_project(p_project_id, p_user_id)`, `feature_project(p_project_id, p_user_id, p_days)`가 `SECURITY DEFINER`로 실행되고 `authenticated`에 EXECUTE 권한을 부여함.
  - 함수 내부에서 `auth.uid() = p_user_id` 검증이 없음. `v_owner <> p_user_id`만 확인하기 때문에 타인의 project_id와 user_id를 알면 타인 지갑으로 광고/끌어올리기 실행 가능성이 있음.
- 권고:
  - 함수 시작부에 `IF auth.uid() IS DISTINCT FROM p_user_id THEN RAISE EXCEPTION ...` 추가.
  - 가능하면 `p_user_id` 파라미터를 제거하고 함수 내부에서 `auth.uid()`만 사용.
  - `REVOKE ALL ON FUNCTION ... FROM public;` 후 필요한 role만 명시 GRANT.

### P1 — 단기 조치 권장

#### 5) 프로젝트 배포 ZIP 검증 부족

- 위험도: 중간~높음
- 위치: `src/app/api/projects/deploy/route.ts:76-117`
- 근거:
  - ZIP 내부 경로를 `relativePath = prefix ? path.replace(prefix, "") : path`로 만들고 그대로 `${projectId}/${path}`에 업로드함.
  - `../`, 선행 `/`, 역슬래시, 제어문자, 빈 segment 검증이 없음.
  - ZIP 파일 수, 단일 파일 크기, 총 압축 해제 크기 제한이 없음.
- 권고:
  - `normalizeDeployPath()` 같은 공통 검증 함수를 업로드와 다운로드 양쪽에 적용.
  - 파일 수/총량/단일 파일 크기 제한.
  - 허용 확장자 allowlist와 악성 HTML/JS 정책 재검토.

#### 6) 프로젝트 배포 삭제 API에서 teacher 권한이 과도함

- 위험도: 높음
- 위치: `src/app/api/projects/[projectId]/deploy/route.ts:55-76`
- 근거:
  - `isTeacher`이면 프로젝트 소유자가 아니어도 통과함.
  - 이후 service role storage 삭제 및 `projects.storage_path/external_url` null update 수행.
  - 담당 클래스/학생 관계 검증이 없음.
- 권고:
  - teacher 전체 허용 제거.
  - 담당 학생/클래스 프로젝트인지 서버에서 검증하거나 admin/owner로 제한.
  - update에도 `.eq("user_id", user.id)` 같은 소유 조건을 보강.

#### 7) 외부 실행 URL에 위험 scheme 저장/렌더링 가능

- 위험도: 높음
- 위치:
  - 저장: `src/app/api/projects/[projectId]/route.ts:102`, `142-153`
  - 렌더링: `src/app/works/[username]/[project]/page.tsx:342-346`, `src/components/projects/PlayLinkButton.tsx:21-26`
- 근거:
  - `external_url`은 trim만 하고 scheme allowlist 없이 DB 저장.
  - 이후 `<a href={href} target="_blank">`로 렌더링됨.
- 영향:
  - `javascript:`, `data:` 등 위험 scheme이 저장되면 클릭 기반 XSS/피싱 가능성.
- 권고:
  - 저장 시 `new URL()`로 파싱하고 `https:`/필요 시 `http:`만 허용.
  - 내부 배포 URL은 `/play/{uuid}` 패턴만 별도로 허용.
  - 렌더링 직전에도 방어적 검증 적용.

#### 8) 이메일 인증 코드 브루트포스/남용 방어 미흡

- 위험도: 높음
- 위치:
  - `src/app/api/auth/verify-code/route.ts:19-45`
  - `src/app/api/auth/send-code/route.ts:13-40`, `49-72`
- 근거:
  - verify-code의 “시도 횟수”는 실패 횟수가 아니라 최근 미검증 row 개수만 카운트함. 틀린 코드 입력 시 `attempt_count` 증가나 잠금 기록이 없음.
  - send-code는 email exact match 쿨다운만 적용하고 이메일 trim/lowercase 정규화, IP 기반 rate limit이 없음.
  - send-code 오류 응답에 `detail`을 포함해 내부 오류 메시지가 클라이언트로 노출됨.
- 권고:
  - `attempt_count`, `locked_until`, email+IP 기준 rate limit 추가.
  - 이메일 trim/lowercase 정규화와 형식 검증.
  - 사용자 응답은 일반화하고 상세 오류는 서버 로그에만 기록.

#### 9) public storage bucket으로 제한 콘텐츠 우회 열람 가능성

- 위험도: 중간~높음
- 위치:
  - 과제 댓글 이미지: `supabase/migrations/20260508150000_add_assignment_comment_images.sql:1-7`
  - 학습노트 이미지: `supabase/migrations/20260623000000_add_learning_note_images.sql:1-13`
- 근거:
  - `assignment-images`, `learning-note-images` bucket이 `public=true`.
  - 과제 댓글 이미지는 1:1/수업 맥락의 제한 콘텐츠일 수 있고, 학습노트는 pending/private 상태가 존재할 수 있음.
- 영향:
  - DB row RLS로 본문을 막아도 이미지 URL이 유출되면 인증 없이 접근 가능.
- 권고:
  - private bucket + signed URL 또는 storage.objects RLS 정책 적용.
  - 승인/공개된 콘텐츠만 public bucket으로 이동하는 방식 검토.

#### 10) 이미지 업로드 검증 수준이 API별로 다름

- 위험도: 중간
- 근거:
  - `src/lib/learning-note-images.ts:8`, `62-82`는 JPG/PNG/WebP allowlist, 크기, dimension 검증을 수행하는 좋은 패턴.
  - 반면 여러 이미지 업로드 API는 `image.type.startsWith("image/")` 또는 클라이언트 제공 MIME/확장자를 신뢰하는 패턴이 있어 SVG/위장 파일 가능성이 있음.
- 권고:
  - 이미지 업로드 검증을 `learning-note-images.ts` 수준의 공통 유틸로 통합.
  - SVG 금지, magic number 확인, 서버 측 재인코딩, 검증된 MIME 기반 확장자 사용.

### P2 — 중기 개선

#### 11) 투자/지갑성 API의 read-modify-write 경쟁 조건

- 위험도: 높음(금융성 포인트 무결성 기준)
- 위치 예: `src/app/api/investment/buy/route.ts`, `src/app/api/investment/invest/route.ts`, `src/app/api/investment/sell/route.ts`
- 근거:
  - 잔액/보유 수량 조회 후 별도 update/insert가 수행되는 구조로 보이며, 동시 요청 시 이중 차감 회피/잔액 꼬임/초과 매수·매도 가능성이 있음.
- 권고:
  - DB RPC 단일 트랜잭션으로 이전.
  - `SELECT ... FOR UPDATE` 또는 `UPDATE ... WHERE balance >= amount` 조건부 갱신.
  - 지갑/보유/거래내역 변경을 한 트랜잭션으로 묶기.

#### 12) `classes`, `class_teacher_assignments`의 전체 로그인 사용자 공개

- 위험도: 중간
- 위치:
  - `supabase/migrations/20260508120000_add_classes.sql:26-33`
  - `supabase/migrations/20260628010000_add_class_teacher_assignments.sql:13-25`
- 근거:
  - `TO authenticated USING (true)`로 클래스 목록과 클래스-교사 매핑이 전체 로그인 사용자에게 공개됨.
- 권고:
  - 학생은 본인 class, 교사는 담당 class, admin은 전체로 제한.
  - 클래스명이 실제 학교/반/지점명 등 식별 정보를 담는 경우 공개 범위 축소.

#### 13) `createAdminClient()` 서버 전용 가드 부재

- 위험도: 낮음~중간
- 위치: `src/lib/supabase/admin.ts:1-9`
- 근거:
  - service role key를 사용하는 모듈에 `import "server-only";`가 없음.
  - 현재 client component 직접 import는 확인되지 않았지만, 향후 실수 방지 안전장치가 필요함.
- 권고:
  - 파일 최상단에 `import "server-only";` 추가.
  - ESLint/리뷰 규칙으로 client component에서 admin client import 금지.

## SQL 인젝션 관점 결론

- Next.js route 코드에서 전통적인 `SELECT ... ${userInput}` 형태의 직접 SQL 문자열 결합은 이번 정적 검색 범위에서는 뚜렷하게 확인되지 않음.
- Supabase query builder와 `.eq()`, `.insert()`, `.update()` 사용 자체는 일반 SQL injection 위험을 낮춤.
- 다만 실제 위험은 **SQL 인젝션보다 RLS 우회 권한(service role), SECURITY DEFINER 함수 인자 신뢰, public bucket, 동일 오리진 사용자 HTML 실행** 쪽이 큼.
- 따라서 “curl로 SQL 인젝션 넣었더니 바로 뚫림” 유형의 사고를 막기 위해서도, 단순 입력 escape보다 **권한 경계와 서버 API 방어**를 먼저 강화해야 함.

## 권장 조치 순서

1. `/api/tools/og-image` SSRF 차단 또는 임시 비활성화.
2. `/play/{projectId}`에서 프로젝트 공개/권한 확인 후 storage 다운로드하도록 수정.
3. `promote_project`, `feature_project` RPC에서 `auth.uid()` 검증 추가 및 권한 재부여.
4. 사용자 배포물 `/play`를 별도 오리진으로 분리하는 설계 결정. 단기적으로는 CSRF 방어와 CSP 강화.
5. ZIP 경로/크기/파일 수 검증 추가.
6. `external_url` scheme allowlist 적용.
7. public bucket 중 제한 콘텐츠 가능성이 있는 bucket을 private/signed URL 구조로 전환.
8. 이메일 인증 rate limit/attempt lockout 추가.
9. 이미지 업로드 공통 검증기 적용.
10. 지갑/투자성 연산을 DB 트랜잭션/RPC로 원자화.

## 출처/근거 파일 목록

- `/home/leehg/Documents/workspace/letscoding_lounge/src/app/api/tools/og-image/route.ts`
- `/home/leehg/Documents/workspace/letscoding_lounge/src/app/play/[projectId]/[[...path]]/route.ts`
- `/home/leehg/Documents/workspace/letscoding_lounge/src/app/api/projects/deploy/route.ts`
- `/home/leehg/Documents/workspace/letscoding_lounge/src/app/api/projects/[projectId]/deploy/route.ts`
- `/home/leehg/Documents/workspace/letscoding_lounge/src/app/api/projects/[projectId]/route.ts`
- `/home/leehg/Documents/workspace/letscoding_lounge/src/app/works/[username]/[project]/page.tsx`
- `/home/leehg/Documents/workspace/letscoding_lounge/src/components/projects/PlayLinkButton.tsx`
- `/home/leehg/Documents/workspace/letscoding_lounge/src/app/api/auth/verify-code/route.ts`
- `/home/leehg/Documents/workspace/letscoding_lounge/src/app/api/auth/send-code/route.ts`
- `/home/leehg/Documents/workspace/letscoding_lounge/src/lib/supabase/admin.ts`
- `/home/leehg/Documents/workspace/letscoding_lounge/src/lib/learning-note-images.ts`
- `/home/leehg/Documents/workspace/letscoding_lounge/supabase/migrations/20260619020000_add_project_promotion.sql`
- `/home/leehg/Documents/workspace/letscoding_lounge/supabase/migrations/20260620010000_remove_featured_slot_limit.sql`
- `/home/leehg/Documents/workspace/letscoding_lounge/supabase/migrations/20260508150000_add_assignment_comment_images.sql`
- `/home/leehg/Documents/workspace/letscoding_lounge/supabase/migrations/20260623000000_add_learning_note_images.sql`
- `/home/leehg/Documents/workspace/letscoding_lounge/supabase/migrations/20260508120000_add_classes.sql`
- `/home/leehg/Documents/workspace/letscoding_lounge/supabase/migrations/20260628010000_add_class_teacher_assignments.sql`
