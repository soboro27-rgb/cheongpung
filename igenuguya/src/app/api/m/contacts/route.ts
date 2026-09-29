import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileUserId, json, preflight } from "@/lib/mobile";

export const OPTIONS = preflight;

// 배치(발송 회차)에 상관없이, 이 사용자가 보낸 모든 연락처를 한눈에 보기 위한 목록.
export async function GET(req: NextRequest) {
  const userId = await getMobileUserId(req);
  if (!userId) return json(req, { error: "로그인이 필요합니다." }, 401);

  const contacts = await prisma.contact.findMany({
    where: { batch: { userId } },
    orderBy: { createdAt: "desc" },
    include: { batch: { select: { createdAt: true } } },
  });

  const summary = {
    total: contacts.length,
    keep: contacts.filter((c) => c.status === "KEEP").length,
    release: contacts.filter((c) => c.status === "RELEASE").length,
    pending: contacts.filter((c) => c.status === "SENT" || c.status === "PENDING").length,
    failed: contacts.filter((c) => c.status === "FAILED").length,
  };

  return json(req, {
    summary,
    contacts: contacts.map((c) => ({
      id: c.id,
      batchId: c.batchId,
      name: c.nickname,
      status: c.status,
      replyMessage: c.replyMessage,
      sentAt: (c.sentAt ?? c.batch.createdAt).toISOString(),
    })),
  });
}
