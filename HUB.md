# 관제 허브 (Control Hub)

팔렌시아님이 운영 중인 서비스들의 상태를 한 곳에서 확인하기 위한 문서.
카카오톡 채널 문의가 들어왔을 때 어떤 프로젝트와 관련 있는지 매칭하는 용도로도 사용.

새 세션에서 특정 프로젝트를 다룰 때는 이 표를 먼저 보고, 상세 이력은 `.claude` 메모리의 `project_*` 파일을 참고할 것.
상태가 바뀌면 이 파일과 해당 메모리 파일을 함께 갱신.

---

## 서비스 목록

| 프로젝트 | 경로 | 배포 | 상태 요약 | 카톡 라우팅 키워드 |
|---|---|---|---|---|
| **ITAD 견적 시스템** | `cheongpung/itad-quotation-system` | it-asset-platform.onrender.com | 견적 계산엔진·API·페이지 완료. CPU 세대 자동매칭 미구현 | 견적, IT자산 매각, 코레테일 |
| **A브릿지 (MGIT)** | `mgit-platform` | mgit-platform.onrender.com | 새마을금고 복지회 초기세팅 진행 중. 파일 영속성(Render ephemeral) 개선 필요 | 새마을금고, 복지회, MGIT, A브릿지 |
| **IT Asset Platform (범용)** | `it-asset-platform` | it-asset-platform.onrender.com | A브릿지와 같은 코드베이스의 범용 버전. 별도 클론(`it-asset-platform-clone`)에서 배포 push | IT자산관리, 범용자산 |
| **돌봄잇** | `dolbom-it` | dolbom.coretail.co.kr | 스와이프 매칭·채팅 기본 구조 완료. 로그인 실동작 확인, 실시간 채팅·알림 미구현 | 돌봄, 케어메이트, 매칭, 코레테일 돌봄 |
| **inspect01** | `inspect01` | Render 배포 (블루프린트 서비스명 `inspect01`) | 2차 검수(스탬핑) 페이지 이동식으로 동작. 인라인 스탬핑 UI로 전환 예정 | 검수, 매입, 스탬핑, 판정 |
| **idc-server-collect (IDC브릿지)** | `idc-server-collect` | Render (서비스명 `cheongpung-1`→변경 권장) | 전 Phase(RBAC~정산~파기인증서) 구현 완료 | IDC, 서버수거, 파기, 정산 |
| **whcheck** | `onpre/whcheck` | 미배포 (로컬만) | 알림톡 배송주소 검증 완료, 실제 Solapi 연동·배포 전 | 배송주소, 주소확인, 알림톡 |
| **estimate** | `onpre/estimate` | - (로컬 CLI) | 입찰단가 산출 리뉴얼 기획 중. 기초단가 DB 구축이 선행과제 | 입찰, 단가산출, 낙찰 |
| **nexon-inspection** | `nexon` | Render 배포 (블루프린트 서비스명 `nexon-inspection`) | Express+Supabase 검수 관련 서비스 — 실사용 범위 재확인 필요 | 넥슨, 검수 (확인 필요) |
| **kakao-skill-server** | `kakao-skill-server` | Render 배포 예정 (블루프린트 등록 완료, 아직 미배포) | 카카오 i 오픈빌더 스킬서버. 문의 키워드 매칭 응답 + Solapi로 팔렌시아님 휴대폰 SMS 알림. 코레테일 채널·오픈빌더 봇 연동 전 | (라우팅 로직 자체가 키워드 매칭 엔진) |

**경로 규칙**: 웹에 배포되는 프로젝트는 repo 루트에 직접 위치 (`dolbom-it`, `inspect01`, `idc-server-collect`, `it-asset-platform`, `mgit-platform`, `nexon`). `onpre/` 폴더는 노트북에서 로컬 실행만 하는 것들 전용 — 2026-07-07에 dolbom-it, inspect01을 onpre에서 루트로 이동하고 `render.yaml`의 `rootDir`도 함께 수정함.

## onpre 폴더 (로컬 전용, 웹배포 아님)

| 폴더 | 추정 용도 |
|---|---|
| `estimate` | 입찰단가 산출 CLI 도구 |
| `whcheck` | 알림톡 배송주소 검증 (배포 전, 로컬 테스트 중) |
| `bid-collector` | Flask 앱 — 입찰 정보 수집 도구로 추정 |
| `daum-cafe` | 브라우저 자동화 기반 다음카페 크롤링 스크립트 (쿠키/프로필 사용 — 로컬 실행 필수) |
| `world` | 영업 대상 주소 확인 + 대시보드 생성 파이썬 스크립트 |
| `stock` | 국내 증권사(KIS) API 연동 개인 주식 대시보드 |
| `GPU/wwm-ai-platform` | Node.js + Anthropic SDK 사용 서버 — 용도 확인 필요 |
| `HL_Rubber` | 정적 HTML 회사소개 사이트 — 배포 여부 확인 필요 |
| `Rsimul` | 단순 HTML 시뮬레이터 (로컬에서 파일 열어 사용하는 형태로 추정) |
| `carbon-reduction` | 정적 HTML 1페이지 — 용도 확인 필요 |

## 미분류 / 문서 자산 (관제 대상 아님)

`Rproject`, `ws300P`, `donghee`, `stock` — 제안서·이미지 등 정적 자산 폴더.

---

## 다음 단계 (카카오 채널 연동 전 확인 필요)

1. **nexon-inspection 실사용 여부 확인** — inspect01과 무슨 관계인지
2. **GPU/wwm-ai-platform, HL_Rubber, carbon-reduction 용도 확인** — 배포 여부에 따라 표 승격 또는 정리
3. 이 허브를 기반으로 "카톡 문의 → 키워드 매칭 → 관련 프로젝트 컨텍스트 로드" 자동화는 카카오톡 채널 API 연동(2단계) 이후 진행
