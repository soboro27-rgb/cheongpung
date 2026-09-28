import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const contact = await prisma.contact.findUnique({
    where: { token },
    include: { batch: { include: { user: true } } },
  });
  if (!contact) return NextResponse.json({ error: "유효하지 않은 링크입니다." }, { status: 404 });

  return NextResponse.json({
    status: contact.status,
    senderNickname: contact.batch.user.nickname,
    messageText: contact.batch.messageText,
  });
}
