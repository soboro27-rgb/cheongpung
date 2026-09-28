import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "이게누구야 — 연락처 정리 확인 플랫폼" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
