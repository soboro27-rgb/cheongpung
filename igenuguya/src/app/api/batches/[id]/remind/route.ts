import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { sendKakaoFriendMessage } from "@/lib/kakao";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { id } = await params;
  const batch = await prisma.batch.findUnique({
    where: { id: Number(id) },
    include: { contacts: true, user: true },
  });
  if (!batch || batch.userId !== session.userId) {
    return NextResponse.json({ error: "찾을 수 없습니다." }, { status: 404 });
  }

  const targets = batch.contacts.filter((c) => c.status === "SENT" && !c.reminderSentAt);
  if (targets.length === 0) {
    return NextResponse.json({ error: "리마인드를 보낼 대상이 없습니다." }, { status: 400 });
  }

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? req.nextUrl.origin;
  const results = await Promise.allSettled(
    targets.map(async (c) => {
      await sendKakaoFriendMessage(
        batch.user.accessToken ?? "",
        [c.kakaoUuid ?? ""],
        `${base}/r/${c.token}`,
        `[리마인드] ${batch.messageText}`,
      );
      await prisma.contact.update({ where: { id: c.id }, data: { reminderSentAt: new Date() } });
      await prisma.sendLog.create({ data: { contactId: c.id, status: "REMINDER_SENT" } });
    }),
  );

  const failedCount = results.filter((r) => r.status === "rejected").length;
  return NextResponse.json({ total: targets.length, failedCount });
}
