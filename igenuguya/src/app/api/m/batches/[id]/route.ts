import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileUserId, json, preflight } from "@/lib/mobile";

export const OPTIONS = preflight;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getMobileUserId(req);
  if (!userId) return json(req, { error: "로그인이 필요합니다." }, 401);

  const { id } = await params;
  const batch = await prisma.batch.findUnique({ where: { id: Number(id) }, include: { contacts: true } });
  if (!batch || batch.userId !== userId) return json(req, { error: "찾을 수 없습니다." }, 404);

  return json(req, {
    id: batch.id,
    messageText: batch.messageText,
    createdAt: batch.createdAt.toISOString(),
    contacts: batch.contacts.map((c) => ({
      id: c.id,
      name: c.nickname,
      status: c.status,
      reminderSent: !!c.reminderSentAt,
      replyMessage: c.replyMessage,
    })),
  });
}
