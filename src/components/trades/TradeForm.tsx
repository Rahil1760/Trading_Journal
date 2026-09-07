"use client";

import React, { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  TrendingDown,
  Calculator,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Calendar,
  Layers,
  FileText,
  DollarSign,
  Hash,
} from "lucide-react";
import ImageUploader from "@/components/trades/ImageUploader";
import PnlBadge from "@/components/trades/PnlBadge";
import { calculatePnl, formatCurrency, formatPnlPercent, TradeDirection } from "@/lib/calculations";

interface TradeFormData {
  symbol: string;
  direction: TradeDirection;
  entryPrice: string;
  exitPrice: string;
  quantity: string;
  tradeDate: string;
  entryScreenshotUrl: string;
  exitScreenshotUrl: string;
  logic: string;
}

const INITIAL_FORM_DATA: TradeFormData = {
  symbol: "",
  direction: "long",
  entryPrice: "",
  exitPrice: "",
  quantity: "1",
  tradeDate: new Date().toISOString().split("T")[0],
  entryScreenshotUrl: "",
  exitScreenshotUrl: "",
  logic: "",
};

export default function TradeForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<TradeFormData>(INITIAL_FORM_DATA);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live P&L calculation
  const numericEntry = parseFloat(formData.entryPrice) || 0;
  const numericExit = parseFloat(formData.exitPrice) || 0;
  const numericQty = parseFloat(formData.quantity) || 0;

  const livePnl = useMemo(() => {
    if (numericEntry > 0 && numericExit > 0) {
      return calculatePnl(numericEntry, numericExit, numericQty, formData.direction);
    }
    return { pnlPercent: 0, pnlAmount: 0 };
  }, [numericEntry, numericExit, numericQty, formData.direction]);

  // Validation
  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    if (!formData.symbol.trim()) errors.push("Symbol is required");
    if (numericEntry <= 0) errors.push("Entry price must be > 0");
    if (numericExit <= 0) errors.push("Exit price must be > 0");
    if (numericQty <= 0) errors.push("Quantity must be > 0");
    if (!formData.entryScreenshotUrl) errors.push("Entry setup screenshot is required");
    if (!formData.exitScreenshotUrl) errors.push("Exit screenshot is required");
    if (!formData.logic.trim()) errors.push("Trade logic is required");
    if (formData.logic.length > 2000) errors.push("Trade logic cannot exceed 2000 characters");
    return errors;
  }, [formData, numericEntry, numericExit, numericQty]);

  const isValid = validationErrors.length === 0;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const setDirection = (direction: TradeDirection) => {
    setFormData((prev) => ({ ...prev, direction }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    setServerError(null);

    try {
      const payload = {
        symbol: formData.symbol.trim().toUpperCase(),
        direction: formData.direction,
        entryPrice: numericEntry,
        exitPrice: numericExit,
        quantity: numericQty,
        tradeDate: formData.tradeDate,
        entryScreenshotUrl: formData.entryScreenshotUrl,
        exitScreenshotUrl: formData.exitScreenshotUrl,
        logic: formData.logic.trim(),
      };

      const res = await fetch("/api/trades", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create trade");
      }

      router.push(`/trades/${data.trade._id || ""}`);
      router.refresh();
    } catch (err: any) {
      setServerError(err.message || "An unexpected error occurred");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Top Banner / Hero */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <span>Log New Trade</span>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
              Live Computation
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Capture your execution, entry/exit screenshots, and trade thesis with automatic P&L calculations.
          </p>
        </div>

        {/* Live P&L Preview Widget */}
        <div
          className={`px-5 py-3 rounded-2xl border transition-all duration-300 ${
            numericEntry > 0 && numericExit > 0
              ? livePnl.pnlPercent >= 0
                ? "bg-emerald-950/40 border-emerald-500/40 profit-glow"
                : "bg-rose-950/40 border-rose-500/40 loss-glow"
              : "bg-slate-900/60 border-slate-800"
          }`}
        >
          <div className="text-[11px] uppercase tracking-wider text-slate-400 font-mono flex items-center justify-between gap-4">
            <span>Estimated P&L ({formData.direction.toUpperCase()})</span>
            <Calculator className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-3 mt-1">
            <span
              className={`text-2xl font-bold font-mono ${
                numericEntry > 0 && numericExit > 0
                  ? livePnl.pnlPercent >= 0
                    ? "text-emerald-400"
                    : "text-rose-400"
                  : "text-slate-500"
              }`}
            >
              {numericEntry > 0 && numericExit > 0
                ? formatPnlPercent(livePnl.pnlPercent)
                : "0.00%"}
            </span>
            <span className="text-sm font-mono text-slate-400">
              {numericEntry > 0 && numericExit > 0
                ? `(${formatCurrency(livePnl.pnlAmount)})`
                : "($0.00)"}
            </span>
          </div>
        </div>
      </div>

      {serverError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Main Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Trade Parameters & Logic (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-6">
            <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800/60 pb-3">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>Trade Execution Details</span>
            </h2>

            {/* Symbol & Direction */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Symbol */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Symbol / Instrument <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="symbol"
                    required
                    placeholder="e.g. NIFTY, BANKNIFTY, AAPL"
                    value={formData.symbol}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition font-mono uppercase font-semibold"
                  />
                </div>
              </div>

              {/* Direction Toggle */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Direction <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/80 rounded-xl border border-slate-700/80">
                  <button
                    type="button"
                    onClick={() => setDirection("long")}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                      formData.direction === "long"
                        ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>LONG (Buy)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirection("short")}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                      formData.direction === "short"
                        ? "bg-rose-500 text-white shadow-md shadow-rose-500/25"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>SHORT (Sell)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Entry, Exit, Quantity */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Entry Price */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Entry Price <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="entryPrice"
                    step="any"
                    min="0.0001"
                    required
                    placeholder="0.00"
                    value={formData.entryPrice}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition font-mono"
                  />
                </div>
              </div>

              {/* Exit Price */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Exit Price <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="exitPrice"
                    step="any"
                    min="0.0001"
                    required
                    placeholder="0.00"
                    value={formData.exitPrice}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition font-mono"
                  />
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Quantity / Lots <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="quantity"
                    step="any"
                    min="0.0001"
                    required
                    placeholder="1"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Trade Date */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Trade Execution Date <span className="text-rose-400">*</span></span>
              </label>
              <input
                type="date"
                name="tradeDate"
                required
                value={formData.tradeDate}
                onChange={handleInputChange}
                className="w-full sm:w-1/2 bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition font-mono"
              />
            </div>

            {/* Trade Logic / Notes */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Trade Rationale & Logic <span className="text-rose-400">*</span></span>
                </label>
                <span
                  className={`text-[11px] font-mono ${
                    formData.logic.length > 2000
                      ? "text-rose-400 font-bold"
                      : "text-slate-400"
                  }`}
                >
                  {formData.logic.length} / 2000
                </span>
              </div>
              <textarea
                name="logic"
                rows={5}
                required
                maxLength={2000}
                placeholder="Describe your setup, technical triggers (e.g. breakout, retest, EMA cross), risk/reward plan, psychological state, and post-trade reflections..."
                value={formData.logic}
                onChange={handleInputChange}
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition leading-relaxed resize-y"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Screenshot Uploaders & Submission (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-6">
            <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800/60 pb-3">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Chart Screenshots</span>
            </h2>

            {/* Entry Screenshot */}
            <ImageUploader
              label="1. Entry Setup Screenshot"
              description="Chart condition, indicators, or key levels at the time of entry"
              value={formData.entryScreenshotUrl}
              onChange={(url) =>
                setFormData((prev) => ({ ...prev, entryScreenshotUrl: url }))
              }
              required
            />

            {/* Exit Screenshot */}
            <ImageUploader
              label="2. Exit & Execution Screenshot"
              description="Chart condition at target hit, stop loss trigger, or trail exit"
              value={formData.exitScreenshotUrl}
              onChange={(url) =>
                setFormData((prev) => ({ ...prev, exitScreenshotUrl: url }))
              }
              required
            />
          </div>

          {/* Validation checklist & Submit CTA */}
          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/60 space-y-4">
            <div className="space-y-1.5 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className={formData.symbol ? "text-emerald-400" : "text-slate-600"}>
                  ●
                </span>
                <span>Symbol: {formData.symbol || "Pending"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={
                    numericEntry > 0 && numericExit > 0
                      ? "text-emerald-400"
                      : "text-slate-600"
                  }
                >
                  ●
                </span>
                <span>Prices: Entry & Exit positive</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={
                    formData.entryScreenshotUrl && formData.exitScreenshotUrl
                      ? "text-emerald-400"
                      : "text-slate-600"
                  }
                >
                  ●
                </span>
                <span>Screenshots: Both uploaded ({formData.entryScreenshotUrl ? 1 : 0} + {formData.exitScreenshotUrl ? 1 : 0}/2)</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={
                    formData.logic.trim().length > 0
                      ? "text-emerald-400"
                      : "text-slate-600"
                  }
                >
                  ●
                </span>
                <span>Trade logic documented</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className={`w-full py-3.5 px-6 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
                isValid && !isSubmitting
                  ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white shadow-blue-500/20 active:scale-[0.99] cursor-pointer"
                  : "bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed opacity-75"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Logging Trade to Journal...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Trade to Journal</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
