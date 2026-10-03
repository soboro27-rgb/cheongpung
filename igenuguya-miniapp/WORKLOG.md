
## 2026-09-22 — 앱인토스 콘솔 미니앱 등록 완료

**상황**: apps-in-toss-console MCP 인증이 이전 세션에서 막혀있었음. 사용자가 인증 완료 후 "정상화 되었나?" 질문 → 확인해보니 로컬 스캐폴딩(igenuguya-miniapp)은 있었지만 콘솔에는 미니앱이 실제로 등록(miniapp_create)된 적 없었음(workspace 91443에 미니앱 0개).

**진행**:
- 임시 로고 직접 제작(PIL로 600x600 PNG, 파란 배경+흰 카드+물음표) 후 image_upload_url로 S3 업로드
- miniapp_create 호출 (workspaceId 91443, appName igenuguya-miniapp, title "이게누구야", titleEn "Igenuguya", 부제 "연락처 정리 확인 서비스", 카테고리 생활(3812)>소셜(92))
- 결과: miniAppId=78387 발급, reviewState=IN_REVIEW (앱정보 AI 검토 시작, 영업일 약 2일 소요)

**다음**: 검토 결과 이메일 확인 → 승인되면 bundle_upload로 실제 코드 배포 가능. 로고는 임시본이라 정식 디자인으로 교체 권장(miniapp_update_icon).

## 2026-09-27 — 약관 URL 공개 등록, 개인정보 보유기간 후속작업 필요

**진행**: `igenuguya-legal` 공개 저장소(GitHub Pages) 생성해서 서비스 이용약관/개인정보 처리방침 페이지 발행.
- https://soboro27-rgb.github.io/igenuguya-legal/terms.html
- https://soboro27-rgb.github.io/igenuguya-legal/privacy.html
상호명 코어테일, 시행일 2026-09-27, 문의 soboro27@naver.com, 개인정보 보호책임자 계영근, 개인정보 보유기간 1년으로 채워 커밋.
앱인토스 콘솔 "토스 로그인" 등록 화면(홈 체크리스트의 "약관 등록하기"가 여기로 연결됨)에서 서비스 이용약관 URL 등록 진행.

**미완료 (후속 처리 요청받음, 2026-09-27 "나중에 처리해줘")**:
- 개인정보 처리방침에 "보유기간 1년 경과 시 파기"라고 명시했는데, 실제로 1년 지난 배치/연락처 데이터를 자동 삭제하는 배치 작업이 코드에 없음. 약관과 실제 동작이 불일치하는 상태 — 실제 서비스 오픈 전에 반드시 구현 필요.

## 2026-09-28 — 수익화 방향 결정 + 워크스페이스 약관 여전히 막힘

**결정**: 문자 발송 비용은 무한정 사장님(팔렌시아) 부담 대신, 실제 출시 직전에 무료 한도 + 앱인토스 인앱결제(IAP)로 발송권 충전하는 구조 도입 예정. 지금 테스트 단계에서는 계속 무료로 유지.

**확인**: `WORKSPACE_TERMS_AGREEMENT_REQUIRED` 상태 아직 그대로. 콘솔 MCP에는 이 약관에 동의하거나 앱인토스 고객센터(채널톡) 문의 상태를 조회하는 도구가 없어 API로는 확인 불가 — 채널톡 답변을 직접 확인해야 함.

**미완료**: 채널톡 답변 확인, 답변 오면 안내대로 약관 동의 처리, 그 후 IAP 상품(발송권) 설계 및 등록.

## 2026-09-28 — 문자 안심문구 추가, 연락처 리스트 간격 축소

**요청 배경**: 링크 클릭 방식이 스미싱처럼 느껴질 수 있다는 우려. 문자 답장(양방향 SMS) 방식도 검토했으나, 회선 임대·자유 텍스트 의도 파싱 필요 등 오히려 복잡도가 커서 보류하고, 링크 방식을 유지하면서 안심 문구를 추가하는 쪽으로 결정. 연락처 리스트 행 간격이 넓다는 피드백도 반영.

