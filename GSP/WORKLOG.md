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
- 코드·화면 문구는 idc-server-collect 와 100% 동일 (앱 타이틀 "IDC 서버 수거 플랫폼", "월드와이드메모리" 등). GSP 브랜딩 교체는 별도 요청.
- 초기 계정은 idc 와 동일: `admin / admin1234` 등 (init_data.py 참고).
- `render.yaml` 의 `gsp` 항목은 실제 배포와 무관(수동 생성). 참고용으로만 유지.
