import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPII, deletePII } from "@/lib/redis";
import { createReplyAdapter } from "@/lib/adapters/reply";

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { action, newAddress } = await req.json() as { action: "CONFIRMED" | "MODIFIED"; newAddress?: string };

  const rec = await prisma.recipientToken.findUnique({ where: { token }, include: { campaign: true } });
  if (!rec) return NextResponse.json({ error: "유효하지 않은 링크입니다." }, { status: 404 });
  if (rec.status === "CONFIRMED" || rec.status === "MODIFIED")
    return NextResponse.json({ error: "이미 응답하셨습니다." }, { status: 409 });

  const pii = await getPII(token);
  if (!pii) return NextResponse.json({ error: "세션이 만료되었습니다. 링크를 다시 접속해 주세요." }, { status: 410 });

  if (action === "MODIFIED" && (!newAddress || newAddress.trim().length < 5))
    return NextResponse.json({ error: "새 주소를 입력해 주세요." }, { status: 400 });

  const now = new Date();
  const payload = {
    token,
    status: action,
    originalAddress: pii.originalAddress,
    newAddress: action === "MODIFIED" ? newAddress! : undefined,
    consentAt: now.toISOString(),
    respondedAt: now.toISOString(),
  };

  const adapter = createReplyAdapter(
    rec.campaign.returnTargetType,
    rec.campaign.returnTargetRef,
    rec.campaign.returnTargetSecret ?? undefined,
  );

  await adapter.send(payload);

  // PII 즉시 파기
  await deletePII(token);

  await prisma.recipientToken.update({
    where: { id: rec.id },
    data: { status: action, respondedAt: now, consentAt: now },
  });

  return NextResponse.json({ ok: true });
}
