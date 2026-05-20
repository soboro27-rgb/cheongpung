import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const quotation = await prisma.quotation.findUnique({
    where: { id: BigInt(id) },
    include: {
      bidRequest: {
        include: { customer: { select: { id: true, name: true, sector: true } } },
      },
      quotationLines: {
        include: { assetLine: { select: { rawModelName: true, grade: true, category: true } } },
        orderBy: { id: "asc" },
      },
    },
  });

  if (!quotation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: quotation.id.toString(),
    quotationNumber: quotation.quotationNumber,
    status: quotation.status,
    baseAmount: quotation.baseAmount.toNumber(),
    marketAdjustment: quotation.marketAdjustment.toNumber(),
    costLogistics: quotation.costLogistics.toNumber(),
    costErasure: quotation.costErasure.toNumber(),
    costInspection: quotation.costInspection.toNumber(),
    costTotal: quotation.costTotal.toNumber(),
    marginRate: quotation.marginRate,
    marginAmount: quotation.marginAmount.toNumber(),
    riskBufferRate: quotation.riskBufferRate,
    riskBufferAmount: quotation.riskBufferAmount.toNumber(),
    finalAmount: quotation.finalAmount.toNumber(),
    confidenceScore: quotation.confidenceScore,
    validUntil: quotation.validUntil.toISOString(),
    createdAt: quotation.createdAt.toISOString(),
    bidRequest: {
      customer: {
        id: quotation.bidRequest.customer.id.toString(),
        name: quotation.bidRequest.customer.name,
        sector: quotation.bidRequest.customer.sector,
      },
    },
    quotationLines: quotation.quotationLines.map((l) => ({
      id: l.id.toString(),
      basePrice: l.basePrice.toNumber(),
      c1Grade: l.c1Grade,
      c2Age: l.c2Age,
      c3Market: l.c3Market,
      c4Region: l.c4Region,
      c5Customer: l.c5Customer,
      finalUnitPrice: l.finalUnitPrice.toNumber(),
      quantity: l.quantity,
      subtotal: l.subtotal.toNumber(),
      historyCount: l.historyCount,
      matchScore: l.matchScore,
      assetLine: l.assetLine,
    })),
  });
}
