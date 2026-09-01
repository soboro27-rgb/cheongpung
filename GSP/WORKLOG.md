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

**안 바꾼 것 (의도적):**
- `IDC 센터` 관련 문구 — 실제 데이터센터(Internet Data Center) 시설을 가리키는 일반명사라 유지
- 코드 식별자 `wm_router`, `WM_ROLES`, `require_wm`, URL `/wm/`, CSS `role-wm` — 기능 코드라 유지
- **견적서 공급자 법인 정보** (`customer/quotation.html` 148·245줄, `㈜ 월드와이드메모리` + 등록번호 106-86-52270 + 대표자·주소·도장) — 실제 사업자등록 법인 정보라 그대로 둠. GSP가 별도 법인이면 이 블록도 교체 필요.
- 로그인 화면 우측 `리뉴올피씨`(판매 브랜드) — 별개 브랜드라 유지
- idc-server-collect 원본은 변경 없음 (GSP 폴더만 수정)
