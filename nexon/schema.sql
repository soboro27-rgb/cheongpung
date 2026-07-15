-- ================================================================
-- 넥슨코리아 공용부 점검 플랫폼 — 테이블 생성 스크립트
-- Supabase SQL Editor에서 실행하세요
-- ================================================================

-- ── 1. 사용자 ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS insp_users (
  id            BIGSERIAL PRIMARY KEY,
  username      TEXT      NOT NULL UNIQUE,
  password_hash TEXT      NOT NULL,
  name          TEXT      NOT NULL,
  role          TEXT      NOT NULL DEFAULT 'inspector',  -- 'admin' | 'inspector'
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);-+(/8520/*9856230\
[p';bv/8520 qw-AGT
  Q스탁폴더는 내가 가진 100만원의 현금으로 주식투자를 자동으로 하는 플랫폼을 만들려고하는거거든 내PC에서 자동으로 트레이딩 될수 있게 만들어야겠지 ? 먼저 
내가 유튜브에서 하루에딱 90분만 매일똑같은 방식으로 투자 하면 되는 방식이 있다고 해서 먼저 그걸 설명해볼께 
오전 9시30분 유동성이 가장 몰리는 뉴욕장이 시작되는 시간에 선을 두개만 그려주면 되는데 그선은 9시30분에 이 캔들에 고가와 저가의 선을 두개그어주고 15분봉에 5분봉으로 넘어가서 기다린다 그러고는 기다리라고 말한다상승형캔들이 기준선으로 몸통 돌파하고FVG가 함께 형성이 되었습니다.


============================================
 Daum Cafe Price Scraper - Setup & Run
============================================

[Step 1] Installing Python packages...
Requirement already satisfied: playwright in C:\Users\sobor\AppData\Local\Programs\Python\Python314\Lib\site-packages (1.60.0)
Requirement already satisfied: beautifulsoup4 in C:\Users\sobor\AppData\Local\Programs\Python\Python314\Lib\site-packages (4.14.3)
Requirement already satisfied: pandas in C:\Users\sobor\AppData\Local\Programs\Python\Python314\Lib\site-packages (3.0.3)
Requirement already satisfied: openpyxl in C:\Users\sobor\AppData\Local\Programs\Python\Python314\Lib\site-packages (3.1.5)
Requirement already satisfied: lxml in C:\Users\sobor\AppData\Local\Programs\Python\Python314\Lib\site-packages (6.1.1)
Requirement already satisfied: pyee<14,>=13 in C:\Users\sobor\AppData\Local\Programs\Python\Python314\Lib\site-packages (from playwright) (13.0.1)
Requirement already satisfied: greenlet<4.0.0,>=3.1.1 in C:\Users\sobor\AppData\Local\Programs\Python\Python314\Lib\site-packages (from playwright) (3.5.0)
Requirement already satisfied: typing-extensions in C:\Users\sobor\AppData\Local\Programs\Python\Python314\Lib\site-packages (from pyee<14,>=13->playwright) (4.15.0)
Requirement already satisfied: soupsieve>=1.6.1 in C:\Users\sobor\AppData\Local\Programs\Python\Python314\Lib\site-packages (from beautifulsoup4) (2.8.3)
Requirement already satisfied: numpy>=2.3.3 in C:\Users\sobor\AppData\Local\Programs\Python\Python314\Lib\site-packages (from pandas) (2.4.4)
Requirement already satisfied: python-dateutil>=2.8.2 in C:\Users\sobor\AppData\Local\Programs\Python\Python314\Lib\site-packages (from pandas) (2.9.0.post0)
Requirement already satisfied: tzdata in C:\Users\sobor\AppData\Local\Programs\Python\Python314\Lib\site-packages (from pandas) (2026.2)
Requirement already satisfied: et-xmlfile in C:\Users\sobor\AppData\Local\Programs\Python\Python314\Lib\site-packages (from openpyxl) (2.0.0)
Requirement already satisfied: six>=1.5 in C:\Users\sobor\AppData\Local\Programs\Python\Python314\Lib\site-packages (from python-dateutil>=2.8.2->pandas) (1.17.0)

[notice] A new release of pip is available: 26.0.1 -> 26.1.1
[notice] To update, run: C:\Users\sobor\AppData\Local\Programs\Python\Python314\python.exe -m pip install --upgrade pip

[Step 2] Installing Playwright Chromium browser...

[Step 3] Starting scraper... Browser will open automatically.

[로그인] 카페 접속 중...
[로그인] 현재 URL: https://cafe.daum.net/usedexport
[로그인] 이미 로그인됨
[로그인] 최종 URL: https://cafe.daum.net/usedexport

[게시판] 7개 게시판 탐색 시작...

[게시판] → https://cafe.daum.net/usedexport/HreT
[게시판] 페이지 구조 분석 중... (board=HreT)
  [디버그] debug/board_HreT.html 저장됨
  [디버그] debug/board_HreT.png 저장됨
  Frame[0] url=https://cafe.daum.net/usedexport/HreT  links=[]
  Frame[1] url=https://cafe.daum.net/_c21_/bbs_list?grpid=MMhX&fldid=HreT  links=['https://cafe.daum.net/supporters/MbmU/150', 'https://top.cafe.daum.net/?t__nil_navi=cafehome', 'https://table.cafe.daum.net/', 'https://cafe.daum.net/_c21_/bbs_list?grpid=MMhX&fldid=HreT#', 'https://cafe.daum.net/_c21_/bbs_list?grpid=MMhX&fldid=HreT#']
  Frame[2] url=about:blank  links=[]
  Frame[3] url=https://cafe.daum.net/_pageview/bbs_list_page.html?1779844259560  links=[]
  Frame[4] url=https://cm.g.doubleclick.net/partnerpixels?url=https%3A%2F%2Fcafe.daum  links=[]
  Frame[5] url=about:blank  links=[]
  Frame[6] url=https://c9252ab3981714e47bdc793cb5d20929.safeframe.googlesyndication.c  links=['https://adclick.g.doubleclick.net/aclk?sa=l&ai=COqmcpEQWaqjtG_OXpt8Po6G2iQjY55bghgGTgviP3RXXyO-tjw4QASC0g78qYJv7_464KaABocCY8SjIAQngAgCoAwHIA8sEqgSsAk_QSn-fvaIFIfpGGvOgZZIznHBJmulEnPnXcutLbC6lqPLQ1coo8dxcil9pRByTUNf45tTcnrSbUXvw8HyPlFjlebZB3ljkN-G99U5i5zJb993XuO29XxDa311TrYE4Sp-bLEJnjF8rTG0IIquoIAJpHUKVrVoUjZFQh_ORraUtZt-A8UQRttJPVecy4dSfl89mqOYe_Re7cDmTrAUW3IVa0lxjxfsuVKs-8Ho0IOtc38zQLEQbJRdEem6eWHcSSYrL9A7UP6Xvb-27Jt8O5I14hoRvb79-VhpS1_vZmseORGQyCITlBTT_NuX91H8ys8Hghi7eM0iCCur97B6v9T1lwcpVdFbZm4wWdTcfXEql2eNtD2yRYmxH-6U0ut7cyrTayxKBZqP_88ZJh8AE_M3_1NQF4AQBiAXV69zpV_oFBgglEAEYAKAGLoAH5vW28QSoB6fMsQKoB-LYsQKoB6a-G6gHzM6xAqgH89EbqAeW2BuoB6qbsQKoB47OG6gHk9gbqAfw4BuoB-6WsQKoB_6esQKoB6--sQKoB9m2sQKoB5oGqAf_nrECqAffn7ECqAf4wrECqAfi2LECqAfi2LECqAfi2LEC2AcA-gcUY29tLmVpbm5vdmF0aW9uLnRlbXXACAHSCDMIgGEQARidATIIioKAgICAgAg6D4BAgMCAgICAqIACqIOAEEi9_cE6WJfBmMek2JQDYAGACgOQCwOYCwHICwGADAGiDAVIAZABAaoNAktSyA0B4g0TCMrtmMek2JQDFfOL6QUdo5AtgeoNEwifsJnHpNiUAxXzi-kFHaOQLYHwDQKIDv___________wHYEwuIFAHQFQGYFgHKFgIKAPgWAYAXAbIXEBgBKgo3ODM5MTMyMDExUAa6FwI4AaoYFwkAAAAA4AXjQBIKNzgzOTEzMjAxMRgBshgJEgLTXRguIgEA0BgB6BgBwhkCCAE&ae=1&gclid=EAIaIQobChMIqM-Zx6TYlAMV84vpBR2jkC2BEAEYASABEgJQkPD_BwE&num=1&cid=CAQShwIABaugfV36lO1HEnOQT_TLUlJS1W8gd_mlmJnDJ_KM3DTwGHlzx5557oNcv4HiMXt-hGY7bLxdLTBkriKink81B7k79AbGyGE9OYt1w3o4k1b7_Tc50PYYxX66Q0BCQ4vsIm46BImCyKtQYUb0mRbNQCeMTBlKT2XKBAqoy7yuLwNu-b6e5B5QDUZRdzTWryJMw66nU5t3YBHMVBzGQvu40-cxF3xp9whX3rKq8gPLRbBK3I_fCKP8pq86OMX_FlGNR39ZihdZ0GzqmWWds2F2dLNAsr6FJetA1-Cb0_4alvxmU_oqBqQaymCmsMNxIw56yLjzkoLcf0Zpg2xNGUvavUl-cKsSjBgB&sig=AOD64_1sHCSHKITmSzbfxu_5hx1mcRP8yQ&client=ca-pub-3302927352513848&nb=9&adurl=https://www.temu.com/ul/kuiper/un3.html%3F_bg_fs%3D1%26subj%3Ddpa-un-dal%26_p_jump_id%3D1028%26_x_vst_scene%3Dadg%26goods_id%3D601099886773862%26sku_id%3D17593746278584%26adg_ctx%3Da-6c5af15b~c-4a65833b%26_x_ns_item_id%3D778719075-17593746278584%26_x_ads_sub_channel%3Dfeed%26_p_rfs%3D1%26_x_ns_prz_type%3D-1%26locale_override%3D185~ko~KRW%26_x_ns_sku_id%3D17593746278584%26_x_ns_gid%3D601099886773862%26_x_ads_channel%3Dgoogle%26_x_ns_lan%3Dko%26_x_gmc_account%3D778719075%26_x_login_type%3DGoogle%26_x_ns_gg_lnk_type%3Ddsa%26_x_bg_adid%3Dgd33663315-us-1%26topic_classify%3D130%26_x_ads_account%3D6580856735%26_x_ads_set%3D23575606741%26_x_ads_id%3D194525521660%26_x_ads_creative_id%3D798693724782%26_x_ns_source%3Dd%26_x_ns_gclid%3DEAIaIQobChMIqM-Zx6TYlAMV84vpBR2jkC2BEAEYASABEgJQkPD_BwE%26_x_ns_placement%3Dcafe.daum.net%26_x_ns_match_type%3D%26_x_ns_ad_position%3D%26_x_ns_product_id%3D%26_x_ns_target%3Dsegment_be_a_7035560136157392317%26_x_ns_devicemodel%3D%26_x_ns_wbraid%3D%7Bwbraid%7D%26_x_ns_gbraid%3D%7Bgbraid%7D%26_x_ns_targetid%3D%26gad_source%3D5%26gad_campaignid%3D23575606741%26gclid%3DEAIaIQobChMIqM-Zx6TYlAMV84vpBR2jkC2BEAEYASABEgJQkPD_BwE', 'https://adclick.g.doubleclick.net/aclk?sa=l&ai=CR5FppEQWaqjtG_OXpt8Po6G2iQjY55bghgGTgviP3RXXyO-tjw4QASC0g78qYJv7_464KaABocCY8SjIAQngAgCoAwHIA8sEqgSsAk_QSn-fvaIFIfpGGvOgZZIznHBJmulEnPnXcutLbC6lqPLQ1coo8dxcil9pRByTUNf45tTcnrSbUXvw8HyPlFjlebZB3ljkN-G99U5i5zJb993XuO29XxDa311TrYE4Sp-bLEJnjF8rTG0IIquoIAJpHUKVrVoUjZFQh_ORraUtZt-A8UQRttJPVecy4dSfl89mqOYe_Re7cDmTrAUW3IVa0lxjxfsuVKs-8Ho0IOtc38zQLEQbJRdEem6eWHcSSYrL9A7UP6Xvb-27Jt8O5I14hoRvb79-VhpS1_vZmseORGQyCITlBTT_NuX91H8ys8Hghi7eM0iCCur97B6v9T1lwcpVdFbZm4wWdTcfXEql2eNtD2yRYmxH-6U0ut7cyrTayxKBZqP_88ZJh8AE_M3_1NQF4AQBiAXV69zpV_oFBgglEAEYAaAGLoAH5vW28QSoB6fMsQKoB-LYsQKoB6a-G6gHzM6xAqgH89EbqAeW2BuoB6qbsQKoB47OG6gHk9gbqAfw4BuoB-6WsQKoB_6esQKoB6--sQKoB9m2sQKoB5oGqAf_nrECqAffn7ECqAf4wrECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LEC2AcA-gcUY29tLmVpbm5vdmF0aW9uLnRlbXXACALSCDMIgGEQARidATIIioKAgICAgAg6D4BAgMCAgICAqIACqIOAEEi9_cE6WJfBmMek2JQDYAGACgOQCwOYCwHICwGADAGiDAVIAZABAaoNAktSyA0B4g0TCMrtmMek2JQDFfOL6QUdo5AtgeoNEwifsJnHpNiUAxXzi-kFHaOQLYHwDQKIDv___________wHYEwuIFAHQFQGYFgHKFgIKAPgWAYAXAbIXEBgBKgo3ODM5MTMyMDExUAa6FwI4AaoYFwkAAAAA4AXjQBIKNzgzOTEzMjAxMRgBshgJEgLTXRguIgEA0BgB6BgBwhkCCAE&ae=1&gclid=EAIaIQobChMIqM-Zx6TYlAMV84vpBR2jkC2BEAEYASACEgJ7R_D_BwE&num=1&cid=CAQShwIABaugfV36lO1HEnOQT_TLUlJS1W8gd_mlmJnDJ_KM3DTwGHlzx5557oNcv4HiMXt-hGY7bLxdLTBkriKink81B7k79AbGyGE9OYt1w3o4k1b7_Tc50PYYxX66Q0BCQ4vsIm46BImCyKtQYUb0mRbNQCeMTBlKT2XKBAqoy7yuLwNu-b6e5B5QDUZRdzTWryJMw66nU5t3YBHMVBzGQvu40-cxF3xp9whX3rKq8gPLRbBK3I_fCKP8pq86OMX_FlGNR39ZihdZ0GzqmWWds2F2dLNAsr6FJetA1-Cb0_4alvxmU_oqBqQaymCmsMNxIw56yLjzkoLcf0Zpg2xNGUvavUl-cKsSjBgB&sig=AOD64_2LRxK5Rcr5ft4kbgxzHVqX3gWXPA&client=ca-pub-3302927352513848&nb=9&adurl=https://www.temu.com/ul/kuiper/un3.html%3F_bg_fs%3D1%26subj%3Ddpa-un-dal%26_p_jump_id%3D1028%26_x_vst_scene%3Dadg%26goods_id%3D601100646934932%26sku_id%3D17596692969265%26adg_ctx%3Da-fdcca38b~c-2017e3f4%26_x_ns_item_id%3D778719075-17596692969265%26_x_ads_sub_channel%3Dfeed%26_p_rfs%3D1%26_x_ns_prz_type%3D-1%26locale_override%3D185~ko~KRW%26_x_ns_sku_id%3D17596692969265%26_x_ns_gid%3D601100646934932%26_x_ads_channel%3Dgoogle%26_x_ns_lan%3Dko%26_x_gmc_account%3D778719075%26_x_login_type%3DGoogle%26_x_ns_gg_lnk_type%3Ddsa%26_x_bg_adid%3Dgd33663315-us-1%26topic_classify%3D130%26_x_ads_account%3D6580856735%26_x_ads_set%3D23575606741%26_x_ads_id%3D194525521660%26_x_ads_creative_id%3D798693724782%26_x_ns_source%3Dd%26_x_ns_gclid%3DEAIaIQobChMIqM-Zx6TYlAMV84vpBR2jkC2BEAEYASACEgJ7R_D_BwE%26_x_ns_placement%3Dcafe.daum.net%26_x_ns_match_type%3D%26_x_ns_ad_position%3D%26_x_ns_product_id%3D%26_x_ns_target%3Dsegment_be_a_7035560136157392317%26_x_ns_devicemodel%3D%26_x_ns_wbraid%3D%7Bwbraid%7D%26_x_ns_gbraid%3D%7Bgbraid%7D%26_x_ns_targetid%3D%26gad_source%3D5%26gad_campaignid%3D23575606741%26gclid%3DEAIaIQobChMIqM-Zx6TYlAMV84vpBR2jkC2BEAEYASACEgJ7R_D_BwE', 'https://adclick.g.doubleclick.net/aclk?sa=l&ai=CRPeppEQWaqjtG_OXpt8Po6G2iQjY55bghgGTgviP3RXXyO-tjw4QASC0g78qYJv7_464KaABocCY8SjIAQngAgCoAwHIA8sEqgSsAk_QSn-fvaIFIfpGGvOgZZIznHBJmulEnPnXcutLbC6lqPLQ1coo8dxcil9pRByTUNf45tTcnrSbUXvw8HyPlFjlebZB3ljkN-G99U5i5zJb993XuO29XxDa311TrYE4Sp-bLEJnjF8rTG0IIquoIAJpHUKVrVoUjZFQh_ORraUtZt-A8UQRttJPVecy4dSfl89mqOYe_Re7cDmTrAUW3IVa0lxjxfsuVKs-8Ho0IOtc38zQLEQbJRdEem6eWHcSSYrL9A7UP6Xvb-27Jt8O5I14hoRvb79-VhpS1_vZmseORGQyCITlBTT_NuX91H8ys8Hghi7eM0iCCur97B6v9T1lwcpVdFbZm4wWdTcfXEql2eNtD2yRYmxH-6U0ut7cyrTayxKBZqP_88ZJh8AE_M3_1NQF4AQBiAXV69zpV_oFBgglEAEYAqAGLoAH5vW28QSoB6fMsQKoB-LYsQKoB6a-G6gHzM6xAqgH89EbqAeW2BuoB6qbsQKoB47OG6gHk9gbqAfw4BuoB-6WsQKoB_6esQKoB6--sQKoB9m2sQKoB5oGqAf_nrECqAffn7ECqAf4wrECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LEC2AcA-gcUY29tLmVpbm5vdmF0aW9uLnRlbXXACAPSCDMIgGEQARidATIIioKAgICAgAg6D4BAgMCAgICAqIACqIOAEEi9_cE6WJfBmMek2JQDYAGACgOQCwOYCwHICwGADAGiDAVIAZABAaoNAktSyA0B4g0TCMrtmMek2JQDFfOL6QUdo5AtgeoNEwifsJnHpNiUAxXzi-kFHaOQLYHwDQKIDv___________wHYEwuIFAHQFQGYFgHKFgIKAPgWAYAXAbIXEBgBKgo3ODM5MTMyMDExUAa6FwI4AaoYFwkAAAAA4AXjQBIKNzgzOTEzMjAxMRgBshgJEgLTXRguIgEA0BgB6BgBwhkCCAE&ae=1&gclid=EAIaIQobChMIqM-Zx6TYlAMV84vpBR2jkC2BEAEYASADEgKgyPD_BwE&num=1&cid=CAQShwIABaugfV36lO1HEnOQT_TLUlJS1W8gd_mlmJnDJ_KM3DTwGHlzx5557oNcv4HiMXt-hGY7bLxdLTBkriKink81B7k79AbGyGE9OYt1w3o4k1b7_Tc50PYYxX66Q0BCQ4vsIm46BImCyKtQYUb0mRbNQCeMTBlKT2XKBAqoy7yuLwNu-b6e5B5QDUZRdzTWryJMw66nU5t3YBHMVBzGQvu40-cxF3xp9whX3rKq8gPLRbBK3I_fCKP8pq86OMX_FlGNR39ZihdZ0GzqmWWds2F2dLNAsr6FJetA1-Cb0_4alvxmU_oqBqQaymCmsMNxIw56yLjzkoLcf0Zpg2xNGUvavUl-cKsSjBgB&sig=AOD64_0q2-NFjaZtCOrAScoun0fbAqdRkA&client=ca-pub-3302927352513848&nb=9&adurl=https://www.temu.com/ul/kuiper/un3.html%3F_bg_fs%3D1%26subj%3Ddpa-un-dal%26_p_jump_id%3D1028%26_x_vst_scene%3Dadg%26goods_id%3D601101133649475%26sku_id%3D17598409108635%26adg_ctx%3Da-5fe361c9~c-977678bb%26_x_ns_item_id%3D778719075-17598409108635%26_x_ads_sub_channel%3Dfeed%26_p_rfs%3D1%26_x_ns_prz_type%3D-1%26locale_override%3D185~ko~KRW%26_x_ns_sku_id%3D17598409108635%26_x_ns_gid%3D601101133649475%26_x_ads_channel%3Dgoogle%26_x_ns_lan%3Dko%26_x_gmc_account%3D778719075%26_x_login_type%3DGoogle%26_x_ns_gg_lnk_type%3Ddsa%26_x_bg_adid%3Dgd33663315-us-1%26topic_classify%3D130%26_x_ads_account%3D6580856735%26_x_ads_set%3D23575606741%26_x_ads_id%3D194525521660%26_x_ads_creative_id%3D798693724782%26_x_ns_source%3Dd%26_x_ns_gclid%3DEAIaIQobChMIqM-Zx6TYlAMV84vpBR2jkC2BEAEYASADEgKgyPD_BwE%26_x_ns_placement%3Dcafe.daum.net%26_x_ns_match_type%3D%26_x_ns_ad_position%3D%26_x_ns_product_id%3D%26_x_ns_target%3Dsegment_be_a_7035560136157392317%26_x_ns_devicemodel%3D%26_x_ns_wbraid%3D%7Bwbraid%7D%26_x_ns_gbraid%3D%7Bgbraid%7D%26_x_ns_targetid%3D%26gad_source%3D5%26gad_campaignid%3D23575606741%26gclid%3DEAIaIQobChMIqM-Zx6TYlAMV84vpBR2jkC2BEAEYASADEgKgyPD_BwE', 'https://adclick.g.doubleclick.net/aclk?sa=l&ai=C7WqzpEQWaqjtG_OXpt8Po6G2iQjY55bghgGTgviP3RXXyO-tjw4QASC0g78qYJv7_464KaABocCY8SjIAQngAgCoAwHIA8sEqgSsAk_QSn-fvaIFIfpGGvOgZZIznHBJmulEnPnXcutLbC6lqPLQ1coo8dxcil9pRByTUNf45tTcnrSbUXvw8HyPlFjlebZB3ljkN-G99U5i5zJb993XuO29XxDa311TrYE4Sp-bLEJnjF8rTG0IIquoIAJpHUKVrVoUjZFQh_ORraUtZt-A8UQRttJPVecy4dSfl89mqOYe_Re7cDmTrAUW3IVa0lxjxfsuVKs-8Ho0IOtc38zQLEQbJRdEem6eWHcSSYrL9A7UP6Xvb-27Jt8O5I14hoRvb79-VhpS1_vZmseORGQyCITlBTT_NuX91H8ys8Hghi7eM0iCCur97B6v9T1lwcpVdFbZm4wWdTcfXEql2eNtD2yRYmxH-6U0ut7cyrTayxKBZqP_88ZJh8AE_M3_1NQF4AQBiAXV69zpV_oFBgglEAEYA6AGLoAH5vW28QSoB6fMsQKoB-LYsQKoB6a-G6gHzM6xAqgH89EbqAeW2BuoB6qbsQKoB47OG6gHk9gbqAfw4BuoB-6WsQKoB_6esQKoB6--sQKoB9m2sQKoB5oGqAf_nrECqAffn7ECqAf4wrECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LEC2AcA-gcUY29tLmVpbm5vdmF0aW9uLnRlbXXACATSCDMIgGEQARidATIIioKAgICAgAg6D4BAgMCAgICAqIACqIOAEEi9_cE6WJfBmMek2JQDYAGACgOQCwOYCwHICwGADAGiDAVIAZABAaoNAktSyA0B4g0TCMrtmMek2JQDFfOL6QUdo5AtgeoNEwifsJnHpNiUAxXzi-kFHaOQLYHwDQKIDv___________wHYEwuIFAHQFQGYFgHKFgIKAPgWAYAXAbIXEBgBKgo3ODM5MTMyMDExUAa6FwI4AaoYFwkAAAAA4AXjQBIKNzgzOTEzMjAxMRgBshgJEgLTXRguIgEA0BgB6BgBwhkCCAE&ae=1&gclid=EAIaIQobChMIqM-Zx6TYlAMV84vpBR2jkC2BEAEYASAEEgK5t_D_BwE&num=1&cid=CAQShwIABaugfV36lO1HEnOQT_TLUlJS1W8gd_mlmJnDJ_KM3DTwGHlzx5557oNcv4HiMXt-hGY7bLxdLTBkriKink81B7k79AbGyGE9OYt1w3o4k1b7_Tc50PYYxX66Q0BCQ4vsIm46BImCyKtQYUb0mRbNQCeMTBlKT2XKBAqoy7yuLwNu-b6e5B5QDUZRdzTWryJMw66nU5t3YBHMVBzGQvu40-cxF3xp9whX3rKq8gPLRbBK3I_fCKP8pq86OMX_FlGNR39ZihdZ0GzqmWWds2F2dLNAsr6FJetA1-Cb0_4alvxmU_oqBqQaymCmsMNxIw56yLjzkoLcf0Zpg2xNGUvavUl-cKsSjBgB&sig=AOD64_2EGoDwthPYxzc2L_foMcDutfsbFw&client=ca-pub-3302927352513848&nb=9&adurl=https://www.temu.com/ul/kuiper/un3.html%3F_bg_fs%3D1%26subj%3Ddpa-un-dal%26_p_jump_id%3D1028%26_x_vst_scene%3Dadg%26goods_id%3D601099659834517%26sku_id%3D17619288134379%26adg_ctx%3Da-26ed4812~c-d7c5c2e2%26_x_ns_item_id%3D778719075-17619288134379%26_x_ads_sub_channel%3Dfeed%26_p_rfs%3D1%26_x_ns_prz_type%3D-1%26locale_override%3D185~ko~KRW%26_x_ns_sku_id%3D17619288134379%26_x_ns_gid%3D601099659834517%26_x_ads_channel%3Dgoogle%26_x_ns_lan%3Dko%26_x_gmc_account%3D778719075%26_x_login_type%3DGoogle%26_x_ns_gg_lnk_type%3Ddsa%26_x_bg_adid%3Dgd33663315-us-1%26topic_classify%3D130%26_x_ads_account%3D6580856735%26_x_ads_set%3D23575606741%26_x_ads_id%3D194525521660%26_x_ads_creative_id%3D798693724782%26_x_ns_source%3Dd%26_x_ns_gclid%3DEAIaIQobChMIqM-Zx6TYlAMV84vpBR2jkC2BEAEYASAEEgK5t_D_BwE%26_x_ns_placement%3Dcafe.daum.net%26_x_ns_match_type%3D%26_x_ns_ad_position%3D%26_x_ns_product_id%3D%26_x_ns_target%3Dsegment_be_a_7035560136157392317%26_x_ns_devicemodel%3D%26_x_ns_wbraid%3D%7Bwbraid%7D%26_x_ns_gbraid%3D%7Bgbraid%7D%26_x_ns_targetid%3D%26gad_source%3D5%26gad_campaignid%3D23575606741%26gclid%3DEAIaIQobChMIqM-Zx6TYlAMV84vpBR2jkC2BEAEYASAEEgK5t_D_BwE', 'https://adclick.g.doubleclick.net/aclk?sa=l&ai=CHywWpEQWaqjtG_OXpt8Po6G2iQjY55bghgGTgviP3RXXyO-tjw4QASC0g78qYJv7_464KaABocCY8SjIAQngAgCoAwHIA8sEqgSsAk_QSn-fvaIFIfpGGvOgZZIznHBJmulEnPnXcutLbC6lqPLQ1coo8dxcil9pRByTUNf45tTcnrSbUXvw8HyPlFjlebZB3ljkN-G99U5i5zJb993XuO29XxDa311TrYE4Sp-bLEJnjF8rTG0IIquoIAJpHUKVrVoUjZFQh_ORraUtZt-A8UQRttJPVecy4dSfl89mqOYe_Re7cDmTrAUW3IVa0lxjxfsuVKs-8Ho0IOtc38zQLEQbJRdEem6eWHcSSYrL9A7UP6Xvb-27Jt8O5I14hoRvb79-VhpS1_vZmseORGQyCITlBTT_NuX91H8ys8Hghi7eM0iCCur97B6v9T1lwcpVdFbZm4wWdTcfXEql2eNtD2yRYmxH-6U0ut7cyrTayxKBZqP_88ZJh8AE_M3_1NQF4AQBiAXV69zpV_oFBgglEAEYBKAGLoAH5vW28QSoB6fMsQKoB-LYsQKoB6a-G6gHzM6xAqgH89EbqAeW2BuoB6qbsQKoB47OG6gHk9gbqAfw4BuoB-6WsQKoB_6esQKoB6--sQKoB9m2sQKoB5oGqAf_nrECqAffn7ECqAf4wrECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LECqAfi2LEC2AcA-gcUY29tLmVpbm5vdmF0aW9uLnRlbXXACAXSCDMIgGEQARidATIIioKAgICAgAg6D4BAgMCAgICAqIACqIOAEEi9_cE6WJfBmMek2JQDYAGACgOQCwOYCwHICwGADAGiDAVIAZABAaoNAktSyA0B4g0TCMrtmMek2JQDFfOL6QUdo5AtgeoNEwifsJnHpNiUAxXzi-kFHaOQLYHwDQKIDv___________wHYEwuIFAHQFQGYFgHKFgIKAPgWAYAXAbIXEBgBKgo3ODM5MTMyMDExUAa6FwI4AaoYFwkAAAAA4AXjQBIKNzgzOTEzMjAxMRgBshgJEgLTXRguIgEA0BgB6BgBwhkCCAE&ae=1&gclid=EAIaIQobChMIqM-Zx6TYlAMV84vpBR2jkC2BEAEYASAFEgKst_D_BwE&num=1&cid=CAQShwIABaugfV36lO1HEnOQT_TLUlJS1W8gd_mlmJnDJ_KM3DTwGHlzx5557oNcv4HiMXt-hGY7bLxdLTBkriKink81B7k79AbGyGE9OYt1w3o4k1b7_Tc50PYYxX66Q0BCQ4vsIm46BImCyKtQYUb0mRbNQCeMTBlKT2XKBAqoy7yuLwNu-b6e5B5QDUZRdzTWryJMw66nU5t3YBHMVBzGQvu40-cxF3xp9whX3rKq8gPLRbBK3I_fCKP8pq86OMX_FlGNR39ZihdZ0GzqmWWds2F2dLNAsr6FJetA1-Cb0_4alvxmU_oqBqQaymCmsMNxIw56yLjzkoLcf0Zpg2xNGUvavUl-cKsSjBgB&sig=AOD64_2a0MPlTedQsJcNJWfV_Riy1BnodA&client=ca-pub-3302927352513848&nb=9&adurl=https://www.temu.com/ul/kuiper/un3.html%3F_bg_fs%3D1%26subj%3Ddpa-un-dal%26_p_jump_id%3D1028%26_x_vst_scene%3Dadg%26goods_id%3D601099759531885%26sku_id%3D17593172314765%26adg_ctx%3Da-a57d7a3b~c-ce15772e%26_x_ns_item_id%3D778719075-17593172314765%26_x_ads_sub_channel%3Dfeed%26_p_rfs%3D1%26_x_ns_prz_type%3D-1%26locale_override%3D185~ko~KRW%26_x_ns_sku_id%3D17593172314765%26_x_ns_gid%3D601099759531885%26_x_ads_channel%3Dgoogle%26_x_ns_lan%3Dko%26_x_gmc_account%3D778719075%26_x_login_type%3DGoogle%26_x_ns_gg_lnk_type%3Ddsa%26_x_bg_adid%3Dgd33663315-us-1%26topic_classify%3D130%26_x_ads_account%3D6580856735%26_x_ads_set%3D23575606741%26_x_ads_id%3D194525521660%26_x_ads_creative_id%3D798693724782%26_x_ns_source%3Dd%26_x_ns_gclid%3DEAIaIQobChMIqM-Zx6TYlAMV84vpBR2jkC2BEAEYASAFEgKst_D_BwE%26_x_ns_placement%3Dcafe.daum.net%26_x_ns_match_type%3D%26_x_ns_ad_position%3D%26_x_ns_product_id%3D%26_x_ns_target%3Dsegment_be_a_7035560136157392317%26_x_ns_devicemodel%3D%26_x_ns_wbraid%3D%7Bwbraid%7D%26_x_ns_gbraid%3D%7Bgbraid%7D%26_x_ns_targetid%3D%26gad_source%3D5%26gad_campaignid%3D23575606741%26gclid%3DEAIaIQobChMIqM-Zx6TYlAMV84vpBR2jkC2BEAEYASAFEgKst_D_BwE']
  Frame[7] url=about:blank  links=[]
  Frame[8] url=https://www.google.com/recaptcha/api2/aframe  links=[]
[게시판] 페이지 1: 0개 행 탐지

-- ── 2. 장소 ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS insp_locations (
  id         BIGSERIAL PRIMARY KEY,
  building   TEXT NOT NULL,   -- 'NK' | 'GB1' | 'GB2'
  name       TEXT NOT NULL,
  sort_order INT  NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 3. 장비 ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS insp_equipment (
  id             BIGSERIAL PRIMARY KEY,
  equipment_code TEXT    NOT NULL UNIQUE,
  name           TEXT    NOT NULL,
  type           TEXT    NOT NULL,   -- 'TV'|'MIC'|'SPEAKER'|'CAMERA'|'PC'|'DID'|'SETTOP'
  location_id    BIGINT  NOT NULL REFERENCES insp_locations(id) ON DELETE CASCADE,
  model          TEXT,
  installed_at   TEXT,               -- 'YYYY-MM-DD' 문자열
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_insp_equipment_location ON insp_equipment(location_id);
CREATE INDEX IF NOT EXISTS idx_insp_equipment_type     ON insp_equipment(type);

-- ── 4. 점검 세션 ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS insp_sessions (
  id           BIGSERIAL PRIMARY KEY,
  year         INT    NOT NULL,
  month        INT    NOT NULL,
  location_id  BIGINT NOT NULL REFERENCES insp_locations(id),
  inspector_id BIGINT NOT NULL REFERENCES insp_users(id),
  status       TEXT   NOT NULL DEFAULT 'in_progress',  -- 'pending'|'in_progress'|'completed'
  started_at   TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_insp_sessions_location  ON insp_sessions(location_id);
CREATE INDEX IF NOT EXISTS idx_insp_sessions_inspector ON insp_sessions(inspector_id);
CREATE INDEX IF NOT EXISTS idx_insp_sessions_ym        ON insp_sessions(year, month);

-- ── 5. 점검 결과 ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS insp_results (
  id                BIGSERIAL PRIMARY KEY,
  session_id        BIGINT  NOT NULL REFERENCES insp_sessions(id) ON DELETE CASCADE,
  equipment_id      BIGINT  NOT NULL REFERENCES insp_equipment(id) ON DELETE CASCADE,
  power_ok          BOOLEAN NOT NULL DEFAULT TRUE,
  screen_ok         BOOLEAN NOT NULL DEFAULT TRUE,
  network_ok        BOOLEAN NOT NULL DEFAULT TRUE,
  cable_ok          BOOLEAN NOT NULL DEFAULT TRUE,
  content_ok        BOOLEAN NOT NULL DEFAULT TRUE,
  no_issues         BOOLEAN NOT NULL DEFAULT TRUE,
  issue_description TEXT,
  action_taken      TEXT,
  action_status     TEXT    NOT NULL DEFAULT 'normal',  -- 'normal'|'issue'|'as_request'|'completed'
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, equipment_id)
);

CREATE INDEX IF NOT EXISTS idx_insp_results_session   ON insp_results(session_id);
CREATE INDEX IF NOT EXISTS idx_insp_results_equipment ON insp_results(equipment_id);
