export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button, buttonVariants } from "@/components/ui/button";
import { CurrencyDisplay } from "@/components/ui/currency-display";
import { format } from "date-fns";
import { ArrowLeftIcon, FileDownIcon, PencilIcon } from "lucide-react";
import { CoefficientPopover } from "@/components/quotation/coefficient-popover";
import { ApprovalWorkflow } from "@/components/quotation/approval-workflow";
import { ExcelExportButton } from "@/components/quotation/excel-export-button";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "임시저장",
  CALCULATED: "산출완료",
  PENDING_APPROVAL: "승인대기",
  APPROVED: "승인완료",
  REJECTED: "반려",
  EXPIRED: "만료",
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  CALCULATED: "bg-blue-100 text-blue-700",
  PENDING_APPROVAL: "bg-amber-100 text-amber-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  EXPIRED: "bg-gray-100 text-gray-500",
};

const GRADE_COLORS: Record<string, string> = {
  A: "bg-green-50 text-green-700",
  B: "bg-amber-50 text-amber-700",
  C: "bg-red-50 text-red-700",
  DEFECTIVE: "bg-gray-100 text-gray-600",
  UNKNOWN: "bg-gray-50 text-gray-500",
};

function confidenceInfo(score: number) {
  if (score >= 80) return { text: "매우 높음", color: "text-green-600", icon: "✓" };
  if (score >= 60) return { text: "높음", color: "text-green-600", icon: "✓" };
  if (score >= 40) return { text: "보통", color: "text-amber-600", icon: "⚠" };
  if (score >= 20) return { text: "낮음", color: "text-red-600", icon: "⚠" };
  return { text: "매우 낮음", color: "text-red-600", icon: "✗" };
}