**구현**:
- `igenuguya/src/lib/sms.ts`에 `buildMessageWithLink()` 추가 — 사용자가 본문을 자유롭게 고쳐도 "(결제·개인정보 입력 없는 안전한 링크예요)" 안심 문구는 항상 링크 앞에 고정 삽입. `/api/m/batches`, `/api/m/batches/[id]/remind` 양쪽에 적용.
- 미니앱 Compose 화면 안내 문구를 안심문구 자동 삽입 사실에 맞게 수정.
- 미니앱 연락처 선택 화면(`Pick.tsx`) 리스트 행 높이 60px→48px, 패딩 축소.
- 버전 20260928-6(간격 축소), 20260928-7(안심문구)까지 빌드·업로드·테스트푸시, 로컬 mock SMS로 안심문구 삽입 확인.

**미완료**: 카카오 알림톡(인증 채널) 하이브리드 발송은 심사 리드타임 때문에 보류 — 나중에 검토.

## 2026-09-28 — 실배포 준비: render.yaml 등록 + 배포 체크리스트

**한 것**: `cheongpung/render.yaml`에 `igenuguya`(web) + `igenuguya-db`(postgres) 항목 추가. 다른 프로젝트(GSP, idc-server-collect 등)와 같은 패턴. render.yaml은 Blueprint로 연결 안 돼 있어 참고용이고, 실제 서비스는 Render 대시보드에서 수동 생성해야 함(기존 관행과 동일).

**주의**: `schema.prisma`의 datasource provider는 아직 `sqlite`로 남겨둠. Prisma는 스키마 하나에 provider 하나만 지정 가능해서, Postgres로 바꾸면 로컬 개발용 SQLite(dev.db)가 즉시 깨짐. 로컬에 Docker/Postgres가 없어서 postgresql provider로 바꾼 뒤 직접 검증할 방법이 없었음 — 그래서 실제 Render Postgres가 생기는 시점에 아래 순서로 전환할 것.

**실배포 시 순서 (다음에 진행)**:
1. Render 대시보드에서 `igenuguya-db`(Postgres, free) 생성
2. Render 대시보드에서 `igenuguya` Web Service 생성 (Root Directory: `igenuguya`, render.yaml의 buildCommand/startCommand/envVars 그대로 입력)
3. `schema.prisma`의 `datasource db { provider = "sqlite" }` → `"postgresql"`로 변경 (로컬 dev.db는 이 시점부터 안 쓰게 됨)
4. 배포되면 buildCommand의 `prisma db push`가 Postgres에 테이블을 만듦(마이그레이션 파일 없이 스키마 동기화 방식 — 아직 `prisma/migrations` 없음)
5. `NEXT_PUBLIC_BASE_URL`을 실제 배포 도메인으로, `MOCK_SMS=false` + Solapi 키 채우기
6. 미니앱 `.env.local`의 `VITE_API_BASE`를 배포 도메인으로 바꾸고 `npm run build` 재실행 → 콘솔에 새 번들 업로드

**미완료**: 위 1~2번은 Render 대시보드 작업이라 팔렌시아님이 직접 해야 함. Solapi 가입도 마찬가지(사업자 인증 필요).

## 2026-09-28 — 실제 Render 배포 성공 + 미니앱 연결

**한 것**:
- 지금까지 igenuguya/igenuguya-miniapp 코드가 로컬에만 있고 GitHub(cheongpung)에 커밋된 적이 없어서, Render가 "Root directory igenuguya does not exist" 오류를 냈던 걸 발견 → git add/commit/push 완료 (커밋 c2def17).
- Render에 Postgres(`igenuguya-db`) + 웹서비스(`igenuguya`) 생성. DATABASE_URL을 내부 연결 문자열로 설정. `schema.prisma` datasource provider sqlite→postgresql 변경, 로컬에서 실제 Postgres에 `prisma db push` 성공 확인.
- 서비스 화면에 "Python 3" 배지가 떠서 런타임 오설정 의심했으나, 실제 배포는 정상 성공(그린 체크) — 배지는 무시해도 됨.
- 배포된 `https://igenuguya.onrender.com`에서 `/api/m/session` 실제 동작 확인(진짜 DB 연결 성공).
- 미니앱 `VITE_API_BASE`를 로컬(localhost:3000) → 실제 배포 주소로 변경, 버전 20260928-8 빌드·업로드·테스트푸시.

