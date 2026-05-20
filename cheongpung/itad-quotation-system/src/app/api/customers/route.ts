import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (q.length < 2) return NextResponse.json([]);

  const customers = await prisma.customer.findMany({
    where: {
      deletedAt: null,
      name: { contains: q },
    },
    orderBy: [{ totalDeals: "desc" }, { name: "asc" }],
    take: 10,
    select: { id: true, name: true, sector: true, region: true, totalDeals: true },
  });

  return NextResponse.json(
    customers.map((c) => ({ ...c, id: c.id.toString() }))
  );
}

const createSchema = z.object({
  name: z.string().min(1, "고객사명을 입력하세요").max(100),
  sector: z.enum(["FINANCIAL", "PUBLIC", "CORPORATE", "HEALTHCARE", "EDUCATION", "OTHER"]),
  region: z.enum(["SEOUL", "CHUNGCHEONG", "YEONGNAM", "HONAM", "GANGWON_JEJU"]).default("SEOUL"),
  contactName: z.string().max(50).optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().max(20).optional(),
  notes: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.customer.findFirst({
    where: { name: parsed.data.name, deletedAt: null },
  });
  if (existing) {
    return NextResponse.json({ error: "이미 존재하는 고객사명입니다" }, { status: 409 });
  }

  const customer = await prisma.customer.create({
    data: {
      name: parsed.data.name,
      sector: parsed.data.sector,
      region: parsed.data.region,
      contactName: parsed.data.contactName,
      contactEmail: parsed.data.contactEmail || null,
      contactPhone: parsed.data.contactPhone,
      winRate: 0.5,
      totalDeals: 0,
    },
  });

  return NextResponse.json({
    id: customer.id.toString(),
    name: customer.name,
    sector: customer.sector,
    region: customer.region,
    totalDeals: customer.totalDeals,
  }, { status: 201 });
}
