"use client";

import { useFieldArray, type Control, Controller, useWatch } from "react-hook-form";
import { useEffect, useRef, useState } from "react";
import { Trash2, Plus, Loader2 } from "lucide-react";
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
import { parseCpuInfo } from "@/lib/matching/cpu-parser";
import type { ModelLookupResponse } from "@/app/api/model-lookup/route";

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

type SetValueFn = (
  name: `assets.${number}.cpuClock` | `assets.${number}.ram` | `assets.${number}.storage`,
  value: string | null
) => void;

interface AssetTableProps {
  control: Control<NewQuotationFormValues>;
  setValue: SetValueFn;
}

interface MatchedInfo {
  modelDisplayName: string;
  specSummary: string | null;
  retailPriceKrw: number | null;
  matchNote: string;
  matchScore: number;
}

function ModelNameCell({
  control,
  index,
  setValue,
  onMatched,
}: {
  control: Control<NewQuotationFormValues>;
  index: number;
  setValue: SetValueFn;
  onMatched: (info: MatchedInfo | null) => void;
}) {
  const category = useWatch({ control, name: `assets.${index}.category` });
  const [searching, setSearching] = useState(false);
  const [autoDetected, setAutoDetected] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    control.register(`assets.${index}.rawModelName`).onChange(e);

    if (timerRef.current) clearTimeout(timerRef.current);
    setAutoDetected(false);
    onMatched(null);

    if (value.trim().length < 5) return;

    timerRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const params = new URLSearchParams({ q: value.trim(), category });
        const res = await fetch(`/api/model-lookup?${params}`);
        if (!res.ok) return;
        const data = (await res.json()) as ModelLookupResponse;
        if (data.cpuClock) {
          setValue(`assets.${index}.cpuClock`, data.cpuClock);
          setAutoDetected(true);
        }
        if (data.ram) setValue(`assets.${index}.ram`, data.ram);
        if (data.storage) setValue(`assets.${index}.storage`, data.storage);
        if (data.matched) onMatched(data.matched);
      } catch {
        // 검색 실패는 무시
      } finally {
        setSearching(false);
      }
    }, 800);
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return (
    <div className="space-y-0.5">
      <div className="relative">
        <Input
          className="h-8 text-sm pr-6"
          placeholder="모델명 입력"
          {...control.register(`assets.${index}.rawModelName`)}
          onChange={handleChange}
        />
        {searching && (
          <Loader2 className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />
        )}
      </div>
      {autoDetected && (
        <span className="inline-block rounded px-1 py-0.5 text-[10px] font-medium bg-green-100 text-green-700">
          스펙 자동감지
        </span>
      )}
    </div>
  );
}

function CpuCell({ control, index }: { control: Control<NewQuotationFormValues>; index: number }) {
  const cpuClock = useWatch({ control, name: `assets.${index}.cpuClock` });
  const cpuInfo = cpuClock ? parseCpuInfo(cpuClock) : null;

  return (
    <div className="space-y-0.5">
      <Input
        className="h-8 text-xs font-mono"
        placeholder="i5-1235U"
        {...control.register(`assets.${index}.cpuClock`)}
      />
      {cpuInfo ? (
        <span className="inline-block rounded px-1 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-700">
          {cpuInfo.tier} {cpuInfo.generationStr}
        </span>
      ) : cpuClock?.trim() ? (
        <span className="inline-block rounded px-1 py-0.5 text-[10px] text-muted-foreground">
          세대 미인식
        </span>
      ) : null}
    </div>
  );
}