**현재 상태**: 미니앱이 실제 배포된 백엔드에 연결된 상태. MOCK_SMS=true라 문자는 아직 실발송 안 됨.

**미완료**: Solapi 가입 + 발신번호 등록 후 Render 환경변수(SOLAPI_*, MOCK_SMS=false) 반영, 앱인토스 워크스페이스 약관(채널톡 문의 답변 대기), 최신 번들 실제 검토 요청.

## 2026-09-28 — 검토 요청 제출

버전 20260928-8(실제 Render 백엔드 연결본)을 실제 폰 테스트 후 `bundle_submit_review`로 검토 요청 제출. `reviewStatus: REVIEWING`. 승인되면 콘솔 웹 "앱 출시"에서 출시하기 → 그때 워크스페이스 약관 동의 화면이 뜰 예정(채널톡 안내 기준).

## 2026-09-28 — 실제 문자 발송 성공 (Solapi 실연동 완료)

Render 환경변수에 `SOLAPI_SENDE`(R 누락 오타)로 저장돼있던 걸 발견해서 `SOLAPI_SENDER`로 수정 → 재배포 후 실서버에서 실제 SMS 발송 성공 확인(사용자 본인 폰 수신 확인). `MOCK_SMS=false`로 정식 전환 완료.

**이제 실제로 동작하는 것**: 미니앱(토스 라이브 출시) → 실제 백엔드(Render+Postgres) → 실제 SMS(Solapi) 전체 파이프라인 확인됨.

**남은 항목**: 로고 정식 디자인, IAP 발송권 충전 구조, 개인정보 보유기간(1년) 자동삭제 배치, getAnonymousKey mTLS 검증. 급하지 않음 — 필요할 때 다시 요청.

## 2026-09-28 — 무료 한도 + IAP 발송권 크레딧 시스템 (백엔드)

**계기**: Solapi 잔액이 예상보다 빨리 줄어드는 걸 보고("50000원 중 5000원 벌써 사용") 무료 한도+유료 충전 구조를 실제로 도입하기로 함. (5000원 차감의 정확한 원인은 발송 내역만으로 설명 안 돼서 미해결 — 사용자가 솔라피 대시보드에서 충전/사용 내역 직접 확인 필요.)

**백엔드 구현**:
- `User.credits`(유료 발송권 잔액), `freeSentCount`/`freeSentDate`(일일 무료 한도 추적), `Purchase` 모델 추가. 실제 Postgres(운영 DB)에 반영 완료.
- `src/lib/credits.ts`: 하루 무료 한도(`FREE_DAILY_LIMIT`, 기본 3명) 계산 + 소비 로직.
- `POST /api/m/batches`: 무료 한도 초과분은 credits에서 차감, 부족하면 402 `INSUFFICIENT_CREDITS` 에러(무료 남은 수/필요 크레딧/보유 크레딧 포함) 반환.
- `GET /api/m/batches`: 응답에 `account: {freeRemaining, freeDailyLimit, credits}` 추가.
- 앱인토스 콘솔에 IAP 상품 **"발송권 10건" 1,000원** 등록 완료(승인됨, `postInspectionStatus: INACTIVE` — 아직 비공개). productId: `ait.0000078387.6c3bc475.f0886f6c5d.0573601637`.
- `POST /api/m/iap/redeem`: `MOCK_IAP=true`일 때만 동작하는 임시 충전 엔드포인트(로컬 테스트용). 실제 서버 영수증 검증(앱인토스 mTLS 연동)은 아직 구현 안 됨 — `MOCK_IAP` 미설정 시 501 반환해 무검증 크레딧 지급을 막음.
- 로컬에서 전체 흐름(한도초과 거절→mock 충전→재시도 성공→잔액 반영) curl로 검증 완료. 커밋 eb1c55a로 푸시, Render 자동배포 확인 완료(실운영 DB에 `account` 필드 정상 응답).
- 테스트 중 생성된 더미 유저/배치는 운영 DB에서 정리함.

