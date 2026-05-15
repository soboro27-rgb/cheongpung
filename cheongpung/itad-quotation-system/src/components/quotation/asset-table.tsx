"use client";

import { useFieldArray, type Control, Controller } from "react-hook-form";
import { Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { NewQuotationFormValues } from "./new-quotation-form";

const CATEGORY_LABELS = {
  LAPTOP: "노트북",
  DESKTOP: "데스크탑",
  SERVER: "서버",
  MONITOR: "모니터",
  NETWORK: "네트워크",
  STORAGE: "스토리지",
  GPU: "GPU",
  OTHER: "기타",
} as const;

const GRADE_LABELS = {
  A: "A급",
  B: "B급",
  C: "C급",
  DEFECTIVE: "불량",
  UNKNOWN: "미상",
} as const;

interface AssetTableProps {
  control: Control<NewQuotationFormValues>;
}

export function AssetTable({ control }: AssetTableProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "assets",
  });

  function addRow() {
    append({
      rawModelName: "",
      category: "LAPTOP",
      manufactureYear: null,
      grade: "UNKNOWN",
      quantity: 1,
      cpuClock: null,
      ram: null,
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">자산 목록</span>
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          <Plus className="mr-1 h-4 w-4" />
          행 추가
        </Button>
      </div>

      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground w-[90px]">분류</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">모델/스펙</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground w-[120px]">
                CPU 클럭
                <span className="ml-1 text-xs font-normal text-blue-500">우선매칭</span>
              </th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground w-[90px]">
                RAM
                <span className="ml-1 text-xs font-normal text-blue-500">우선매칭</span>
              </th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground w-[70px]">연식</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground w-[80px]">등급</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground w-[60px]">수량</th>
              <th className="px-3 py-2 w-[36px]" />
            </tr>
          </thead>
          <tbody>
            {fields.map((field, index) => (
              <tr key={field.id} className="border-b last:border-0">
                <td className="px-2 py-1.5">
                  <Controller
                    name={`assets.${index}.category`}
                    control={control}
                    render={({ field: f }) => (
                      <Select value={f.value} onValueChange={f.onChange}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                            <SelectItem key={v} value={v}>{l}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </td>
                <td className="px-2 py-1.5">
                  <Input
                    className="h-8 text-sm"
                    placeholder="모델명 입력"
                    {...control.register(`assets.${index}.rawModelName`)}
                  />
                </td>
                <td className="px-2 py-1.5">
                  <Input
                    className="h-8 text-xs font-mono"
                    placeholder="i5-1235U"
                    {...control.register(`assets.${index}.cpuClock`)}
                  />
                </td>
                <td className="px-2 py-1.5">
                  <Input
                    className="h-8 text-xs"
                    placeholder="16GB"
                    {...control.register(`assets.${index}.ram`)}
                  />
                </td>
                <td className="px-2 py-1.5">
                  <Controller
                    name={`assets.${index}.manufactureYear`}
                    control={control}
                    render={({ field: f }) => (
                      <Input
                        type="number"
                        className="h-8 text-sm"
                        placeholder="2022"
                        min={2000}
                        max={new Date().getFullYear()}
                        value={f.value ?? ""}
                        onChange={(e) =>
                          f.onChange(e.target.value === "" ? null : Number(e.target.value))
                        }
                      />
                    )}
                  />
                </td>
                <td className="px-2 py-1.5">
                  <Controller
                    name={`assets.${index}.grade`}
                    control={control}
                    render={({ field: f }) => (
                      <Select value={f.value} onValueChange={f.onChange}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(GRADE_LABELS).map(([v, l]) => (
                            <SelectItem key={v} value={v}>{l}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </td>
                <td className="px-2 py-1.5">
                  <Input
                    type="number"
                    className="h-8 text-sm"
                    min={1}
                    {...control.register(`assets.${index}.quantity`, {
                      valueAsNumber: true,
                    })}
                  />
                </td>
                <td className="px-2 py-1.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
            {fields.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-muted-foreground text-sm">
                  행 추가 버튼을 눌러 자산을 입력하세요
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground text-right">
        총 {fields.length}개 품목
      </p>
    </div>
  );
}
