import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const campaigns = await prisma.campaign.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(campaigns);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { name, messageText, expiresAt, returnTargetType, returnTargetRef, returnTargetSecret } = body;
  if (!name || !messageText || !expiresAt || !returnTargetType || !returnTargetRef)
    return NextResponse.json({ error: "필수 항목 누락" }, { status: 400 });
  const campaign = await prisma.campaign.create({
    data: {
      name,
      messageText,
      expiresAt: new Date(expiresAt),
      returnTargetType,
      returnTargetRef,
      returnTargetSecret: returnTargetSecret || null,
      createdBy: session.adminId,
      status: "ACTIVE",
    },
  });
  return NextResponse.json(campaign);
}
