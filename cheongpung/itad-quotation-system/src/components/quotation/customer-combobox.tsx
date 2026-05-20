"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, ChevronsUpDown, Loader2, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const SECTOR_LABELS: Record<string, string> = {
  FINANCIAL: "금융", PUBLIC: "공공", CORPORATE: "기업",
  HEALTHCARE: "의료", EDUCATION: "교육", OTHER: "기타",
};

const newCustomerSchema = z.object({
  name: z.string().min(1, "고객사명을 입력하세요"),
  sector: z.enum(["FINANCIAL", "PUBLIC", "CORPORATE", "HEALTHCARE", "EDUCATION", "OTHER"]),
  region: z.enum(["SEOUL", "CHUNGCHEONG", "YEONGNAM", "HONAM", "GANGWON_JEJU"]).default("SEOUL"),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
});

type NewCustomerForm = z.infer<typeof newCustomerSchema>;

interface Customer {
  id: string;
  name: string;
  sector: string;
  totalDeals: number;
}

interface CustomerComboboxProps {
  value: string;
  onChange: (value: string) => void;
}

export function CustomerCombobox({ value, onChange }: CustomerComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedName, setSelectedName] = useState("");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const form = useForm<NewCustomerForm>({
    resolver: zodResolver(newCustomerSchema),
    defaultValues: { sector: "CORPORATE" },
  });

  useEffect(() => {
    if (query.length < 2) {
      setCustomers([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/customers?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setCustomers(data);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [query]);

  function openNewDialog() {
    form.reset({ name: query, sector: "CORPORATE" });
    setOpen(false);
    setNewDialogOpen(true);
  }

  async function handleCreate(values: NewCustomerForm) {
    setCreating(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "등록 실패");
      }
      const created: Customer = await res.json();
      setCustomers((prev) => [created, ...prev]);
      setSelectedName(created.name);
      onChange(created.id);
      setNewDialogOpen(false);
      toast.success(`${created.name} 등록 완료`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "오류가 발생했습니다");
    } finally {
      setCreating(false);
    }
  }

  const displayName = selectedName || customers.find((c) => c.id === value)?.name;

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          className={cn(
            buttonVariants({ variant: "outline" }),
            "w-full justify-between font-normal"
          )}
          aria-expanded={open}
        >
          {displayName ?? "고객사 검색..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="기관명 입력 (2글자 이상)"
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              {loading && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
              {!loading && query.length >= 2 && customers.length === 0 && (
                <CommandEmpty>검색 결과 없음</CommandEmpty>
              )}
              {!loading && customers.length > 0 && (
                <CommandGroup>
                  {customers.map((c) => (
                    <CommandItem
                      key={c.id}
                      value={c.id}
                      onSelect={() => {
                        onChange(c.id);
                        setSelectedName(c.name);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === c.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div>
                        <div className="text-sm">{c.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {SECTOR_LABELS[c.sector] ?? c.sector}
                          {c.totalDeals > 0 && ` · 거래 ${c.totalDeals}건`}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {query.length < 2 && (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  2글자 이상 입력하세요
                </div>
              )}
              <CommandSeparator />
              <CommandGroup>
                <CommandItem onSelect={openNewDialog} className="text-primary">
                  <PlusIcon className="mr-2 h-4 w-4" />
                  신규 고객사 등록
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>신규 고객사 등록</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">고객사명 <span className="text-destructive">*</span></label>
              <Input {...form.register("name")} placeholder="예: 국민은행" />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">업종 <span className="text-destructive">*</span></label>
              <Select
                value={form.watch("sector")}
                onValueChange={(v) => form.setValue("sector", v as NewCustomerForm["sector"])}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(SECTOR_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">지역</label>
                <Select
                  value={form.watch("region")}
                  onValueChange={(v) => form.setValue("region", (v ?? "SEOUL") as NewCustomerForm["region"])}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SEOUL">수도권</SelectItem>
                    <SelectItem value="CHUNGCHEONG">충청권</SelectItem>
                    <SelectItem value="YEONGNAM">영남권</SelectItem>
                    <SelectItem value="HONAM">호남권</SelectItem>
                    <SelectItem value="GANGWON_JEJU">강원·제주</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">담당자명</label>
                <Input {...form.register("contactName")} placeholder="예: 홍길동" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">연락처</label>
              <Input {...form.register("contactPhone")} placeholder="예: 02-1234-5678" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setNewDialogOpen(false)}>
                취소
              </Button>
              <Button type="submit" disabled={creating}>
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                등록
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