**미완료 (다음 단계)**:
1. 미니앱 UI: 홈/문구작성 화면에 "무료 N건 중 M건 남음 · 보유 발송권 K건" 표시, 부족 시 충전 유도 화면
2. 미니앱에서 실제 앱인토스 IAP 결제 호출(`IAP` SDK)로 "발송권 10건" 상품 구매 트리거
3. 백엔드 서버 영수증 검증 — 앱인토스 mTLS 클라이언트 인증서 발급·연동 필요(이전부터 미룬 getAnonymousKey 검증과 같은 카테고리 작업)
4. 검증 완료되면 IAP 상품 `postInspectionStatus`를 ACTIVE로 전환(`iap_product_change_status`)

## 2026-09-28 (계속) — IAP 구매 플로우 연결, 프로덕션 배포 확인

**미니앱**: 홈 화면에 "오늘 무료 N/3건 남음 · 보유 발송권 K건" 표시. 문구 작성 화면에서 402 INSUFFICIENT_CREDITS 응답을 받으면 "발송권 10건 충전하기(1,000원)" 버튼이 뜨고, 누르면 `IAP.createOneTimePurchaseOrder`로 실제 토스 결제창이 뜸(processProductGrant는 즉시 true 반환 — 공식 권장 패턴). 결제 성공(onEvent) 시 서버에 orderId+sku를 보내 확인 요청 → 크레딧 지급 → 원래 발송 자동 재시도. 버전 20260928-9로 빌드·업로드·테스트푸시 완료.

**서버**: `src/lib/tossOrder.ts` 추가 — mTLS 인증서(`TOSS_MTLS_CERT`/`TOSS_MTLS_KEY`)가 설정되면 앱인토스 주문 상태 조회 API(`/api-partner/v1/apps-in-toss/order/get-order-status`)로 실제 검증하도록 구현. 아직 인증서 발급 전이라 `MOCK_IAP=true`일 때만 무검증 지급하는 경로로 동작 중. 커밋 b7a7efd 푸시, Render 자동배포 확인(`/api/m/iap/redeem`가 실서버에서 401로 정상 응답 — 라우트 배포 확인됨).

**중요**: 콘솔의 IAP 상품("발송권 10건")은 아직 **INACTIVE**로 유지 중 — mTLS 인증서 발급·연동 전까지는 활성화하지 않을 것. 활성화하면 실제 결제가 가능해지는데, processProductGrant가 즉시 true를 반환하는 구조라 검증 없이 활성화하면 결제만 받고 크레딧 지급이 안 되는 상황이 생길 수 있음.

**다음 (팔렌시아 = 데이브 님 액션 필요)**:
1. 앱인토스 콘솔 웹 "mTLS 인증서" 메뉴에서 인증서 발급
2. 발급받은 cert/key를 Render 환경변수(`TOSS_MTLS_CERT`, `TOSS_MTLS_KEY`, PEM 텍스트 그대로)에 등록
3. 실제 결제로 검증 테스트 → 문제 없으면 `iap_product_change_status`로 상품 ACTIVE 전환

## 2026-09-28 (계속) — mTLS 인증서 연동 완료, 실검증 성공

앱인토스 콘솔에서 mTLS 인증서 발급(CN: igenuguya-miniapp, 유효기간 2026-09-28~2027-10-23) → Render 환경변수(`TOSS_MTLS_CERT`, `TOSS_MTLS_KEY`)에 등록 → 실서버에서 가짜 주문번호로 `/api/m/iap/redeem` 호출해 실제 앱인토스 주문 상태 조회 API(`/api-partner/v1/apps-in-toss/order/get-order-status`)까지 mTLS로 정상 연결되는 것 확인(응답: 상품 불일치 — 연결 자체는 성공, 가짜 주문이라 정상 거절됨).

인증서 파일(`이게누구야_private.key`, `이게누구야_public.crt`)은 `igenuguya/` 폴더에 저장돼 있었는데 `.gitignore`에 `*.key`/`*.crt`/`*.pem`이 없어서 깃에 올라갈 뻔한 걸 발견 → 즉시 추가해서 막음.

**남은 건 딱 하나**: `iap_product_change_status`로 "발송권 10건" 상품을 ACTIVE로 전환하면 실제 판매 시작. 사용자 확인 후 진행 예정.
