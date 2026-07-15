"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface ImportResult {
  deleted: number;
  assetCreated: number;
  assetUpdated: number;
  priceCreated: number;
  skipped: number;
  total: number;
}

export function PriceListUploadButton({ onDone }: { onDone?: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function handleFile(file: File) {
    if (!file.name.endsWith(".csv")) {
      toast.error("CSV 파일만 업로드 가능합니다");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/assets/import", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "업로드 실패");
        return;
      }
      setResult(json);
      router.refresh();
      onDone?.();
    } catch {
      toast.error("업로드 중 오류가 발생했습니다");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
      <Button
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        <UploadIcon className="mr-2 h-4 w-4" />
        {uploading ? "업로드 중..." : "단가표 업로드"}
      </Button>

      <Dialog open={!!result} onOpenChange={(o) => !o && setResult(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>단가표 업로드 완료</DialogTitle>
          </DialogHeader>
          {result && (
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-y-1.5">
                <span className="text-muted-foreground">처리 대상</span>
                <span className="font-medium">{result.total.toLocaleString()}건</span>
                <span className="text-muted-foreground">자산 신규 등록</span>
                <span className="font-medium text-green-600">{result.assetCreated.toLocaleString()}건</span>
                <span className="text-muted-foreground">자산 단가 갱신</span>
                <span className="font-medium">{result.assetUpdated.toLocaleString()}건</span>
                <span className="text-muted-foreground">시세 등록</span>
                <span className="font-medium">{result.priceCreated.toLocaleString()}건</span>
                <span className="text-muted-foreground">기존 MANUAL 시세 삭제</span>
                <span className="font-medium text-muted-foreground">{result.deleted.toLocaleString()}건</span>
                {result.skipped > 0 && (
                  <>
                    <span className="text-muted-foreground">스킵</span>
                    <span className="font-medium text-amber-600">{result.skipped.toLocaleString()}건</span>
                  </>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setResult(null)}>확인</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
