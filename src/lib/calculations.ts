export type TradeDirection = "long" | "short";

export interface PnlCalculationResult {
  pnlPercent: number;
  pnlAmount: number;
}

/**
 * Computes P&L percentage and monetary amount sign-aware for long and short trades.
 *
 * For Long:
 *   % Gain/Loss = ((exitPrice - entryPrice) / entryPrice) * 100
 *   $ Gain/Loss = (exitPrice - entryPrice) * quantity
 *
 * For Short:
 *   % Gain/Loss = ((entryPrice - exitPrice) / entryPrice) * 100
 *   $ Gain/Loss = (entryPrice - exitPrice) * quantity
 */
export function calculatePnl(
  entryPrice: number,
  exitPrice: number,
  quantity: number,
  direction: TradeDirection
): PnlCalculationResult {
  if (!entryPrice || entryPrice <= 0 || !exitPrice || exitPrice <= 0) {
    return { pnlPercent: 0, pnlAmount: 0 };
  }

  const qty = quantity > 0 ? quantity : 1;

  let pnlPercent = 0;
  let pnlAmount = 0;

  if (direction === "long") {
    pnlPercent = ((exitPrice - entryPrice) / entryPrice) * 100;
    pnlAmount = (exitPrice - entryPrice) * qty;
  } else {
    pnlPercent = ((entryPrice - exitPrice) / entryPrice) * 100;
    pnlAmount = (entryPrice - exitPrice) * qty;
  }

  // Round to 2 decimal places for clean storage & display
  const roundedPercent = Number(pnlPercent.toFixed(2));
  const roundedAmount = Number(pnlAmount.toFixed(2));

  return {
    pnlPercent: roundedPercent,
    pnlAmount: roundedAmount,
  };
}

export function formatPnlPercent(percent: number): string {
  const sign = percent > 0 ? "+" : "";
  return `${sign}${percent.toFixed(2)}%`;
}

export function formatCurrency(amount: number, currency: string = "$"): string {
  const sign = amount > 0 ? "+" : amount < 0 ? "-" : "";
  const absAmount = Math.abs(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${sign}${currency}${absAmount}`;
}
