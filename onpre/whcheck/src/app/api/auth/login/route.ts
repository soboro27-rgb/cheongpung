import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import { createSession, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin) return NextResponse.json({ error: "이메일 또는 비밀번호가 올바르지 않습니다." }, { status: 401 });
  const ok = await compare(password, admin.passwordHash);
  if (!ok) return NextResponse.json({ error: "이메일 또는 비밀번호가 올바르지 않습니다." }, { status: 401 });
  const token = await createSession({ adminId: admin.id, email: admin.email });
  await setSessionCookie(token);
  return NextResponse.json({ ok: true });
}
