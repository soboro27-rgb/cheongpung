"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FileDownIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";

interface Props {
  quotationId: string;
  quotationNumber: string;
}

export function ExcelExportButton({ quotationId, quotationNumber }: Props) {
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch(`/api/quotations/${quotationId}`);
      if (!res.ok) throw new Error("데이터 조회 실패");
      const data = await res.json();

      const wb = XLSX.utils.book_new();

      // 시트 1: 견적 요약
      const summaryData = [
        ["견적번호", data.quotationNumber],
        ["고객사", data.bidRequest?.customer?.name ?? ""],
        ["산출일", data.createdAt?.slice(0, 10) ?? ""],
        ["유효기간", data.validUntil?.slice(0, 10) ?? ""],
        ["이력 기준가", data.baseAmount],
        ["시세 보정", data.marketAdjustment],
        ["물류비", -data.costLogistics],
        ["데이터 파쇄", -data.costErasure],
        ["검수·보관", -data.costInspection],
        ["목표 마진율", `${Math.round(data.marginRate * 100)}%`],
        ["목표 마진 금액", -data.marginAmount],
        ["리스크 보수율", `${Math.round(data.riskBufferRate * 100)}%`],
        ["리스크 보수 금액", -data.riskBufferAmount],
        ["최종 견적가", data.finalAmount],
        ["신뢰도", `${data.confidenceScore}/100`],
      ];
      const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, ws1, "견적 요약");

      // 시트 2: 품목별 단가표
      const lineHeaders = ["모델명", "등급", "수량", "기준가(P₀)", "C1_등급", "C2_연식", "C3_시세", "C4_지역", "C5_기관", "단위가", "소계", "이력건수"];
      const lineRows = (data.quotationLines ?? []).map((l: Record<string, unknown>) => [
        (l as {assetLine?: {rawModelName?: string}}).assetLine?.rawModelName ?? "",
        (l as {assetLine?: {grade?: string}}).assetLine?.grade ?? "",
        l.quantity,
        l.basePrice,
        l.c1Grade,
        l.c2Age,
        l.c3Market,
        l.c4Region,
        l.c5Customer,
        l.finalUnitPrice,
        l.subtotal,
        l.historyCount,
      ]);
      const ws2 = XLSX.utils.aoa_to_sheet([lineHeaders, ...lineRows]);
      XLSX.utils.book_append_sheet(wb, ws2, "품목별 단가표");

      XLSX.writeFile(wb, `${quotationNumber}_견적서.xlsx`);
      toast.success("엑셀 내보내기 완료");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "내보내기 실패");
    } finally {
      setExporting(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
      {exporting ? (
        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
      ) : (
        <FileDownIcon className="mr-2 h-3.5 w-3.5" />
      )}
      Excel
    </Button>
  );
}
