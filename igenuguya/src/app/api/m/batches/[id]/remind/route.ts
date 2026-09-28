import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileUserId, json, preflight } from "@/lib/mobile";
import { buildMessageWithLink, sendSms } from "@/lib/sms";

export const OPTIONS = preflight;

// 응답 없는 사람에게 리마인드 1회만. 자동 삭제는 없다(최종 판단은 항상 본인).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getMobileUserId(req);
  if (!userId) return json(req, { error: "로그인이 필요합니다." }, 401);

  const { id } = await params;
  const batch = await prisma.batch.findUnique({ where: { id: Number(id) }, include: { contacts: true } });
  if (!batch || batch.userId !== userId) return json(req, { error: "찾을 수 없습니다." }, 404);

  const targets = batch.contacts.filter((c) => c.status === "SENT" && !c.reminderSentAt && c.phone);
  if (targets.length === 0) return json(req, { error: "리마인드를 보낼 대상이 없어요." }, 400);

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? req.nextUrl.origin;
  let failedCount = 0;
  for (const c of targets) {
    const r = await sendSms(c.phone!, buildMessageWithLink(`[리마인드] ${batch.messageText}`, `${base}/r/${c.token}`));
    await prisma.sendLog.create({
      data: {
        contactId: c.id,
        provider: "sms",
        providerMsgId: r.providerMsgId,
        errorCode: r.errorCode,
        status: r.ok ? "REMINDER_SENT" : "REMINDER_FAILED",
      },
    });
    if (r.ok) await prisma.contact.update({ where: { id: c.id }, data: { reminderSentAt: new Date() } });
    else failedCount++;
  }
  return json(req, { total: targets.length, failedCount });
}
