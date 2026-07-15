import { NextRequest, NextResponse } from "next/server";

type ContactPayload = {
  company?: string;
  name?: string;
  contact?: string;
  vendor?: string;
  roomSize?: string;
};

export async function POST(req: NextRequest) {
  let body: ContactPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const { company, name, contact } = body;
  if (!company?.trim() || !name?.trim() || !contact?.trim()) {
    return NextResponse.json({ error: "missing required fields" }, { status: 400 });
  }

  // TODO: 실제 이메일 전송 또는 CRM 연동은 백엔드 연동 단계에서 구현.
  console.log("[contact] pilot inquiry received:", body);

  return NextResponse.json({ ok: true });
}
