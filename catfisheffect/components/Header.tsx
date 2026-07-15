"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import CatfishMark from "./icons/CatfishMark";

const NAV_ITEMS = [
  { href: "/product", label: "제품" },
  { href: "/how-it-works", label: "작동 원리" },
  { href: "/internal-design", label: "내부 설계" },
  { href: "/for-business", label: "도입 안내" },
  { href: "/security", label: "보안·법적 고지" },
  { href: "/contact", label: "문의" },
];

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-bg-dark/85 backdrop-blur">
      <div className="mx-auto flex max-w-content items-center justify-between px-5 py-4 sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5"
          onClick={() => setOpen(false)}
        >
          <CatfishMark className="h-6 w-auto" />
          <span className="text-[15px] font-extrabold tracking-tight text-text-primary">
            CATFISH EFFECT
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors ${
                  active
                    ? "text-lime-mint"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/contact"
          className="btn-cta hidden !py-2.5 !px-5 text-sm md:inline-flex"
        >
          파일럿 문의하기
        </Link>

        <button
          type="button"
          aria-label="메뉴 열기"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 md:hidden"
        >
          <span
            className={`h-[1.5px] w-5 bg-text-primary transition-transform ${
              open ? "translate-y-[3.5px] rotate-45" : ""
            }`}
          />
          <span
            className={`h-[1.5px] w-5 bg-text-primary transition-transform ${
              open ? "-translate-y-[3.5px] -rotate-45" : ""
            }`}
          />
        </button>
      </div>

      {open && (
        <nav className="border-t border-white/5 px-5 pb-6 pt-2 md:hidden">
          <div className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`rounded-lg px-3 py-3 text-sm font-medium ${
                  pathname === item.href
                    ? "bg-smoke-blue-dark text-lime-mint"
                    : "text-text-muted"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/contact"
              onClick={() => setOpen(false)}
              className="btn-cta mt-3 !py-3 text-sm"
            >
              파일럿 문의하기
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
