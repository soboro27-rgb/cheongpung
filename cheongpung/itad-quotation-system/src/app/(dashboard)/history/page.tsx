import { Suspense } from "react";
import { SalesHistoryTable } from "@/components/history/sales-history-table";
import { HistoryUploadButton } from "@/components/history/history-upload-button";

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">거래 이력</h1>
          <p className="text-muted-foreground text-sm mt-1">과거 매각 이력을 조회합니다. 이력 데이터는 견적 산출의 기준가(P₀)로 사용됩니다.</p>
        </div>
        <HistoryUploadButton />
      </div>
      <Suspense fallback={<div className="text-muted-foreground text-sm">로딩 중...</div>}>
        <SalesHistoryTable />
      </Suspense>
    </div>
  );
}
