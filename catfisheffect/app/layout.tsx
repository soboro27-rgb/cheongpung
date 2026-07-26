import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://catfisheffect.co.kr"),
  title: {
    default: "Catfish AI | 형식에 파문을 일으키다",
    template: "%s | Catfish AI",
  },
  description:
    "회의실에 놓는 퍽형 블루투스 AI 음성 트리거 하드웨어. 이미 계약한 LLM을 물리적 버튼 하나로 호출·연동하는 캐피시AI 보이스 스피커.",
  keywords: [
    "캐피시AI",
    "캐피시AI 보이스 스피커",
    "회의 AI",
    "BYO-LLM",
    "MS Copilot",
    "Claude Enterprise",
  ],
  openGraph: {
    title: "Catfish AI | 형식에 파문을 일으키다",
    description:
      "이미 쓰는 LLM 그대로, 원터치로 회의를 호출한다. B2B 회의실을 위한 캐피시AI 보이스 스피커.",
    url: "https://catfisheffect.co.kr",
    siteName: "Catfish AI",
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className="dark">
      <body className="flex min-h-screen flex-col bg-bg-dark font-sans text-text-primary antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
