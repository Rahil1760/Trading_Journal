"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Calendar,
  Layers,
  DollarSign,
  Maximize2,
  Trash2,
  Loader2,
  AlertCircle,
  FileText,
  Clock,
  CheckCircle,
} from "lucide-react";
import PnlBadge from "@/components/trades/PnlBadge";
import { formatCurrency, formatPnlPercent } from "@/lib/calculations";

interface TradeDetail {
  _id: string;
  symbol: string;
  direction: "long" | "short";
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  pnlPercent: number;
  pnlAmount: number;
  entryScreenshotUrl: string;
  exitScreenshotUrl: string;
  logic: string;
  tradeDate: string;
  createdAt: string;
  updatedAt: string;
}

export default function TradeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [trade, setTrade] = useState<TradeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<"both" | "entry" | "exit">("both");

  useEffect(() => {
    if (!id) return;
    async function loadTrade() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/trades/${id}`);
        if (!res.ok) {
          throw new Error("Trade not found or failed to load");
        }
        const data = await res.json();
        setTrade(data.trade);
      } catch (err: any) {
        setError(err.message || "Failed to load trade details");
      } finally {
        setIsLoading(false);
      }
    }
    loadTrade();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this trade? This will permanently delete both screenshot files from disk.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/trades/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete trade");
      }

      router.push("/trades");
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Delete failed");
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-sm font-medium">Loading trade details...</p>
      </div>
    );
  }

  if (error || !trade) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white">Trade Not Found</h2>
        <p className="text-sm text-slate-400">{error || "Could not find trade details."}</p>
        <Link
          href="/trades"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-slate-800 text-slate-200 hover:bg-slate-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Journal</span>
        </Link>
      </div>
    );
  }

  const isProfit = trade.pnlPercent > 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div className="space-y-2">
          <Link
            href="/trades"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition mb-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Journal</span>
          </Link>

          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black font-mono text-white tracking-tight">
              {trade.symbol}
            </h1>
            <span
              className={`inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-md border ${
                trade.direction === "long"
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                  : "bg-rose-500/15 text-rose-400 border-rose-500/30"
              }`}
            >
              {trade.direction === "long" ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              {trade.direction}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              {new Date(trade.tradeDate).toLocaleDateString(undefined, {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Logged: {new Date(trade.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-rose-300 bg-rose-950/40 border border-rose-800/60 hover:bg-rose-900/60 transition disabled:opacity-50"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            <span>Delete Trade</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Entry Price */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <span className="text-xs uppercase tracking-wider font-mono text-slate-500 block">
            Entry Price
          </span>
          <span className="text-2xl font-bold font-mono text-white mt-1 block">
            {trade.entryPrice.toFixed(2)}
          </span>
        </div>

        {/* Exit Price */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <span className="text-xs uppercase tracking-wider font-mono text-slate-500 block">
            Exit Price
          </span>
          <span className="text-2xl font-bold font-mono text-white mt-1 block">
            {trade.exitPrice.toFixed(2)}
          </span>
        </div>

        {/* Quantity */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <span className="text-xs uppercase tracking-wider font-mono text-slate-500 block">
            Quantity / Lots
          </span>
          <span className="text-2xl font-bold font-mono text-white mt-1 block">
            {trade.quantity}
          </span>
        </div>

        {/* P&L Performance */}
        <div
          className={`p-5 rounded-2xl border ${
            isProfit
              ? "bg-emerald-950/30 border-emerald-500/40 profit-glow"
              : "bg-rose-950/30 border-rose-500/40 loss-glow"
          }`}
        >
          <span className="text-xs uppercase tracking-wider font-mono text-slate-400 block">
            Net Return (P&L)
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span
              className={`text-2xl font-bold font-mono ${
                isProfit ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {formatPnlPercent(trade.pnlPercent)}
            </span>
            <span className="text-sm font-mono text-slate-300">
              ({formatCurrency(trade.pnlAmount)})
            </span>
          </div>
        </div>
      </div>

      {/* Trade Logic / Rationale */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-400" />
          <span>Trade Thesis & Execution Logic</span>
        </h3>
        <p className="text-slate-200 text-sm md:text-base leading-relaxed whitespace-pre-wrap bg-slate-950/60 p-4 rounded-xl border border-slate-800/60">
          {trade.logic}
        </p>
      </div>

      {/* Screenshots Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
            <span>Chart Screenshots</span>
          </h3>

          <div className="flex p-1 bg-slate-900/80 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab("both")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                activeTab === "both"
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Side-by-Side
            </button>
            <button
              onClick={() => setActiveTab("entry")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                activeTab === "entry"
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Entry Only
            </button>
            <button
              onClick={() => setActiveTab("exit")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                activeTab === "exit"
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Exit Only
            </button>
          </div>
        </div>

        <div
          className={`grid gap-6 ${
            activeTab === "both" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
          }`}
        >
          {/* Entry Screenshot */}
          {(activeTab === "both" || activeTab === "entry") && (
            <div className="space-y-2 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-mono tracking-wider text-slate-400 font-bold">
                  1. Entry Setup
                </span>
                <a
                  href={trade.entryScreenshotUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-400 hover:underline"
                >
                  <Maximize2 className="w-3.5 h-3.5" /> Open Full-Res
                </a>
              </div>
              <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={trade.entryScreenshotUrl}
                  alt="Entry setup screenshot"
                  className="w-full max-h-[500px] object-contain"
                />
              </div>
            </div>
          )}

          {/* Exit Screenshot */}
          {(activeTab === "both" || activeTab === "exit") && (
            <div className="space-y-2 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-mono tracking-wider text-slate-400 font-bold">
                  2. Exit & Execution
                </span>
                <a
                  href={trade.exitScreenshotUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-400 hover:underline"
                >
                  <Maximize2 className="w-3.5 h-3.5" /> Open Full-Res
                </a>
              </div>
              <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={trade.exitScreenshotUrl}
                  alt="Exit execution screenshot"
                  className="w-full max-h-[500px] object-contain"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
