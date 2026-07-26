import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "문의",
  description: "캐피시AI 보이스 스피커 파일럿 프로그램 신청 및 도입 문의.",
};

export default function ContactPage() {
  return (
    <section className="section">
      <div className="mx-auto max-w-content px-5 sm:px-8">
        <div className="mx-auto max-w-xl text-center">
          <span className="eyebrow">Contact</span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            파일럿 문의하기
          </h1>
          <p className="mt-4 text-base leading-relaxed text-text-muted">
            아래 정보를 남겨주시면 담당자가 확인 후 순차적으로 연락드립니다.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-xl">
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
