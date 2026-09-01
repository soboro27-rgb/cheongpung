# GSP 작업 이력

## 2026-09-01 — 초기 생성

**요청:** 청풍 폴더에 GSP 폴더를 만들고 idc-server-collect 와 똑같은 플랫폼을 구성, 푸시·배포까지 완료.

**이유:** idc-server-collect 와 동일 기능의 독립 인스턴스(별도 DB·별도 배포)가 필요.

**한 일:**
- `idc-server-collect` 의 커밋된 파일 전체를 `GSP/` 로 복제 (DB/pycache 제외).
- `render.yaml` 에 web 서비스 `gsp` (rootDir: GSP) + PostgreSQL `gsp-db` 추가.
- main/origin 에 커밋·푸시 → Render Blueprint 자동 동기화.

**배포 완료 (2026-09-01):**
- `cheongpung` 저장소엔 Blueprint 미연결 → Render 대시보드에서 수동 생성.
  - Postgres `gsp-db` (Free, Oregon)
  - Web Service `gsp` (Python 3, Root Directory `GSP`, build `pip install -r requirements.txt`, start `bash start.sh`)
  - env: `DATABASE_URL`(gsp-db internal), `SECRET_KEY`(랜덤 hex32), `PYTHONUNBUFFERED=1`
- URL: **https://gsp-i0fi.onrender.com** — /login, /health 200 확인. 시드 계정 정상 생성.

**주의:**
- Root Directory 미설정 시 루트에서 빌드해 `requirements.txt` not found 로 실패함 → 반드시 `GSP` 지정.
- 초기 계정은 idc 와 동일: `admin / admin1234` 등 (init_data.py 참고).
- `render.yaml` 의 `gsp` 항목은 실제 배포와 무관(수동 생성). 참고용으로만 유지.

---

## 2026-09-01 — GSP 브랜딩 교체

**요청:** 화면 문구를 GSP(= Great Server Plan) 브랜딩으로 교체.

**바꾼 것:**
- 앱 타이틀 "IDC 서버 수거 플랫폼" → "GSP — Great Server Plan" (main.py, base.html)
- "IDC브릿지" → "GSP" (intro/guide/pricing 전체)
- "월드와이드메모리 / WorldMemory / WorldWideMemory Co., Ltd." → "GSP / Great Server Plan"
- 로그인 화면 WD 로고 SVG → "GSP" 텍스트 마크, 워터마크 "WORLD MEMORY" → "GREAT SERVER PLAN"
- 화면상 "WM 지급/WM지급/직지급(WM→고객)/매입사(WM)/WM 관리/WM 전담" → "GSP" 로 표기
- 파기인증서 발행기관 "WorldMemory (주)" → "㈜ GSP", 신청번호 prefix `IDC-` → `GSP-`
- 견적서 견적번호 prefix `WM-` → `GSP-`
- 코드 주석(models.py/auth.py), init_data 콘솔 출력도 GSP로 정리

---

## 2026-09-01 — 고객 신청서 자산 행 누락 버그 수정

**증상:** 고객사 계정으로 서버 자산 신청서를 제출했는데 WM/고객 화면에서 "서버 자산 목록 (0대)" 로 나옴.

**조사:**
- 백엔드(customer_router `new_app`)는 정상 — 프로덕션에 curl 로 직접 제출 시 자산 저장됨 (앱 #3, 1대). 앱 #1·#2 는 자산 필드가 안 담겨서 0건.
- 원인 후보 2가지:
  1. 자산 행 파싱 루프가 `row_idx` 0부터 순차 증가하며 `row_idx > 50` 에서 중단 → 행 추가/삭제로 인덱스가 커지거나 비연속이면 누락.
  2. RAM/스토리지 모달을 `new bootstrap.Modal()` 로 매번 생성 → 백드롭이 쌓여 "신청서 제출" 클릭을 가로챌 수 있음.

**수정 (커밋 7b02c5e):**
- `customer_router.new_app`: 폼의 `manufacturer_*`/`model_*` 인덱스를 전부 수집 후 순회 (비연속·50 초과 OK).
- `new_application.html`: 모달 `getOrCreateInstance` 로 재사용, 제출 시 잔류 `.modal-backdrop` 제거, 자산 0건이면 확인 프롬프트.

**주의:** idc-server-collect 원본에도 같은 코드 있음 — 필요 시 동일 수정 반영 요망.
※ 프로덕션 테스트로 생성된 앱 #3(테스트봇) 은 무시/삭제 대상.

---

## 2026-09-01 — 개별 신청서 삭제 기능 추가 (커밋 d4a10a1)

**요청:** 신청서를 하나씩 삭제하는 버튼.

**구현:**
- 고객: `POST /customer/applications/{id}/delete` — 본인 건, 상태가 `requested`/`received`/`rejected` 일 때만. 상세 화면에 접힘형 삭제 버튼(confirm). 수거 진행 건은 `?error=locked` 안내.
- WM 슈퍼관리자: `POST /wm/applications/{id}/delete` — 상태 무관 완전 삭제. 상세 화면 "처리" 카드 하단에 노출.
- 하위 레코드(assets/schedule/settlement)는 모델 `cascade="all, delete-orphan"` 로 함께 삭제.
- 삭제 후 목록에서 `?deleted=ok` 성공 알림.

**주의:** idc-server-collect 원본에는 이 기능 없음.

---

## 브랜딩: 안 바꾼 것 (의도적)

- `IDC 센터` 관련 문구 — 실제 데이터센터(Internet Data Center) 시설을 가리키는 일반명사라 유지
- 코드 식별자 `wm_router`, `WM_ROLES`, `require_wm`, URL `/wm/`, CSS `role-wm` — 기능 코드라 유지
- **견적서 공급자 법인 정보** (`customer/quotation.html` 148·245줄, `㈜ 월드와이드메모리` + 등록번호 106-86-52270 + 대표자·주소·도장) — 실제 사업자등록 법인 정보라 그대로 둠. GSP가 별도 법인이면 이 블록도 교체 필요.
- 로그인 화면 우측 `리뉴올피씨`(판매 브랜드) — 별개 브랜드라 유지
- idc-server-collect 원본은 변경 없음 (GSP 폴더만 수정)
