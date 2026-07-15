import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPII } from "@/lib/redis";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const rec = await prisma.recipientToken.findUnique({ where: { token } });
  if (!rec) return NextResponse.json({ error: "유효하지 않은 링크입니다." }, { status: 404 });
  // Check campaign expiry
  const campaign = await prisma.campaign.findUnique({ where: { id: rec.campaignId } });
  if (campaign && campaign.expiresAt < new Date() && rec.status === "SENT") {
    await prisma.recipientToken.update({ where: { id: rec.id }, data: { status: "EXPIRED" } });
    return NextResponse.json({ status: "EXPIRED" });
  }
  return NextResponse.json({ status: rec.status });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { phone4 } = await req.json();

  const rec = await prisma.recipientToken.findUnique({ where: { token }, include: { campaign: true } });
  if (!rec) return NextResponse.json({ error: "유효하지 않은 링크입니다." }, { status: 404 });
  if (rec.campaign.expiresAt < new Date())
    return NextResponse.json({ error: "응답 기간이 종료되었습니다." }, { status: 410 });

  // Verify phone tail: fetch from Redis and compare last 4 digits
  const pii = await getPII(token);
  if (!pii) return NextResponse.json({ error: "정보를 찾을 수 없습니다. 링크가 만료되었을 수 있습니다." }, { status: 404 });

  const tail = pii.phone.replace(/\D/g, "").slice(-4);
  if (tail !== phone4.trim())
    return NextResponse.json({ error: "전화번호 뒤 4자리가 일치하지 않습니다." }, { status: 403 });

  await prisma.recipientToken.update({ where: { id: rec.id }, data: { status: "VIEWED", viewedAt: new Date() } });
  return NextResponse.json({ name: pii.name, address: pii.originalAddress });
}
