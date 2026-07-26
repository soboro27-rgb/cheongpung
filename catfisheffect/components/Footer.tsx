import Link from "next/link";
import CatfishMark from "./icons/CatfishMark";

const FOOTER_LINKS = [
  { href: "/product", label: "제품" },
  { href: "/how-it-works", label: "작동 원리" },
  { href: "/internal-design", label: "내부 설계" },
  { href: "/for-business", label: "도입 안내" },
  { href: "/security", label: "보안·법적 고지" },
  { href: "/contact", label: "문의" },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-smoke-blue-dark/40">
      <div className="mx-auto max-w-content px-5 py-12 sm:px-8">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xs">
            <div className="flex items-center gap-2">
              <CatfishMark className="h-5 w-auto" />
              <span className="text-sm font-extrabold tracking-tight text-text-primary">
                CATFISH AI
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-text-muted">
              형식에 파문을 일으키다.
              <br />
              캐피시AI는 회의실을 위한 캐피시AI 보이스 스피커를 만듭니다.
            </p>
          </div>

          <nav className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
            {FOOTER_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-text-muted transition-colors hover:text-text-primary"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-white/5 pt-6 text-xs text-text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Catfish AI. All rights reserved.</p>
          <p>catfisheffect.co.kr</p>
        </div>
      </div>
    </footer>
  );
}
