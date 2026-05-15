import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { calculateQuotation, saveQuotation } from "@/lib/calculation/quotation";
import { matchAssetLine } from "@/lib/matching/asset-matcher";

const AssetLineSchema = z.object({
  rawModelName: z.string().min(1).max(300),
  category: z.enum(["LAPTOP", "DESKTOP", "SERVER", "MONITOR", "NETWORK", "STORAGE", "GPU", "OTHER"]),
  manufactureYear: z.number().int().min(2000).max(new Date().getFullYear()).nullable(),
  grade: z.enum(["A", "B", "C", "DEFECTIVE", "UNKNOWN"]),
  quantity: z.number().int().positive(),
  cpuClock: z.string().max(100).nullable().optional(),
  ram: z.string().max(50).nullable().optional(),
});

const CreateQuotationSchema = z.object({
  customerId: z.string(),
  bidType: z.enum(["PUBLIC", "DESIGNATED", "PRIVATE"]),
  pickupDate: z.string(),
  pickupRegion: z.enum(["SEOUL", "CHUNGCHEONG", "YEONGNAM", "HONAM", "GANGWON_JEJU"]),
  dataErasure: z.enum(["PHYSICAL", "SOFTWARE", "NONE"]),
  leadTimeDays: z.number().int().min(1).max(90),
  notes: z.string().optional(),
  assets: z.array(AssetLineSchema).min(1).max(1000),
  options: z.object({
    targetMarginRate: z.number().min(0).max(0.3),
    historyWindowMonths: z.union([z.literal(6), z.literal(12), z.literal(24), z.literal(0)]),
    riskBufferRate: z.number().min(0).max(0.2),
  }),
});

async function getOrCreateDefaultUser() {
  let user = await prisma.user.findFirst({ where: { email: "default@coretail.kr" } });
  if (!user) {
    user = await prisma.user.create({
      data: { email: "default@coretail.kr", name: "기본 사용자", role: "SALES_REP" },
    });
  }
  return user;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreateQuotationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    const salesRep = await getOrCreateDefaultUser();

    const bidRequest = await prisma.bidRequest.create({
      data: {
        customerId: BigInt(data.customerId),
        salesRepId: salesRep.id,
        bidType: data.bidType,
        pickupDate: new Date(data.pickupDate),
        pickupRegion: data.pickupRegion,
        dataErasure: data.dataErasure,
        leadTimeDays: data.leadTimeDays,
        notes: data.notes,
        status: "IN_PROGRESS",
        assetLines: {
          create: data.assets.map((a) => ({
            rawModelName: a.rawModelName,
            category: a.category,
            manufactureYear: a.manufactureYear,
            grade: a.grade,
            quantity: a.quantity,
            cpuClock: a.cpuClock ?? null,
            ram: a.ram ?? null,
            matchStatus: "PENDING",
          })),
        },
      },
    });

    // ── 매칭 실행: CPU+RAM 우선 → 모델명 폴백 ──────────
    const assetLines = await prisma.assetLine.findMany({
      where: { bidRequestId: bidRequest.id },
    });
    await Promise.all(
      assetLines.map(async (line) => {
        const result = await matchAssetLine(
          line.rawModelName,
          line.category,
          line.cpuClock,
          line.ram
        );
        await prisma.assetLine.update({
          where: { id: line.id },
          data: {
            assetMasterId: result.assetMasterId,
            matchStatus: result.matchStatus,
            matchScore: result.matchScore,
            matchNote: result.matchNote,
          },
        });
      })
    );

    const calcResult = await calculateQuotation(bidRequest.id, data.options);
    const quotationId = await saveQuotation(bidRequest.id, calcResult);

    await prisma.bidRequest.update({
      where: { id: bidRequest.id },
      data: { status: "CALCULATED" },
    });

    return NextResponse.json({ quotationId: quotationId.toString() }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "견적 산출 중 오류가 발생했습니다" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const page = parseInt(req.nextUrl.searchParams.get("page") ?? "1");
  const limit = 20;
  const skip = (page - 1) * limit;

  const [quotations, total] = await Promise.all([
    prisma.quotation.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        bidRequest: {
          include: { customer: { select: { name: true } } },
        },
      },
    }),
    prisma.quotation.count(),
  ]);

  return NextResponse.json({
    data: quotations.map((q) => ({
      id: q.id.toString(),
      quotationNumber: q.quotationNumber,
      customerName: q.bidRequest.customer.name,
      finalAmount: q.finalAmount.toNumber(),
      confidenceScore: q.confidenceScore,
      status: q.status,
      validUntil: q.validUntil,
      createdAt: q.createdAt,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
