"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SearchIcon, PencilIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { CurrencyDisplay } from "@/components/ui/currency-display";
import { AssetMasterForm } from "./asset-master-form";

const CATEGORY_LABELS: Record<string, string> = {
  LAPTOP: "노트북", DESKTOP: "데스크탑", SERVER: "서버",
  MONITOR: "모니터", NETWORK: "네트워크", STORAGE: "스토리지",
  GPU: "GPU", OTHER: "기타",
};

const CATEGORY_COLORS: Record<string, string> = {
  LAPTOP: "bg-blue-100 text-blue-800",
  DESKTOP: "bg-purple-100 text-purple-800",
  SERVER: "bg-red-100 text-red-800",
  MONITOR: "bg-cyan-100 text-cyan-800",
  NETWORK: "bg-orange-100 text-orange-800",
  STORAGE: "bg-yellow-100 text-yellow-800",
  GPU: "bg-green-100 text-green-800",
  OTHER: "bg-gray-100 text-gray-800",
};

type AssetCategory = "LAPTOP" | "DESKTOP" | "SERVER" | "MONITOR" | "NETWORK" | "STORAGE" | "GPU" | "OTHER";

interface AssetMaster {
  id: string;
  category: AssetCategory;
  brand: string;
  modelCode: string;
  modelDisplayName: string;
  specSummary: string | null;
  releaseYear: number | null;
  retailPriceKrw: number | null;
}

interface ApiResponse {
  items: AssetMaster[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function AssetMasterTable() {
  const router = useRouter();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [page, setPage] = useState(1);
  const [editTarget, setEditTarget] = useState<AssetMaster | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AssetMaster | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (query) params.set("q", query);
      if (category !== "ALL") params.set("category", category);
      const res = await fetch(`/api/assets?${params}`);
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

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/assets/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("삭제되었습니다");
      setDeleteTarget(null);
      fetchData();
    } catch {
      toast.error("삭제 실패");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      {/* 필터 */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-xs">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="모델명, 브랜드, 모델코드 검색"
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

      {/* 테이블 */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">분류</TableHead>
              <TableHead className="w-28">브랜드</TableHead>
              <TableHead className="w-36">모델코드</TableHead>
              <TableHead>모델명</TableHead>
              <TableHead className="hidden xl:table-cell">사양 요약</TableHead>
              <TableHead className="w-20 text-right">출시연도</TableHead>
              <TableHead className="w-32 text-right">출고가</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-4 bg-muted rounded animate-pulse" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data?.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                  검색 결과가 없습니다
                </TableCell>
              </TableRow>
            ) : (
              data?.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[item.category]}`}>
                      {CATEGORY_LABELS[item.category]}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{item.brand}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{item.modelCode}</TableCell>
                  <TableCell>{item.modelDisplayName}</TableCell>
                  <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">{item.specSummary ?? "-"}</TableCell>
                  <TableCell className="text-right text-sm">{item.releaseYear ?? "-"}</TableCell>
                  <TableCell className="text-right text-sm">
                    {item.retailPriceKrw ? (
                      <CurrencyDisplay amount={item.retailPriceKrw} />
                    ) : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setEditTarget(item)}
                      >
                        <PencilIcon className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(item)}
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 페이지네이션 */}
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

      {/* 수정 다이얼로그 */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>자산 마스터 수정</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <AssetMasterForm
              defaultValues={{
                ...editTarget,
                specSummary: editTarget.specSummary ?? undefined,
                retailPriceKrw: editTarget.retailPriceKrw ?? undefined,
                releaseYear: editTarget.releaseYear ?? undefined,
              }}
              onSuccess={() => { setEditTarget(null); fetchData(); }}
              onCancel={() => setEditTarget(null)}
              assetId={editTarget.id}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>자산 마스터 삭제</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            <strong>{deleteTarget?.modelDisplayName}</strong>을(를) 삭제하시겠습니까?<br />
            연결된 이력 데이터는 유지됩니다.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>취소</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
