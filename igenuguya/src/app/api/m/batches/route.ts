import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { getMobileUserId, json, preflight } from "@/lib/mobile";
import { buildMessageWithLink, normalizePhone, sendSms } from "@/lib/sms";

export const OPTIONS = preflight;

const BATCH_LIMIT = Number(process.env.SMS_BATCH_LIMIT ?? 20);
const DAILY_LIMIT = Number(process.env.SMS_DAILY_LIMIT ?? 50);

export async function GET(req: NextRequest) {
  const userId = await getMobileUserId(req);
  if (!userId) return json(req, { error: "로그인이 필요합니다." }, 401);

  const batches = await prisma.batch.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { contacts: true },
  });
  return json(req, {
    batches: batches.map((b) => ({
      id: b.id,
      createdAt: b.createdAt.toISOString(),
      total: b.contacts.length,
      keep: b.contacts.filter((c) => c.status === "KEEP").length,
      release: b.contacts.filter((c) => c.status === "RELEASE").length,
      pending: b.contacts.filter((c) => c.status === "SENT").length,
      failed: b.contacts.filter((c) => c.status === "FAILED").length,
    })),
  });
}

export async function POST(req: NextRequest) {
  const userId = await getMobileUserId(req);
  if (!userId) return json(req, { error: "로그인이 필요합니다." }, 401);

  const { messageText, contacts } = (await req.json().catch(() => ({}))) as {
    messageText?: string;
    contacts?: { name?: string; phone?: string }[];
  };

  const text = messageText?.trim();
  if (!text || text.length > 500) return json(req, { error: "메시지를 확인해 주세요." }, 400);

  // 번호 정규화 + 중복 제거 (같은 번호에 두 번 보내지 않는다)
  const seen = new Set<string>();
  const targets: { name: string; phone: string }[] = [];
  for (const c of contacts ?? []) {
    const phone = c.phone ? normalizePhone(c.phone) : null;
    if (!phone || seen.has(phone)) continue;
    seen.add(phone);
    targets.push({ name: (c.name ?? "").trim().slice(0, 40) || "이름없음", phone });
  }
  if (targets.length === 0) return json(req, { error: "보낼 수 있는 번호가 없어요." }, 400);
  if (targets.length > BATCH_LIMIT) {
    return json(req, { error: `한 번에 ${BATCH_LIMIT}명까지 보낼 수 있어요.` }, 400);
  }

  const since = new Date(Date.now() - 24 * 3600 * 1000);
  const sentToday = await prisma.contact.count({
    where: { batch: { userId }, createdAt: { gte: since } },
  });
  if (sentToday + targets.length > DAILY_LIMIT) {
    return json(req, { error: `하루에 ${DAILY_LIMIT}명까지 보낼 수 있어요. 내일 다시 시도해 주세요.` }, 429);
  }

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? req.nextUrl.origin;
  const batch = await prisma.batch.create({
    data: {
      userId,
      messageText: text,
      contacts: {
        create: targets.map((t) => ({ nickname: t.name, phone: t.phone, token: randomUUID() })),
      },
    },
    include: { contacts: true },
  });

  let failedCount = 0;
  for (const c of batch.contacts) {
    const r = await sendSms(c.phone!, buildMessageWithLink(text, `${base}/r/${c.token}`));
    await prisma.sendLog.create({
      data: {
        contactId: c.id,
        provider: "sms",
        providerMsgId: r.providerMsgId,
        errorCode: r.errorCode,
        status: r.ok ? "SENT" : "FAILED",
      },
    });
    await prisma.contact.update({
      where: { id: c.id },
      data: r.ok ? { status: "SENT", sentAt: new Date() } : { status: "FAILED" },
    });
    if (!r.ok) failedCount++;
  }

  return json(req, { batchId: batch.id, total: batch.contacts.length, failedCount });
}
