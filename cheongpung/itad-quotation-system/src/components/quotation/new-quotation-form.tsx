"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { CurrencyDisplay } from "@/components/ui/currency-display";
import { AssetTable } from "./asset-table";
import { CustomerCombobox } from "./customer-combobox";
import { cn } from "@/lib/utils";

const schema = z.object({
  customerId: z.string().min(1, "고객사를 선택하세요"),
  bidType: z.enum(["PUBLIC", "DESIGNATED", "PRIVATE"]),
  pickupDate: z.date({ invalid_type_error: "반입 예정일을 선택하세요" }),
  pickupRegion: z.enum(["SEOUL", "CHUNGCHEONG", "YEONGNAM", "HONAM", "GANGWON_JEJU"]),
  dataErasure: z.enum(["PHYSICAL", "SOFTWARE", "NONE"]),
  leadTimeDays: z.coerce.number().int().min(1).max(90),
  notes: z.string().optional(),
  assets: z.array(
    z.object({
      rawModelName: z.string().min(1, "모델명을 입력하세요"),
      category: z.enum(["LAPTOP", "DESKTOP", "SERVER", "MONITOR", "NETWORK", "STORAGE", "GPU", "OTHER"]),
      manufactureYear: z.number().nullable(),
      grade: z.enum(["A", "B", "C", "DEFECTIVE", "UNKNOWN"]),
      quantity: z.coerce.number().int().positive(),
      cpuClock: z.string().max(100).nullable().optional(),
      ram: z.string().max(50).nullable().optional(),
    })
  ).min(1, "자산을 1개 이상 입력하세요"),
  targetMarginRate: z.number().min(0).max(0.3),
  riskBufferRate: z.number().min(0).max(0.2),
  historyWindowMonths: z.union([z.literal(6), z.literal(12), z.literal(24), z.literal(0)]),
});

export type NewQuotationFormValues = z.infer<typeof schema>;

