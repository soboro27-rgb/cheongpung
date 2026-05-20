export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { CurrencyDisplay } from "@/components/ui/currency-display";
import { FilePlus } from "lucide-react";
import { format } from "date-fns";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "임시저장",
  CALCULATED: "산출완료",
  PENDING_APPROVAL: "승인대기",
  APPROVED: "승인완료",
  REJECTED: "반려",
  EXPIRED: "만료",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  CALCULATED: "default",
  APPROVED: "default",
  PENDING_APPROVAL: "secondary",
  DRAFT: "outline",
  REJECTED: "destructive",
  EXPIRED: "outline",
};

export default async function QuotationsPage() {
  const quotations = await prisma.quotation.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      bidRequest: {
        include: { customer: { select: { name: true } } },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">견적 목록</h1>
          <p className="text-muted-foreground text-sm mt-1">
            작성된 견적서를 조회하고 관리합니다
          </p>
        </div>
        <Link href="/quotations/new" className={buttonVariants()}>
          <FilePlus className="mr-2 h-4 w-4" />
          새 견적
        </Link>
      </div>

      {quotations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FilePlus className="h-10 w-10 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">아직 작성된 견적이 없습니다</p>
            <Link href="/quotations/new" className={buttonVariants({ variant: "outline" }) + " mt-4"}>
              첫 견적 작성하기
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">견적번호</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">고객사</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">견적가</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">신뢰도</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">상태</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">작성일</th>
              </tr>
            </thead>
            <tbody>
              {quotations.map((q) => (
                <tr
                  key={q.id.toString()}
                  className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/quotations/${q.id}`}
                      className="font-mono text-primary hover:underline"
                    >
                      {q.quotationNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{q.bidRequest.customer.name}</td>
                  <td className="px-4 py-3 text-right">
                    <CurrencyDisplay amount={q.finalAmount.toNumber()} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={q.confidenceScore >= 60 ? "text-green-600" : q.confidenceScore >= 40 ? "text-amber-600" : "text-red-600"}>
                      {q.confidenceScore}점
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={STATUS_VARIANTS[q.status] ?? "outline"} className="text-xs">
                      {STATUS_LABELS[q.status] ?? q.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {format(q.createdAt, "yyyy-MM-dd")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
