import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPII } from "@/lib/redis";
import { maskPhone } from "@/lib/crypto";
import { createAlimtalkAdapter } from "@/lib/adapters/alimtalk";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const campaign = await prisma.campaign.findUnique({ where: { id: Number(id) } });
  if (!campaign) return NextResponse.json({ error: "캠페인 없음" }, { status: 404 });

  const targets = await prisma.recipientToken.findMany({
    where: { campaignId: campaign.id, status: { in: ["PENDING", "FAILED"] } },
  });

  const adapter = createAlimtalkAdapter();
  let sent = 0, failed = 0;

  for (const target of targets) {
    const pii = await getPII(target.token);
    if (!pii) { failed++; continue; }

    const results = await adapter.send([{
      to: pii.phone,
      templateCode: process.env.ALIMTALK_TEMPLATE_CODE ?? "whcheck_v1",
      variables: {
        "#{name}": pii.name,
        "#{link}": `${BASE_URL}/r/${target.token}`,
      },
    }]);

    const r = results[0];
    await prisma.sendLog.create({
      data: {
        recipientTokenId: target.id,
        provider: "solapi",
        providerMsgId: r.providerMsgId ?? null,
        status: r.success ? "SUCCESS" : "FAILED",
        errorCode: r.errorCode ?? null,
        phoneMasked: maskPhone(pii.phone),
      },
    });
    await prisma.recipientToken.update({
      where: { id: target.id },
      data: { status: r.success ? "SENT" : "FAILED", sentAt: r.success ? new Date() : undefined },
    });
    if (r.success) sent++; else failed++;
  }

  return NextResponse.json({ sent, failed });
}