export function NewQuotationForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<NewQuotationFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      bidType: "PUBLIC",
      pickupRegion: "SEOUL",
      dataErasure: "PHYSICAL",
      leadTimeDays: 14,
      assets: [{ rawModelName: "", category: "LAPTOP", manufactureYear: null, grade: "UNKNOWN", quantity: 1, cpuClock: null, ram: null }],
      targetMarginRate: 0.12,
      riskBufferRate: 0.05,
      historyWindowMonths: 12,
    },
  });

  const { control, handleSubmit, watch, setValue, formState: { errors } } = form;
  const marginRate = watch("targetMarginRate");
  const riskRate = watch("riskBufferRate");

  async function onSubmit(values: NewQuotationFormValues) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: values.customerId,
          bidType: values.bidType,
          pickupDate: values.pickupDate.toISOString(),
          pickupRegion: values.pickupRegion,
          dataErasure: values.dataErasure,
          leadTimeDays: values.leadTimeDays,
          notes: values.notes,
          assets: values.assets,
          options: {
            targetMarginRate: values.targetMarginRate,
            historyWindowMonths: values.historyWindowMonths,
            riskBufferRate: values.riskBufferRate,
          },
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "견적 산출 실패");
      }

      const { quotationId } = await res.json();
      toast.success("견적이 산출되었습니다");
      router.push(`/quotations/${quotationId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "오류가 발생했습니다");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* 영역 1: 기본정보 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">매각 요청 기본정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {/* 고객사 */}
            <div className="col-span-2 lg:col-span-1 space-y-1.5">
              <label className="text-sm font-medium">고객사 <span className="text-destructive">*</span></label>
              <Controller
                name="customerId"
                control={control}
                render={({ field }) => (
                  <CustomerCombobox value={field.value} onChange={field.onChange} />
                )}
              />
              {errors.customerId && <p className="text-xs text-destructive">{errors.customerId.message}</p>}
            </div>

            {/* 입찰 방식 */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">입찰 방식 <span className="text-destructive">*</span></label>
              <Controller
                name="bidType"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PUBLIC">공개입찰</SelectItem>
                      <SelectItem value="DESIGNATED">지명입찰</SelectItem>
                      <SelectItem value="PRIVATE">수의계약</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* 반입 예정일 */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">반입 예정일 <span className="text-destructive">*</span></label>
              <Controller
                name="pickupDate"
                control={control}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger
                      className={cn(
                        buttonVariants({ variant: "outline" }),
                        "w-full justify-start text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, "yyyy-MM-dd") : "날짜 선택"}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(d) => d < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.pickupDate && <p className="text-xs text-destructive">{errors.pickupDate.message}</p>}
            </div>

            {/* 반입 지역 */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">반입 지역 <span className="text-destructive">*</span></label>
              <Controller
                name="pickupRegion"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SEOUL">수도권</SelectItem>
                      <SelectItem value="CHUNGCHEONG">충청권</SelectItem>
                      <SelectItem value="YEONGNAM">영남권</SelectItem>
                      <SelectItem value="HONAM">호남권</SelectItem>
                      <SelectItem value="GANGWON_JEJU">강원·제주</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* 데이터 삭제 */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">데이터 삭제 <span className="text-destructive">*</span></label>
              <Controller
                name="dataErasure"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PHYSICAL">물리 파쇄</SelectItem>
                      <SelectItem value="SOFTWARE">SW 와이핑</SelectItem>
                      <SelectItem value="NONE">없음</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* 납기 */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">납기 (영업일)</label>
              <Input
                type="number"
                min={1}
                max={90}
                {...form.register("leadTimeDays")}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 영역 2: 자산 목록 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">매각 자산 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <AssetTable control={control} setValue={setValue} />
          {errors.assets && (
            <p className="text-xs text-destructive mt-2">
              {typeof errors.assets.message === "string" ? errors.assets.message : "자산 정보를 확인하세요"}
            </p>
          )}
        </CardContent>
      </Card>

      {/* 영역 3+4: 견적 옵션 + 미리보기 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">견적 옵션</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">목표 마진율</span>
                <span className="text-muted-foreground">{Math.round(marginRate * 100)}%</span>
              </div>
              <Controller
                name="targetMarginRate"
                control={control}
                render={({ field }) => (
                  <Slider
                    min={0} max={30} step={1}
                    value={[Math.round(field.value * 100)]}
                    onValueChange={(v) => {
                      const val = Array.isArray(v) ? v[0] : v;
                      field.onChange(val / 100);
                    }}
                  />
                )}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span><span>30%</span>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">리스크 보수율</span>
                <span className="text-muted-foreground">{Math.round(riskRate * 100)}%</span>
              </div>
              <Controller
                name="riskBufferRate"
                control={control}
                render={({ field }) => (
                  <Slider
                    min={0} max={20} step={1}
                    value={[Math.round(field.value * 100)]}
                    onValueChange={(v) => {
                      const val = Array.isArray(v) ? v[0] : v;
                      field.onChange(val / 100);
                    }}
                  />
                )}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span><span>20%</span>
              </div>
            </div>

            <Separator />

            <div className="space-y-1.5">
              <label className="text-sm font-medium">이력 조회 기간</label>
              <Controller
                name="historyWindowMonths"
                control={control}
                render={({ field }) => (
                  <Select
                    value={String(field.value)}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6">최근 6개월</SelectItem>
                      <SelectItem value="12">최근 12개월</SelectItem>
                      <SelectItem value="24">최근 24개월</SelectItem>
                      <SelectItem value="0">전체</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">견적 미리보기</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground text-xs">
                견적 산출 버튼을 누르면 이력 데이터와 시세를 반영한 정확한 금액이 계산됩니다.
              </p>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">목표 마진율</span>
                  <span>{Math.round(marginRate * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">리스크 보수율</span>
                  <span>{Math.round(riskRate * 100)}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 하단 버튼 */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={submitting}
        >
          취소
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          견적 산출
        </Button>
      </div>
    </form>
  );
}
