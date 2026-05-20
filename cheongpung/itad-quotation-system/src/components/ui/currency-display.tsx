"use client";

interface CurrencyDisplayProps {
  amount: number | bigint | null | undefined;
  className?: string;
  suffix?: string;
}

const formatter = new Intl.NumberFormat("ko-KR");

export function CurrencyDisplay({ amount, className, suffix = "원" }: CurrencyDisplayProps) {
  if (amount == null) return <span className={className}>-</span>;

  const value = typeof amount === "bigint" ? Number(amount) : amount;
  return (
    <span className={className}>
      {formatter.format(value)}
      {suffix}
    </span>
  );
}
