import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatPnlPercent, formatCurrency } from "@/lib/calculations";

interface PnlBadgeProps {
  pnlPercent: number;
  pnlAmount?: number;
  size?: "sm" | "md" | "lg";
  showAmount?: boolean;
}

export default function PnlBadge({
  pnlPercent,
  pnlAmount,
  size = "md",
  showAmount = false,
}: PnlBadgeProps) {
  const isProfit = pnlPercent > 0;
  const isLoss = pnlPercent < 0;
  const isBreakeven = pnlPercent === 0;

  const colorStyles = isProfit
    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
    : isLoss
    ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
    : "bg-slate-500/15 text-slate-300 border-slate-500/30";

  const sizeStyles = {
    sm: "text-xs px-2 py-0.5 gap-1",
    md: "text-sm px-2.5 py-1 gap-1.5",
    lg: "text-base px-3.5 py-1.5 gap-2 font-semibold",
  }[size];

  return (
    <div
      className={`inline-flex items-center font-mono font-medium rounded-full border ${colorStyles} ${sizeStyles}`}
    >
      {isProfit && <TrendingUp className="w-3.5 h-3.5" />}
      {isLoss && <TrendingDown className="w-3.5 h-3.5" />}
      {isBreakeven && <Minus className="w-3.5 h-3.5" />}
      <span>{formatPnlPercent(pnlPercent)}</span>
      {showAmount && pnlAmount !== undefined && (
        <span className="opacity-80 text-[0.88em]">
          ({formatCurrency(pnlAmount)})
        </span>
      )}
    </div>
  );
}
