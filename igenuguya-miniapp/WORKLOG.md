
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
