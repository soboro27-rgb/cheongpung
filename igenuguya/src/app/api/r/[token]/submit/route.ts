import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { action, message } = (await req.json()) as { action?: "KEEP" | "RELEASE"; message?: string };

  if (action !== "KEEP" && action !== "RELEASE") {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const replyMessage = message?.trim().slice(0, 300);
  if (action === "KEEP" && !replyMessage) {
    return NextResponse.json({ error: "메시지를 입력해 주세요." }, { status: 400 });
  }

  const contact = await prisma.contact.findUnique({ where: { token } });
  if (!contact) return NextResponse.json({ error: "유효하지 않은 링크입니다." }, { status: 404 });
  if (contact.status === "KEEP" || contact.status === "RELEASE") {
    return NextResponse.json({ error: "이미 응답하셨습니다." }, { status: 409 });
  }

  await prisma.contact.update({
    where: { id: contact.id },
    data: {
      status: action,
      respondedAt: new Date(),
      replyMessage: action === "KEEP" ? replyMessage : null,
    },
  });

  return NextResponse.json({ ok: true });
}
