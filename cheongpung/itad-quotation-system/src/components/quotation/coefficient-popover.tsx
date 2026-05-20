"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Props {
  basePrice: number;
  c1Grade: number;
  c2Age: number;
  c3Market: number;
  c4Region: number;
  c5Customer: number;
  finalUnitPrice: number;
  gradeLabel: string;
  children: React.ReactNode;
}

const GRADE_LABELS: Record<string, string> = {
  A: "A등급", B: "B등급", C: "C등급", DEFECTIVE: "불량", UNKNOWN: "미상",
};

export function CoefficientPopover({
  basePrice,
  c1Grade,
  c2Age,
  c3Market,
  c4Region,
  c5Customer,
  finalUnitPrice,
  gradeLabel,
  children,
}: Props) {
  const rows = [
    { label: `기준가 P₀`, value: basePrice > 0 ? `${basePrice.toLocaleString("ko-KR")}원` : "—" },
    { label: `× 등급 (${GRADE_LABELS[gradeLabel] ?? gradeLabel})`, value: `${c1Grade.toFixed(2)}` },
    { label: `× 연식 계수`, value: `${c2Age.toFixed(2)}` },
    { label: `× 시세 계수`, value: `${c3Market.toFixed(2)}` },
    { label: `× 지역 계수`, value: `${c4Region.toFixed(2)}` },
    { label: `× 기관 계수`, value: `${c5Customer.toFixed(2)}` },
  ];

  return (
    <Popover>
      <PopoverTrigger className="outline-none">
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="end">
        <p className="text-xs font-semibold mb-2 text-muted-foreground">단가 산출 근거</p>
        <div className="space-y-1">
          {rows.map((row) => (
            <div key={row.label} className="flex justify-between text-xs">
              <span className="text-muted-foreground">{row.label}</span>
              <span className="font-mono font-medium">{row.value}</span>
            </div>
          ))}
          <div className="border-t pt-1 flex justify-between text-xs">
            <span className="font-semibold">단위가</span>
            <span className="font-mono font-bold">
              {finalUnitPrice.toLocaleString("ko-KR")}원
            </span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
