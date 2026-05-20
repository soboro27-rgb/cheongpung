"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const schema = z.object({
  category: z.enum(["LAPTOP", "DESKTOP", "SERVER", "MONITOR", "NETWORK", "STORAGE", "GPU", "OTHER"]),
  brand: z.string().min(1, "브랜드를 입력하세요").max(50),
  modelCode: z.string().min(1, "모델코드를 입력하세요").max(100),
  modelDisplayName: z.string().min(1, "모델명을 입력하세요").max(200),
  specSummary: z.string().max(500).optional(),
  releaseYear: z.coerce.number().int().min(2000).max(2030).optional().nullable(),
  retailPriceKrw: z.coerce.number().int().min(0).optional().nullable(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  defaultValues?: Partial<FormValues>;
  assetId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  LAPTOP: "노트북", DESKTOP: "데스크탑", SERVER: "서버",
  MONITOR: "모니터", NETWORK: "네트워크", STORAGE: "스토리지",
  GPU: "GPU", OTHER: "기타",
};

export function AssetMasterForm({ defaultValues, assetId, onSuccess, onCancel }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: "LAPTOP",
      ...defaultValues,
    },
  });

  const category = watch("category");

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const url = assetId ? `/api/assets/${assetId}` : "/api/assets";
      const method = assetId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "저장 실패");
      }
      toast.success(assetId ? "수정되었습니다" : "등록되었습니다");
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "오류가 발생했습니다");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">분류 <span className="text-destructive">*</span></label>
          <Select
            value={category}
            onValueChange={(v) => setValue("category", v as FormValues["category"])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">브랜드 <span className="text-destructive">*</span></label>
          <Input {...register("brand")} placeholder="예: LG, Samsung, HP" />
          {errors.brand && <p className="text-xs text-destructive">{errors.brand.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">모델코드 <span className="text-destructive">*</span></label>
        <Input {...register("modelCode")} placeholder="예: LG-14Z90P" className="font-mono" />
        {errors.modelCode && <p className="text-xs text-destructive">{errors.modelCode.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">모델명 <span className="text-destructive">*</span></label>
        <Input {...register("modelDisplayName")} placeholder="예: LG 그램 14 (14Z90P)" />
        {errors.modelDisplayName && <p className="text-xs text-destructive">{errors.modelDisplayName.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">사양 요약</label>
        <Input {...register("specSummary")} placeholder="예: i5-1135G7, 16GB, 512GB SSD" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">출시연도</label>
          <Input
            type="number"
            {...register("releaseYear", { setValueAs: (v) => v === "" ? null : Number(v) })}
            placeholder="예: 2022"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">출고가 (원)</label>
          <Input
            type="number"
            {...register("retailPriceKrw", { setValueAs: (v) => v === "" ? null : Number(v) })}
            placeholder="예: 1590000"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          취소
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {assetId ? "수정" : "등록"}
        </Button>
      </div>
    </form>
  );
}
