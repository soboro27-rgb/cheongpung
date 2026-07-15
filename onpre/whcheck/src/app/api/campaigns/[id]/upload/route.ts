import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { storePII } from "@/lib/redis";
import { hashPhone } from "@/lib/crypto";
import { v4 as uuidv4 } from "uuid";
import ExcelJS from "exceljs";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({ where: { id: Number(id) } });
  if (!campaign) return NextResponse.json({ error: "캠페인 없음" }, { status: 404 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "파일 없음" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const ws = wb.worksheets[0];

  const ttlSeconds = Math.max(60, Math.floor((campaign.expiresAt.getTime() - Date.now()) / 1000));
  let inserted = 0, skipped = 0;

  for (let rowNum = 2; rowNum <= ws.rowCount; rowNum++) {
    const row = ws.getRow(rowNum);
    const name = String(row.getCell(1).value ?? "").trim();
    const phone = String(row.getCell(2).value ?? "").trim().replace(/\D/g, "");
    const address = String(row.getCell(3).value ?? "").trim();
    const memo = String(row.getCell(4).value ?? "").trim();

    if (!name || phone.length < 10 || !address) continue;

    const phoneHash = hashPhone(phone);
    const existing = await prisma.recipientToken.findFirst({
      where: { campaignId: campaign.id, phoneHash },
    });
    if (existing) { skipped++; continue; }

    const token = uuidv4();
    await prisma.recipientToken.create({
      data: { campaignId: campaign.id, token, phoneHash, status: "PENDING" },
    });
    // Store PII in Redis only
    await storePII(token, { name, phone, originalAddress: address, memo }, ttlSeconds);
    inserted++;
  }

  return NextResponse.json({ inserted, skipped });
}
