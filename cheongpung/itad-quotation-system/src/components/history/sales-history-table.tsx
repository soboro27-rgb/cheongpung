"use client";

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { SearchIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CurrencyDisplay } from "@/components/ui/currency-display";

const CATEGORY_LABELS: Record<string, string> = {
  LAPTOP: "노트북", DESKTOP: "데스크탑", SERVER: "서버",
  MONITOR: "모니터", NETWORK: "네트워크", STORAGE: "스토리지",
  GPU: "GPU", OTHER: "기타",
};

const GRADE_COLORS: Record<string, string> = {
  A: "text-green-700 bg-green-50",
  B: "text-amber-700 bg-amber-50",
  C: "text-red-700 bg-red-50",
  DEFECTIVE: "text-gray-700 bg-gray-100",
  UNKNOWN: "text-gray-500 bg-gray-50",
};

const REGION_LABELS: Record<string, string> = {
  SEOUL: "수도권", CHUNGCHEONG: "충청권", YEONGNAM: "영남권",
  HONAM: "호남권", GANGWON_JEJU: "강원·제주",
};

interface HistoryItem {
  id: string;
  soldAt: string;
  grade: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  region: string;
  source: string | null;
  assetMaster: {
    brand: string;
    modelCode: string;
    modelDisplayName: string;
    category: string;
  };
}

interface ApiResponse {
  items: HistoryItem[];
  total: number;
  page: number;
  totalPages: number;
}

export function SalesHistoryTable() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (query) params.set("q", query);
      if (category !== "ALL") params.set("category", category);
      const res = await fetch(`/api/history?${params}`);
      const json = await res.json();
      setData(json);
    } catch {
      toast.error("데이터 조회 실패");
    } finally {
      setLoading(false);
    }
  }, [query, category, page]);

  useEffect(() => {
    const t = setTimeout(fetchData, query ? 300 : 0);
    return () => clearTimeout(t);
  }, [fetchData, query]);

  useEffect(() => {
    setPage(1);
  }, [query, category]);

  return (
    <>
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-xs">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="모델명, 브랜드 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select value={category} onValueChange={(v) => setCategory(v ?? "ALL")}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">전체 분류</SelectItem>
            {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {data && (
          <span className="text-sm text-muted-foreground ml-auto">
            총 {data.total.toLocaleString()}건
          </span>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">매각일</TableHead>
              <TableHead className="w-24">분류</TableHead>
              <TableHead>모델명</TableHead>
              <TableHead className="w-12 text-center">등급</TableHead>
              <TableHead className="w-16 text-right">수량</TableHead>
              <TableHead className="w-32 text-right">단가</TableHead>
              <TableHead className="w-32 text-right">합계</TableHead>
              <TableHead className="w-24">지역</TableHead>
              <TableHead className="w-24 hidden lg:table-cell">출처</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 9 }).map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-4 bg-muted rounded animate-pulse" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data?.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-12">
                  이력 데이터가 없습니다
                </TableCell>
              </TableRow>
            ) : (
              data?.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-sm tabular-nums">
                    {format(new Date(item.soldAt), "yyyy-MM-dd")}
                  </TableCell>
                  <TableCell className="text-sm">
                    {CATEGORY_LABELS[item.assetMaster.category] ?? item.assetMaster.category}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{item.assetMaster.modelDisplayName}</div>
                    <div className="text-xs text-muted-foreground font-mono">{item.assetMaster.modelCode}</div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${GRADE_COLORS[item.grade]}`}>
                      {item.grade}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">{item.quantity}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    <CurrencyDisplay amount={Number(item.unitPrice)} />
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    <CurrencyDisplay amount={Number(item.totalPrice)} />
                  </TableCell>
                  <TableCell className="text-sm">{REGION_LABELS[item.region] ?? item.region}</TableCell>
                  <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">{item.source ?? "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {data.totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            disabled={page >= data.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      )}
    </>
  );
}
