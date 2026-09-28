# 작업 이력

## 2026-09-18 — 프로젝트 최초 스캐폴딩

**요청**: 옵시디언에 정리해둔 "이게누구야" 서비스 컨셉을 실제 앱으로 만들어보기로 함.

**경위**:
- 처음 컨셉은 CSV/vCard로 업로드한 연락처에 SMS로 확인 메시지를 보내는 방식이었음.
- 논의 중 "SMS로 안 했으면 좋겠다, 카카오톡이면 휴대폰에 저장 안 된 사람과의 관계도
  정리할 수 있다"는 방향 전환 요청이 있었음 → 카카오톡 친구목록 API로 대상을 가져오고,
  카카오톡 메시지 API(친구에게 메시지 보내기)로 발송하는 구조로 변경.
- 기존 등록된 카카오 관련 리소스(코레테일 오픈빌더 챗봇, 돌봄잇의 Kakao Login)를 확인했으나
  둘 다 "친구에게 메시지 보내기(talk_message)" 권한과는 무관함을 확인함. 새 앱 기준으로
  카카오 디벨로퍼스에 별도 사용권한 신청이 필요함 (README 참고).

**구현**: `whcheck`(onpre/whcheck)의 Next.js + Prisma + 토큰 기반 랜딩페이지 응답 구조를
템플릿으로 재사용. SMS/알림톡 어댑터 대신 `src/lib/kakao.ts`에 카카오 로그인·친구목록·
메시지발송 함수를 직접 구현. Admin 이메일/비번 로그인 대신 카카오 로그인으로 대체.

**미완료 (다음 세션)**:
- 카카오 디벨로퍼스 앱 등록 + `friends`/`talk_message` 사용권한 심사 신청 (사업자 인증 필요)
- `pnpm install` 및 실제 로컬 구동 확인 (아직 미검증)
- 심사 통과 전 임시로 카카오 개발자 계정 본인 테스트 친구로 발송 테스트

## 2026-09-21 — 목업 모드, 리마인드, 캔버스 최신화

**요청**: 화면 플로우를 로컬에서 확인하고 다듬기 → "진행해줘".

**내용**:
- `MOCK_KAKAO=true` 목업 모드 추가(가짜 친구 6명, 발송은 로그만, `/api/auth/dev-login`). 카카오 심사 전 전체 플로우 검증용.
- 무응답 정책(C안) 구현: Contact.reminderSentAt 추가, `POST /api/batches/[id]/remind`로 응답 없는 친구에게 1회만 리마인드. 대시보드 지난 요청 카드를 펼치면 유지/정리동의/무응답 3그룹 표시 + 리마인드 버튼. 자동삭제 없음.
- 옵시디언 캔버스를 카카오 기반 현재 상태로 갱신.

**미완료**: 카카오 디벨로퍼스 앱 등록·권한 심사, 실제 브라우저에서 화면/문구 다듬기, git 커밋 안 함.

## 2026-09-21 — 앱인토스 미니앱 + SMS 발송 경로 추가

**요청**: "이게누구야" 이름으로 앱인토스 미니앱을 만들고, 기존 igenuguya의 화면·응답 로직을 옮기되 발송은 SMS로.
(카카오 friends/talk_message 심사 리드타임을 우회하는 효과도 있음.)

**구성**:
- `cheongpung/igenuguya-miniapp/` — 앱인토스 WebView 미니앱(React+Vite, wf 3.2.0). 화면: 홈(지난 요청) → 연락처 선택(`fetchContacts`, 최대 20명) → 문구 확인·발송 → 답변 현황(+리마인드 1회). 해시 라우팅.
- 이 저장소(백엔드)에 `/api/m/*` 추가: `session`(getAnonymousKey hash → Bearer JWT), `batches`(목록/생성+SMS 발송), `batches/[id]`, `batches/[id]/remind`. CORS는 `lib/mobile.ts`(미니앱 Origin 4종 + dev localhost:5173).
- `lib/sms.ts` — Solapi SMS/LMS(HMAC-SHA256 서명 실구현). `MOCK_SMS=true`면 로그만.
- 수신자 응답 페이지 `/r/[token]`은 그대로 재사용(문자 링크는 브라우저에서 열림).
- 스키마: User.anonKey 추가, kakaoId/accessToken nullable, Contact.phone 추가, kakaoUuid nullable. 카카오 경로 코드는 남겨둠(미사용).
- 남용 방지: 1회 20명, 24시간 50명 상한, 번호 정규화·중복 제거, 휴대폰(01x)만.

**검증**: 백엔드 API 전 흐름 curl로 확인(mock SMS). 미니앱은 tsc/vite build 통과. 실제 화면·토스 앱 구동은 아직 미확인.

**미완료 / 출시 전 필수**:
- Solapi 가입 + 발신번호 사전등록 → `.env`의 SOLAPI_* 채우고 MOCK_SMS=false
- 백엔드 배포(HTTPS 도메인) 후 미니앱 `VITE_API_BASE` 지정, `NEXT_PUBLIC_BASE_URL`·`MINIAPP_NAME` 설정. SQLite→Postgres 전환 필요(Render 등)
- 콘솔 `miniapp_create`(앱 이름 igenuguya-miniapp, 비게임 카테고리), 개인정보처리방침(제3자 연락처 처리 명시), 심사 대응
- getAnonymousKey hash를 서버에서 검증하지 않음 → 앱인토스 식별키 검증 API(mTLS) 연동
- 광고성 오인/스팸 신고 리스크 검토(제3자에게 발송하는 서비스라 검수 쟁점 가능)
