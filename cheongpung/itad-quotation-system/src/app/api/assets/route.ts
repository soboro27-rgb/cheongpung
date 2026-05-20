import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  category: z.enum(["LAPTOP", "DESKTOP", "SERVER", "MONITOR", "NETWORK", "STORAGE", "GPU", "OTHER"]),
  brand: z.string().min(1).max(100),
  modelCode: z.string().min(1).max(100),
  modelDisplayName: z.string().min(1).max(200),
  specSummary: z.string().max(500).optional().nullable(),
  releaseYear: z.number().int().min(2000).max(2030).optional().nullable(),
  retailPriceKrw: z.number().int().min(0).optional().nullable(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const category = searchParams.get("category");
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = 20;

  const where = {
    ...(q.length >= 1 && {
      OR: [
        { modelDisplayName: { contains: q, mode: "insensitive" as const } },
        { modelCode: { contains: q, mode: "insensitive" as const } },
        { brand: { contains: q, mode: "insensitive" as const } },
      ],
    }),
    ...(category ? { category: category as never } : {}),
  };

  const [total, items] = await Promise.all([
    prisma.assetMaster.count({ where }),
    prisma.assetMaster.findMany({
      where,
      orderBy: [{ category: "asc" }, { brand: "asc" }, { modelCode: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({
    items: items.map((a) => ({
      ...a,
      id: a.id.toString(),
      retailPriceKrw: a.retailPriceKrw ? Number(a.retailPriceKrw) : null,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.assetMaster.findFirst({
    where: { modelCode: parsed.data.modelCode },
  });
  if (existing) {
    return NextResponse.json({ error: "이미 존재하는 모델 코드입니다" }, { status: 409 });
  }

  const asset = await prisma.assetMaster.create({ data: parsed.data });
  return NextResponse.json({ id: asset.id.toString() }, { status: 201 });
}
