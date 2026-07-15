"use client";

import { useState, type FormEvent } from "react";

type FormState = {
  company: string;
  name: string;
  contact: string;
  vendor: string;
  roomSize: string;
};

const INITIAL_STATE: FormState = {
  company: "",
  name: "",
  contact: "",
  vendor: "",
  roomSize: "",
};

const VENDOR_OPTIONS = [
  "MS Copilot",
  "Claude Enterprise",
  "Gemini Workspace",
  "기타 / 미정",
];

const ROOM_SIZE_OPTIONS = ["4인 이하", "5~8인", "9~15인", "16인 이상"];

const EMAIL_OR_PHONE_RE =
  /^(?:[^\s@]+@[^\s@]+\.[^\s@]+|0\d{1,2}-?\d{3,4}-?\d{4})$/;

type Status = "idle" | "submitting" | "success" | "error";

export default function ContactForm() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [status, setStatus] = useState<Status>("idle");

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};

    if (!form.company.trim()) {
      next.company = "회사명을 입력해 주세요.";
    }
    if (!form.name.trim()) {
      next.name = "담당자명을 입력해 주세요.";
    }
    if (!form.contact.trim()) {
      next.contact = "이메일 또는 연락처를 입력해 주세요.";
    } else if (!EMAIL_OR_PHONE_RE.test(form.contact.trim())) {
      next.contact = "올바른 이메일 또는 전화번호 형식이 아닙니다.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) return;

    setStatus("submitting");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("submit failed");
      setStatus("success");
      setForm(INITIAL_STATE);
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="card p-8 text-center sm:p-10">
        <p className="text-lg font-bold text-lime-mint">
          문의가 접수되었습니다
        </p>
        <p className="mt-3 text-sm leading-relaxed text-text-muted">
          담당자가 남겨주신 연락처로 순차적으로 연락드리겠습니다. 감사합니다.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="btn-outline mt-6 !py-2.5 text-sm"
        >
          다시 문의하기
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-6 p-6 sm:p-9" noValidate>
      <Field label="회사명" htmlFor="company" error={errors.company} required>
        <input
          id="company"
          name="company"
          type="text"
          value={form.company}
          onChange={(e) => update("company", e.target.value)}
          placeholder="예: 코레테일"
          className="field-input"
        />
      </Field>

      <Field label="담당자명" htmlFor="name" error={errors.name} required>
        <input
          id="name"
          name="name"
          type="text"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="예: 홍길동"
          className="field-input"
        />
      </Field>

      <Field
        label="이메일 또는 연락처"
        htmlFor="contact"
        error={errors.contact}
        required
      >
        <input
          id="contact"
          name="contact"
          type="text"
          value={form.contact}
          onChange={(e) => update("contact", e.target.value)}
          placeholder="예: name@company.com 또는 010-1234-5678"
          className="field-input"
        />
      </Field>

      <Field label="현재 사용 중인 LLM 벤더" htmlFor="vendor">
        <select
          id="vendor"
          name="vendor"
          value={form.vendor}
          onChange={(e) => update("vendor", e.target.value)}
          className="field-input"
        >
          <option value="">선택 안 함</option>
          {VENDOR_OPTIONS.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </Field>

      <Field label="회의실 규모" htmlFor="roomSize">
        <select
          id="roomSize"
          name="roomSize"
          value={form.roomSize}
          onChange={(e) => update("roomSize", e.target.value)}
          className="field-input"
        >
          <option value="">선택 안 함</option>
          {ROOM_SIZE_OPTIONS.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </Field>

      {status === "error" && (
        <p className="text-sm text-red-400">
          제출 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="btn-cta w-full disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "submitting" ? "제출 중..." : "파일럿 신청하기"}
      </button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  error,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-semibold">
        {label}
        {required && <span className="ml-1 text-lime-mint">*</span>}
      </label>
      <div className="mt-2">{children}</div>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  );
}
