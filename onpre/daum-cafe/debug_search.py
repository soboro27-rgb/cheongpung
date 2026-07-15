"""검색 URL 구조 디버그 - 로그인 후 실행"""
from playwright.sync_api import sync_playwright
from pathlib import Path
import urllib.parse, re

EMAIL    = "favorte@hanmail.net"
PASSWORD = "!cbj90436122"
CAFE_URL = "https://cafe.daum.net/usedexport"
ddir = Path("debug")
ddir.mkdir(exist_ok=True)

def login(page):
    page.goto(CAFE_URL, wait_until="domcontentloaded")
    page.wait_for_timeout(3000)
    url = page.url
    if "kakao.com" in url or "logins.daum" in url:
        print("[로그인] 카카오 페이지...")
        try:
            for sel in ["input[name='loginKey']", "input[type='email']"]:
                try:
                    page.wait_for_selector(sel, timeout=3000)
                    page.fill(sel, EMAIL); break
                except: pass
            page.keyboard.press("Tab")
            page.wait_for_timeout(300)
            for sel in ["input[type='password']", "input[name='password']"]:
                try:
                    page.wait_for_selector(sel, timeout=3000)
                    page.fill(sel, PASSWORD); break
                except: pass
            page.wait_for_timeout(300)
            btn = page.query_selector("button[type='submit'],.btn_g.highlight")
            if btn: btn.click()
            else: page.keyboard.press("Enter")
            page.wait_for_load_state("networkidle", timeout=20000)
        except Exception as e:
            print(f"자동 실패: {e}")
            input("직접 로그인 후 Enter: ")
    elif "usedexport" in url:
        print("[로그인] 이미 로그인됨")
    else:
        input("로그인 후 카페로 이동하고 Enter: ")
    if "usedexport" not in page.url:
        page.goto(CAFE_URL, wait_until="domcontentloaded")
        page.wait_for_timeout(2000)
    print(f"[로그인] 완료: {page.url}")

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=False, slow_mo=80)
    ctx = browser.new_context(locale="ko-KR", user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")
    page = ctx.new_page()
    page.set_default_timeout(20000)

    login(page)

    # grpid 추출
    page.goto(CAFE_URL + "/HreT", wait_until="domcontentloaded")
    page.wait_for_timeout(3000)
    grpid = "MMhX"
    for frame in page.frames:
        m = re.search(r'grpid=([A-Za-z0-9]+)', frame.url)
        if m: grpid = m.group(1); break
    print(f"grpid = {grpid}")

    vendor = "에이스피씨"
    encoded = urllib.parse.quote(vendor)

    # ── 테스트 1: _c21_ 검색 type=writer ─────────────────────────
    print("\n=== 테스트 1: _c21_ type=writer ===")
    url1 = f"https://cafe.daum.net/_c21_/bbs_search?grpid={grpid}&type=writer&q={encoded}&page=1"
    page.goto(url1, wait_until="domcontentloaded")
    page.wait_for_timeout(3000)
    print(f"최종URL: {page.url}")
    print(f"프레임수: {len(page.frames)}")
    for i, f in enumerate(page.frames):
        print(f"  Frame[{i}]: {f.url[:120]}")
    page.screenshot(path=str(ddir / "test1_writer.png"), full_page=False)
    (ddir / "test1_writer.html").write_text(page.content(), encoding="utf-8", errors="replace")

    # 링크 확인
    for i, f in enumerate(page.frames):
        try:
            links = f.evaluate("""
                () => Array.from(document.querySelectorAll('a[href]'))
                    .map(a => ({href: a.href, text: a.textContent.trim().substring(0,30)}))
                    .filter(x => x.href.includes('usedexport') || x.href.includes('bbs_read'))
                    .slice(0, 10)
            """)
            print(f"  Frame[{i}] usedexport 링크: {links}")
        except Exception as e:
            print(f"  Frame[{i}] 오류: {e}")

    # ── 테스트 2: _c21_ 검색 type=nick ─────────────────────────
    print("\n=== 테스트 2: _c21_ type=nick ===")
    url2 = f"https://cafe.daum.net/_c21_/bbs_search?grpid={grpid}&type=nick&q={encoded}&page=1"
    page.goto(url2, wait_until="domcontentloaded")
    page.wait_for_timeout(3000)
    print(f"최종URL: {page.url}")
    print(f"프레임수: {len(page.frames)}")
    page.screenshot(path=str(ddir / "test2_nick.png"), full_page=False)
    (ddir / "test2_nick.html").write_text(page.content(), encoding="utf-8", errors="replace")
    for i, f in enumerate(page.frames):
        try:
            links = f.evaluate("""
                () => Array.from(document.querySelectorAll('a[href]'))
                    .map(a => ({href: a.href, text: a.textContent.trim().substring(0,30)}))
                    .filter(x => x.href.includes('usedexport') || x.href.includes('bbs_read'))
                    .slice(0, 10)
            """)
            print(f"  Frame[{i}] usedexport 링크: {links}")
        except Exception as e:
            print(f"  Frame[{i}] 오류: {e}")

    # ── 테스트 3: 카페 메인에서 검색창 찾기 ──────────────────────
    print("\n=== 테스트 3: 카페 메인 검색창 찾기 ===")
    page.goto(CAFE_URL, wait_until="domcontentloaded")
    page.wait_for_timeout(3000)
    print(f"프레임수: {len(page.frames)}")
    for i, f in enumerate(page.frames):
        try:
            inputs = f.evaluate("""
                () => Array.from(document.querySelectorAll('input'))
                    .map(el => ({
                        type: el.type, name: el.name, id: el.id,
                        placeholder: el.placeholder, class: el.className.substring(0,40)
                    }))
            """)
            if inputs:
                print(f"  Frame[{i}] ({f.url[:80]}) 입력창: {inputs}")
        except Exception as e:
            print(f"  Frame[{i}] 오류: {e}")

    # ── 테스트 4: 카페 홈에서 직접 검색 시도 ─────────────────────
    print("\n=== 테스트 4: 검색창 직접 입력 시도 ===")
    page.goto(CAFE_URL, wait_until="domcontentloaded")
    page.wait_for_timeout(3000)
    search_done = False
    for i, f in enumerate(page.frames):
        for sel in ["input[name='query']", "input[name='q']", "input[type='search']",
                    "input[placeholder*='검색']", ".search_inp", "#search_query"]:
            try:
                el = f.query_selector(sel)
                if el:
                    print(f"  Frame[{i}] 검색창 발견: {sel}")
                    el.click()
                    el.fill(vendor)
                    page.wait_for_timeout(500)
                    el.press("Enter")
                    page.wait_for_timeout(3000)
                    print(f"  검색 후 URL: {page.url}")
                    page.screenshot(path=str(ddir / "test4_search_result.png"), full_page=False)
                    (ddir / "test4_search_result.html").write_text(page.content(), encoding="utf-8", errors="replace")
                    # 결과 링크 확인
                    for j, f2 in enumerate(page.frames):
                        try:
                            links = f2.evaluate("""
                                () => Array.from(document.querySelectorAll('a[href]'))
                                    .map(a => ({href: a.href, text: a.textContent.trim().substring(0,40)}))
                                    .filter(x => x.href.includes('usedexport') && /\/\d+/.test(x.href))
                                    .slice(0, 10)
                            """)
                            if links:
                                print(f"    Frame[{j}] 게시글 링크: {links}")
                        except: pass
                    search_done = True
                    break
            except Exception as e:
                pass
        if search_done:
            break
    if not search_done:
        print("  검색창을 찾을 수 없음")

    print("\n\n=== 결과 저장 완료 ===")
    print("debug/ 폴더의 PNG/HTML 파일을 확인하세요")
    input("Enter로 종료: ")
    browser.close()
