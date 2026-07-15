import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "whcheck — 배송 주소 검증 플랫폼" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
