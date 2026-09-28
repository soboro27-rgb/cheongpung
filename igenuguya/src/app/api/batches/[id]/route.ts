import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { id } = await params;
  const batch = await prisma.batch.findUnique({
    where: { id: Number(id) },
    include: { contacts: true },
  });
  if (!batch || batch.userId !== session.userId) {
    return NextResponse.json({ error: "찾을 수 없습니다." }, { status: 404 });
  }

  const summary = {
    total: batch.contacts.length,
    pending: batch.contacts.filter((c) => c.status === "PENDING" || c.status === "SENT").length,
    keep: batch.contacts.filter((c) => c.status === "KEEP").length,
    release: batch.contacts.filter((c) => c.status === "RELEASE").length,
    failed: batch.contacts.filter((c) => c.status === "FAILED").length,
  };

  return NextResponse.json({
    id: batch.id,
    messageText: batch.messageText,
    createdAt: batch.createdAt,
    summary,
    contacts: batch.contacts.map((c) => ({
      id: c.id,
      nickname: c.nickname,
      status: c.status,
      sentAt: c.sentAt,
      reminderSentAt: c.reminderSentAt,
      respondedAt: c.respondedAt,
    })),
  });
}
