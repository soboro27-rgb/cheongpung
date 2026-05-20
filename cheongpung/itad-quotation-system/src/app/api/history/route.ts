import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const category = searchParams.get("category");
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = 30;

  const assetWhere = {
    ...(q.length >= 1 && {
      OR: [
        { modelDisplayName: { contains: q, mode: "insensitive" as const } },
        { modelCode: { contains: q, mode: "insensitive" as const } },
        { brand: { contains: q, mode: "insensitive" as const } },
      ],
    }),
    ...(category ? { category: category as never } : {}),
  };

  const where = q || category ? { assetMaster: assetWhere } : {};

  const [total, items] = await Promise.all([
    prisma.salesHistory.count({ where }),
    prisma.salesHistory.findMany({
      where,
      include: {
        assetMaster: {
          select: { brand: true, modelCode: true, modelDisplayName: true, category: true },
        },
      },
      orderBy: { soldAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({
    items: items.map((h) => ({
      id: h.id.toString(),
      soldAt: h.soldAt,
      grade: h.grade,
      quantity: h.quantity,
      unitPrice: h.unitPrice.toString(),
      totalPrice: (h.unitPrice.toNumber() * h.quantity).toString(),
      region: h.region,
      source: h.source,
      assetMaster: h.assetMaster,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

const historySchema = z.object({
  assetMasterId: z.string().min(1),
  soldAt: z.string(),
  grade: z.enum(["A", "B", "C", "DEFECTIVE", "UNKNOWN"]),
  quantity: z.number().int().positive(),
  unitPrice: z.number().int().min(0),
  region: z.enum(["SEOUL", "CHUNGCHEONG", "YEONGNAM", "HONAM", "GANGWON_JEJU"]),
  source: z.string().max(100).optional(),
});

function toYearDiff(soldAt: Date): number {
  return new Date().getFullYear() - soldAt.getFullYear();
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (Array.isArray(body)) {
    const parsed = z.array(historySchema).safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const result = await prisma.salesHistory.createMany({
      data: parsed.data.map((h) => {
        const soldAt = new Date(h.soldAt);
        return {
          assetMasterId: BigInt(h.assetMasterId),
          soldAt,
          grade: h.grade,
          quantity: h.quantity,
          unitPrice: h.unitPrice,
          yearDiff: toYearDiff(soldAt),
          region: h.region,
          source: h.source ?? "EXCEL",
        };
      }),
    });
    return NextResponse.json({ count: result.count }, { status: 201 });
  }

  const parsed = historySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const h = parsed.data;
  const soldAt = new Date(h.soldAt);
  const record = await prisma.salesHistory.create({
    data: {
      assetMasterId: BigInt(h.assetMasterId),
      soldAt,
      grade: h.grade,
      quantity: h.quantity,
      unitPrice: h.unitPrice,
      yearDiff: toYearDiff(soldAt),
      region: h.region,
      source: h.source ?? "MANUAL",
    },
  });
  return NextResponse.json({ id: record.id.toString() }, { status: 201 });
}
