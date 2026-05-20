import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  category: z.enum(["LAPTOP", "DESKTOP", "SERVER", "MONITOR", "NETWORK", "STORAGE", "GPU", "OTHER"]).optional(),
  brand: z.string().min(1).max(100).optional(),
  modelCode: z.string().min(1).max(100).optional(),
  modelDisplayName: z.string().min(1).max(200).optional(),
  specSummary: z.string().max(500).optional().nullable(),
  releaseYear: z.number().int().min(2000).max(2030).optional().nullable(),
  retailPriceKrw: z.number().int().min(0).optional().nullable(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const asset = await prisma.assetMaster.findUnique({
    where: { id: BigInt(id) },
    include: {
      _count: { select: { salesHistories: true, assetLines: true } },
    },
  });
  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    ...asset,
    id: asset.id.toString(),
    retailPriceKrw: asset.retailPriceKrw ? Number(asset.retailPriceKrw) : null,
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const asset = await prisma.assetMaster.findUnique({ where: { id: BigInt(id) } });
  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (parsed.data.modelCode && parsed.data.modelCode !== asset.modelCode) {
    const dup = await prisma.assetMaster.findFirst({
      where: { modelCode: parsed.data.modelCode },
    });
    if (dup) return NextResponse.json({ error: "이미 존재하는 모델 코드입니다" }, { status: 409 });
  }

  await prisma.assetMaster.update({ where: { id: BigInt(id) }, data: parsed.data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const asset = await prisma.assetMaster.findUnique({ where: { id: BigInt(id) } });
  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // 연결된 이력이 없을 때만 삭제, 있으면 소프트 삭제 불가 (스키마에 deletedAt 없음)
  const hasHistory = await prisma.salesHistory.count({ where: { assetMasterId: BigInt(id) } });
  if (hasHistory > 0) {
    return NextResponse.json(
      { error: "연결된 이력 데이터가 있어 삭제할 수 없습니다" },
      { status: 409 }
    );
  }

  await prisma.assetMaster.delete({ where: { id: BigInt(id) } });
  return NextResponse.json({ ok: true });
}
