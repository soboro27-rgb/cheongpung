import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WWM 매입검수 플랫폼",
  description: "월드와이드메모리(주) 매입검수 시스템",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
