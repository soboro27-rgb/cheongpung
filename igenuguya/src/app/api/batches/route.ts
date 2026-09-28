import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { sendKakaoFriendMessage } from "@/lib/kakao";

interface SelectedFriend {
  uuid: string;
  nickname: string;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });

  const { messageText, friends } = (await req.json()) as {
    messageText?: string;
    friends?: SelectedFriend[];
  };

  if (!messageText || !friends || friends.length === 0) {
    return NextResponse.json({ error: "메시지와 대상 친구를 선택해 주세요." }, { status: 400 });
  }

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? req.nextUrl.origin;

  const batch = await prisma.batch.create({
    data: {
      userId: user.id,
      messageText,
      contacts: {
        create: friends.map((f) => ({
          kakaoUuid: f.uuid,
          nickname: f.nickname,
          token: randomUUID(),
        })),
      },
    },
    include: { contacts: true },
  });

  const results = await Promise.allSettled(
    batch.contacts.map(async (contact) => {
      const linkUrl = `${base}/r/${contact.token}`;
      await sendKakaoFriendMessage(user.accessToken ?? "", [contact.kakaoUuid ?? ""], linkUrl, messageText);
      await prisma.contact.update({
        where: { id: contact.id },
        data: { status: "SENT", sentAt: new Date() },
      });
      await prisma.sendLog.create({
        data: { contactId: contact.id, status: "SENT" },
      });
    }),
  );

  const failedCount = results.filter((r) => r.status === "rejected").length;
  if (failedCount > 0) {
    const failedContacts = batch.contacts.filter((_, i) => results[i].status === "rejected");
    await prisma.contact.updateMany({
      where: { id: { in: failedContacts.map((c) => c.id) } },
      data: { status: "FAILED" },
    });
    results.forEach((r, i) => {
      if (r.status === "rejected") {
        console.error(`[batch send] contact ${batch.contacts[i].id} failed:`, r.reason);
      }
    });
  }

  return NextResponse.json({ batchId: batch.id, total: batch.contacts.length, failedCount });
}
