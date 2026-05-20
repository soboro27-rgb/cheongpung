"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { UploadIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";

export function HistoryUploadButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setUploading(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);

      if (rows.length === 0) {
        toast.error("데이터가 없습니다");
        return;
      }

      const records = rows.map((row) => ({
        assetMasterId: String(row["자산ID"] ?? row["assetMasterId"] ?? ""),
        soldAt: String(row["매각일"] ?? row["soldAt"] ?? ""),
        grade: String(row["등급"] ?? row["grade"] ?? "UNKNOWN"),
        quantity: Number(row["수량"] ?? row["quantity"] ?? 1),
        unitPrice: Number(row["단가"] ?? row["unitPrice"] ?? 0),
        region: String(row["지역"] ?? row["region"] ?? "SEOUL"),
        dataSource: String(row["출처"] ?? row["dataSource"] ?? "EXCEL"),
        notes: row["비고"] ? String(row["비고"]) : undefined,
      }));

      const res = await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(records),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "업로드 실패");
      }

      const { count } = await res.json();
      toast.success(`${count}건 업로드 완료`);
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "파일 처리 오류");
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleFile}
      />
      <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={uploading}>
        {uploading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <UploadIcon className="mr-2 h-4 w-4" />
        )}
        Excel 업로드
      </Button>
    </>
  );
}