export default async function QuotationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const quotation = await prisma.quotation.findUnique({
    where: { id: BigInt(id) },
    include: {
      bidRequest: {
        include: {
          customer: true,
          assetLines: true,
        },
      },
      quotationLines: {
        include: {
          assetLine: true,
          quotation: false,
        },
        orderBy: { id: "asc" },
      },
    },
  });

  if (!quotation) notFound();

  const br = quotation.bidRequest;
  const ci = confidenceInfo(quotation.confidenceScore);
  const finalAmount = quotation.finalAmount.toNumber();
  const baseAmount = quotation.baseAmount.toNumber();
  const marketAdj = quotation.marketAdjustment.toNumber();
  const costTotal = quotation.costTotal.toNumber();
  const marginRate = Math.round(quotation.marginRate * 100);
  const totalQty = quotation.quotationLines.reduce((s, l) => s + l.quantity, 0);
  const linesTotal = quotation.quotationLines.reduce((s, l) => s + l.subtotal.toNumber(), 0);

  const marketAdjPct = baseAmount > 0
    ? ((marketAdj / baseAmount) * 100).toFixed(1)
    : "0.0";

  const approvalTier = finalAmount < 50_000_000
    ? "self"
    : finalAmount < 100_000_000
    ? "manager"
    : "director";

  return (
    <div className="space-y-6 max-w-5xl">
      {/* 뒤로가기 */}
      <Link
        href="/quotations"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2 text-muted-foreground")}
      >
        <ArrowLeftIcon className="mr-1.5 h-3.5 w-3.5" />
        견적 목록
      </Link>

      {/* 헤더 */}
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", STATUS_COLORS[quotation.status] ?? "bg-gray-100 text-gray-700")}>
              {STATUS_LABELS[quotation.status] ?? quotation.status}
            </span>
            <span className="font-mono text-sm text-muted-foreground">{quotation.quotationNumber}</span>
          </div>
          <h1 className="text-xl font-bold">{br.customer.name} — IT자산 매각 견적서</h1>
          <p className="text-sm text-muted-foreground">
            {totalQty}대 · {quotation.quotationLines.length}개 품목 ·
            산출일 {format(quotation.createdAt, "yyyy.MM.dd")} ·
            유효기간 {format(quotation.validUntil, "yyyy.MM.dd")}까지
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-muted-foreground mb-1">제안 견적가</p>
          <p className="text-3xl font-bold text-primary tabular-nums">
            {finalAmount.toLocaleString("ko-KR")}원
          </p>
          <p className={cn("text-xs mt-1", ci.color)}>
            {ci.icon} 신뢰도 {quotation.confidenceScore}/100 — {ci.text}
          </p>
        </div>
      </div>

      {/* 요약 카드 4개 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">이력 기준가</p>
            <p className="text-lg font-semibold mt-1 tabular-nums">
              {baseAmount.toLocaleString("ko-KR")}원
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">시세 보정</p>
            <p className={cn(
              "text-lg font-semibold mt-1 tabular-nums",
              marketAdj >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {marketAdj >= 0 ? "+" : ""}{marketAdjPct}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">처리비용</p>
            <p className="text-lg font-semibold mt-1 tabular-nums text-red-600">
              -{costTotal.toLocaleString("ko-KR")}원
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">목표 마진</p>
            <p className="text-lg font-semibold mt-1">{marginRate}%</p>
          </CardContent>
        </Card>
      </div>

      {/* 품목별 단가표 */}
      <Card>
        <CardHeader className="pb-3 flex-row items-center justify-between">
          <CardTitle className="text-base">품목별 단가표</CardTitle>
          <ExcelExportButton quotationId={id} quotationNumber={quotation.quotationNumber} />
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="py-2.5 px-4 text-left text-xs font-medium text-muted-foreground">모델</th>
                  <th className="py-2.5 px-3 text-center text-xs font-medium text-muted-foreground w-16">등급</th>
                  <th className="py-2.5 px-3 text-right text-xs font-medium text-muted-foreground w-16">수량</th>
                  <th className="py-2.5 px-3 text-right text-xs font-medium text-muted-foreground w-28">기준가(P₀)</th>
                  <th className="py-2.5 px-3 text-right text-xs font-medium text-muted-foreground w-20">계수</th>
                  <th className="py-2.5 px-3 text-right text-xs font-medium text-muted-foreground w-28">단위가</th>
                  <th className="py-2.5 px-4 text-right text-xs font-medium text-muted-foreground w-32">소계</th>
                </tr>
              </thead>
              <tbody>
                {quotation.quotationLines.map((line) => {
                  const compositeCoeff = line.c1Grade * line.c2Age * line.c3Market * line.c4Region * line.c5Customer;
                  const isLowHistory = line.historyCount < 5;
                  return (
                    <tr key={line.id.toString()} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-2.5 px-4">
                        <div className="font-medium">{line.assetLine.rawModelName}</div>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {line.assetLine.cpuClock && (
                            <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-mono">
                              {line.assetLine.cpuClock}
                            </span>
                          )}
                          {line.assetLine.ram && (
                            <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                              {line.assetLine.ram}
                            </span>
                          )}
                          {line.assetLine.matchNote && (
                            <span className="text-xs text-muted-foreground">
                              {line.assetLine.matchStatus === "EXACT" ? "✓" : line.assetLine.matchStatus === "SIMILAR" ? "≈" : "✗"} {line.assetLine.matchNote}
                            </span>
                          )}
                        </div>
                        {isLowHistory && (
                          <div className="text-xs text-amber-600 mt-0.5">
                            ⚠ 이력 {line.historyCount}건 (보수적 계수 적용)
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-semibold", GRADE_COLORS[line.assetLine.grade])}>
                          {line.assetLine.grade}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums">{line.quantity}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-xs">
                        {line.basePrice.toNumber() > 0 ? `${line.basePrice.toNumber().toLocaleString("ko-KR")}` : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <CoefficientPopover
                          basePrice={line.basePrice.toNumber()}
                          c1Grade={line.c1Grade}
                          c2Age={line.c2Age}
                          c3Market={line.c3Market}
                          c4Region={line.c4Region}
                          c5Customer={line.c5Customer}
                          finalUnitPrice={line.finalUnitPrice.toNumber()}
                          gradeLabel={line.assetLine.grade}
                        >
                          <button className="text-xs text-primary hover:underline tabular-nums cursor-pointer">
                            ×{compositeCoeff.toFixed(2)}
                          </button>
                        </CoefficientPopover>
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-xs">
                        {line.finalUnitPrice.toNumber().toLocaleString("ko-KR")}
                      </td>
                      <td className="py-2.5 px-4 text-right font-medium tabular-nums">
                        {line.subtotal.toNumber().toLocaleString("ko-KR")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t-2">
                <tr className="bg-secondary/50">
                  <td colSpan={2} className="py-2.5 px-4 text-sm font-semibold">품목 합계</td>
                  <td className="py-2.5 px-3 text-right font-semibold tabular-nums">{totalQty}대</td>
                  <td colSpan={3} />
                  <td className="py-2.5 px-4 text-right font-bold tabular-nums text-base">
                    {linesTotal.toLocaleString("ko-KR")}원
                  </td>
                </tr>
                <tr className="bg-primary/5 border-t">
                  <td colSpan={6} className="py-3 px-4 text-sm font-bold text-primary">
                    최종 견적가 (처리비 · 마진 · 리스크 차감 후)
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-primary tabular-nums text-lg">
                    {finalAmount.toLocaleString("ko-KR")}원
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 산출 근거 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">산출 근거</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {[
                { label: "품목 합계", amount: linesTotal, sign: 1 },
                { label: `시세 보정 (${marketAdjPct}%)`, amount: marketAdj, sign: 1 },
                { label: `물류비`, amount: -quotation.costLogistics.toNumber(), sign: -1 },
                { label: `데이터 파쇄`, amount: -quotation.costErasure.toNumber(), sign: -1 },
                { label: `검수·보관`, amount: -quotation.costInspection.toNumber(), sign: -1 },
                { label: `목표 마진 (${marginRate}%)`, amount: -quotation.marginAmount.toNumber(), sign: -1 },
                { label: `리스크 보수 (${Math.round(quotation.riskBufferRate * 100)}%)`, amount: -quotation.riskBufferAmount.toNumber(), sign: -1 },
              ].map(({ label, amount, sign }) => (
                <div key={label} className="flex justify-between items-center">
                  <span className={cn("text-muted-foreground", sign < 0 && amount < 0 && "text-red-600/70")}>
                    {label}
                  </span>
                  <span className={cn(
                    "tabular-nums font-medium",
                    sign < 0 ? "text-red-600" : amount >= 0 ? "" : "text-red-600"
                  )}>
                    {amount >= 0 ? "+" : ""}{amount.toLocaleString("ko-KR")}원
                  </span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between items-center pt-1">
                <span className="font-semibold">최종 견적가</span>
                <span className="font-bold text-primary tabular-nums text-base">
                  {finalAmount.toLocaleString("ko-KR")}원
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 승인 워크플로우 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">승인 워크플로우</CardTitle>
          </CardHeader>
          <CardContent>
            <ApprovalWorkflow
              status={quotation.status}
              approvalTier={approvalTier}
              finalAmount={finalAmount}
            />
          </CardContent>
        </Card>
      </div>

      {/* 액션 버튼 */}
      <div className="flex justify-end gap-3">
        <Link href={`/quotations/new?from=${id}`}>
          <Button variant="outline">견적 복제</Button>
        </Link>
        {(quotation.status === "DRAFT" || quotation.status === "CALCULATED") && (
          <Button variant="outline">
            <PencilIcon className="mr-2 h-4 w-4" />
            수정
          </Button>
        )}
        {quotation.status === "CALCULATED" && finalAmount >= 50_000_000 && (
          <Button>팀장 승인요청</Button>
        )}
        {quotation.status === "CALCULATED" && finalAmount < 50_000_000 && (
          <Button>입찰서 생성</Button>
        )}
      </div>
    </div>
  );
}
