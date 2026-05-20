import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "ITAD 견적 시스템",
  description: "코어테일 IT 자산 매각 견적 자동화 시스템",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className="h-full">
      <body className="h-full antialiased">
        {children}
        <Toaster richColors />
      </body>
    </html>
  );
}