function MatchedRow({ info, colSpan }: { info: MatchedInfo; colSpan: number }) {
  const scoreColor = info.matchScore >= 0.9 ? "text-green-700 bg-green-50" : info.matchScore >= 0.7 ? "text-amber-700 bg-amber-50" : "text-gray-600 bg-gray-50";
  return (
    <tr className="border-b last:border-0">
      <td colSpan={colSpan} className={`px-3 py-1.5 text-xs ${scoreColor}`}>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-medium">매칭: {info.modelDisplayName}</span>
          {info.specSummary && <span className="text-muted-foreground">{info.specSummary}</span>}
          {info.retailPriceKrw != null ? (
            <span className="font-semibold">
              단가표: {info.retailPriceKrw.toLocaleString()}원
            </span>
          ) : (
            <span className="text-muted-foreground">단가 미등록</span>
          )}
          <span className="text-muted-foreground ml-auto">{info.matchNote}</span>
        </div>
      </td>
    </tr>
  );
}

export function AssetTable({ control, setValue }: AssetTableProps) {
  const { fields, append, remove } = useFieldArray({ control, name: "assets" });
  const [matchedMap, setMatchedMap] = useState<Record<number, MatchedInfo | null>>({});

  function addRow() {
    append({
      rawModelName: "",
      category: "LAPTOP",
      manufactureYear: null,
      grade: "UNKNOWN",
      quantity: 1,
      cpuClock: null,
      ram: null,
      storage: null,
    });
  }

  const COL_COUNT = 9;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">자산 목록</span>
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          <Plus className="mr-1 h-4 w-4" />
          행 추가
        </Button>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground w-[90px]">분류</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                모델명
                <span className="ml-1 text-xs font-normal text-green-600">자동검색</span>
              </th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground w-[120px]">
                CPU
                <span className="ml-1 text-xs font-normal text-blue-500">세대매칭</span>
              </th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground w-[80px]">RAM</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground w-[80px]">SSD</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground w-[70px]">연식</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground w-[80px]">등급</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground w-[60px]">수량</th>
              <th className="px-3 py-2 w-[36px]" />
            </tr>
          </thead>
          <tbody>
            {fields.length === 0 ? (
              <tr>
                <td colSpan={COL_COUNT} className="py-8 text-center text-muted-foreground text-sm">
                  행 추가 버튼을 눌러 자산을 입력하세요
                </td>
              </tr>
            ) : (
              fields.map((field, index) => (
                <>
                  <tr key={field.id} className="border-b">
                    {/* 분류 */}
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
                    {/* 모델명 */}
                    <td className="px-2 py-1.5">
                      <ModelNameCell
                        control={control}
                        index={index}
                        setValue={setValue}
                        onMatched={(info) => setMatchedMap((prev) => ({ ...prev, [index]: info }))}
                      />
                    </td>
                    {/* CPU */}
                    <td className="px-2 py-1.5">
                      <CpuCell control={control} index={index} />
                    </td>
                    {/* RAM */}
                    <td className="px-2 py-1.5">
                      <Input
                        className="h-8 text-xs"
                        placeholder="16GB"
                        {...control.register(`assets.${index}.ram`)}
                      />
                    </td>
                    {/* SSD */}
                    <td className="px-2 py-1.5">
                      <Input
                        className="h-8 text-xs"
                        placeholder="256GB"
                        {...control.register(`assets.${index}.storage`)}
                      />
                    </td>
                    {/* 연식 */}
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
                            onChange={(e) => f.onChange(e.target.value === "" ? null : Number(e.target.value))}
                          />
                        )}
                      />
                    </td>
                    {/* 등급 */}
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
                    {/* 수량 */}
                    <td className="px-2 py-1.5">
                      <Input
                        type="number"
                        className="h-8 text-sm"
                        min={1}
                        {...control.register(`assets.${index}.quantity`, { valueAsNumber: true })}
                      />
                    </td>
                    {/* 삭제 */}
                    <td className="px-2 py-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          remove(index);
                          setMatchedMap((prev) => { const n = { ...prev }; delete n[index]; return n; });
                        }}
                        disabled={fields.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                  {matchedMap[index] && (
                    <MatchedRow key={`match-${field.id}`} info={matchedMap[index]!} colSpan={COL_COUNT} />
                  )}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground text-right">총 {fields.length}개 품목</p>
    </div>
  );
}
