"use client";

import { cn } from "@/lib/utils";
import { CheckIcon, ClockIcon, MinusIcon } from "lucide-react";

interface Props {
  status: string;
  approvalTier: "self" | "manager" | "director";
  finalAmount: number;
}

type StepStatus = "done" | "active" | "pending" | "skipped";

interface Step {
  label: string;
  sublabel: string;
  status: StepStatus;
}

export function ApprovalWorkflow({ status, approvalTier, finalAmount }: Props) {
  const isDone = status === "APPROVED";
  const isPending = status === "PENDING_APPROVAL";
  const isRejected = status === "REJECTED";

  const steps: Step[] = [
    {
      label: "영업담당 작성",
      sublabel: "완료",
      status: "done",
    },
    {
      label: "팀장 검토",
      sublabel: approvalTier === "self" ? "생략 (5천만원 미만)" : isPending ? "대기중" : isDone ? "완료" : "예정",
      status: approvalTier === "self" ? "skipped" : isPending ? "active" : isDone ? "done" : "pending",
    },
    {
      label: "본부장 승인",
      sublabel: approvalTier !== "director" ? "생략" : isDone ? "완료" : "예정",
      status: approvalTier !== "director" ? "skipped" : isDone ? "done" : "pending",
    },
    {
      label: "입찰서 변환",
      sublabel: isDone ? "가능" : "대기",
      status: isDone ? "active" : "pending",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2">
        {steps.map((step, i) => (
          <div key={step.label} className="flex-1 flex flex-col items-center">
            {/* 연결선 + 아이콘 */}
            <div className="relative w-full flex items-center justify-center">
              {i > 0 && (
                <div className={cn(
                  "absolute right-1/2 top-1/2 -translate-y-1/2 h-0.5 w-full",
                  step.status === "done" ? "bg-green-400" : "bg-border"
                )} />
              )}
              <div className={cn(
                "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-medium",
                step.status === "done" && "bg-green-500 border-green-500 text-white",
                step.status === "active" && "bg-amber-400 border-amber-400 text-white",
                step.status === "pending" && "bg-background border-border text-muted-foreground",
                step.status === "skipped" && "bg-background border-border/50 text-muted-foreground/50",
              )}>
                {step.status === "done" && <CheckIcon className="h-4 w-4" />}
                {step.status === "active" && <ClockIcon className="h-4 w-4" />}
                {step.status === "pending" && <span>{i + 1}</span>}
                {step.status === "skipped" && <MinusIcon className="h-3.5 w-3.5" />}
              </div>
            </div>
            {/* 레이블 */}
            <div className="mt-1.5 text-center">
              <p className={cn(
                "text-xs font-medium leading-tight",
                step.status === "skipped" && "line-through text-muted-foreground/50",
                step.status === "pending" && "text-muted-foreground",
              )}>
                {step.label}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{step.sublabel}</p>
            </div>
          </div>
        ))}
      </div>

      {isRejected && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive mt-2">
          반려 처리되었습니다. 수정 후 재요청하세요.
        </div>
      )}

      <div className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1.5 mt-2">
        {approvalTier === "self" && "5천만원 미만 — 영업담당자 자체 결정"}
        {approvalTier === "manager" && "5천만~1억 — 팀장 승인 필요"}
        {approvalTier === "director" && "1억 초과 — 팀장 + 본부장 승인 필요"}
      </div>
    </div>
  );
}
