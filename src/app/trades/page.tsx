"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  PlusCircle,
  Search,
  Filter,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  DollarSign,
  BarChart2,
  Percent,
  CheckCircle,
  Loader2,
  Trash2,
  Eye,
} from "lucide-react";
import PnlBadge from "@/components/trades/PnlBadge";
import { formatCurrency, formatPnlPercent } from "@/lib/calculations";

interface TradeItem {
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
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function TradesListPage() {
  const [trades, setTrades] = useState<TradeItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [symbolFilter, setSymbolFilter] = useState("");
  const [directionFilter, setDirectionFilter] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrades = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "10");
      if (symbolFilter.trim()) params.set("symbol", symbolFilter.trim());
      if (directionFilter) params.set("direction", directionFilter);

      const res = await fetch(`/api/trades?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch trades");

      const data = await res.json();
      setTrades(data.trades || []);
      setPagination(
        data.pagination || {
          page: 1,
          limit: 10,
          totalCount: 0,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        }
      );
    } catch (err: any) {
      setError(err.message || "Failed to load trades");
    } finally {
      setIsLoading(false);
    }
  }, [symbolFilter, directionFilter]);

  useEffect(() => {
    fetchTrades(1);
  }, [fetchTrades]);

  // Overall statistics
  const stats = React.useMemo(() => {
    const total = trades.length;
    if (total === 0) {
      return { total: 0, winCount: 0, winRate: 0, netPnlAmount: 0, avgPnlPercent: 0 };
    }
    const winCount = trades.filter((t) => t.pnlPercent > 0).length;
    const winRate = (winCount / total) * 100;
    const netPnlAmount = trades.reduce((acc, t) => acc + (t.pnlAmount || 0), 0);
    const avgPnlPercent = trades.reduce((acc, t) => acc + (t.pnlPercent || 0), 0) / total;

    return {
      total,
      winCount,
      winRate,
      netPnlAmount,
      avgPnlPercent,
    };
  }, [trades]);

  const handleDeleteTrade = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm("Are you sure you want to delete this trade and its screenshots from disk?")) return;

    try {
      const res = await fetch(`/api/trades/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete trade");
      fetchTrades(pagination.page);
    } catch (err: any) {
      alert(err.message || "Failed to delete");
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Trading Journal
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Review your past executions, screenshot trade set-ups, and track statistical performance.
          </p>
        </div>

        <Link
          href="/trades/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/20 active:scale-95 transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Log New Trade</span>
        </Link>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <div className="text-xs uppercase tracking-wider font-mono text-slate-400 flex items-center justify-between">
            <span>Total Logged</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white">
            {pagination.totalCount} <span className="text-xs font-normal text-slate-500">trades</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <div className="text-xs uppercase tracking-wider font-mono text-slate-400 flex items-center justify-between">
            <span>Win Rate</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white">
            {stats.winRate.toFixed(1)}%
            <span className="text-xs font-normal text-slate-500 ml-1.5">
              ({stats.winCount}W / {stats.total - stats.winCount}L)
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <div className="text-xs uppercase tracking-wider font-mono text-slate-400 flex items-center justify-between">
            <span>Net P&L (Page)</span>
            <DollarSign className="w-4 h-4 text-indigo-400" />
          </div>
          <div
            className={`mt-2 text-2xl font-bold font-mono ${
              stats.netPnlAmount >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {formatCurrency(stats.netPnlAmount)}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <div className="text-xs uppercase tracking-wider font-mono text-slate-400 flex items-center justify-between">
            <span>Avg Return (Page)</span>
            <Percent className="w-4 h-4 text-amber-400" />
          </div>
          <div
            className={`mt-2 text-2xl font-bold font-mono ${
              stats.avgPnlPercent >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {formatPnlPercent(stats.avgPnlPercent)}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-900/50 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search symbol (e.g. NIFTY, TSLA)..."
            value={symbolFilter}
            onChange={(e) => setSymbolFilter(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-700/60 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition font-mono uppercase"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="inline-flex p-1 bg-slate-950/80 rounded-xl border border-slate-700/60 w-full sm:w-auto">
            <button
              onClick={() => setDirectionFilter("")}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                directionFilter === ""
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setDirectionFilter("long")}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1 ${
                directionFilter === "long"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" /> Long
            </button>
            <button
              onClick={() => setDirectionFilter("short")}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1 ${
                directionFilter === "short"
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" /> Short
            </button>
          </div>
        </div>
      </div>

      {/* Trades Table */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-sm font-medium">Loading trades from journal...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-center space-y-2">
          <p className="font-semibold">Error loading trades</p>
          <p className="text-xs text-rose-400">{error}</p>
        </div>
      ) : trades.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-slate-800 rounded-3xl bg-slate-900/20 space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-800/60 border border-slate-700 flex items-center justify-center text-slate-500">
            <Layers className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-200">No trades logged yet</h3>
            <p className="text-sm text-slate-400 max-w-sm mx-auto mt-1">
              Start building your edge by recording your setups with screenshots and notes.
            </p>
          </div>
          <Link
            href="/trades/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/20 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Log Your First Trade</span>
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/50 shadow-xl backdrop-blur-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400 font-mono">
                <th className="py-3.5 px-4">Setup</th>
                <th className="py-3.5 px-4">Symbol / Date</th>
                <th className="py-3.5 px-4">Direction</th>
                <th className="py-3.5 px-4">Entry / Exit</th>
                <th className="py-3.5 px-4">Qty</th>
                <th className="py-3.5 px-4">P&L (% / $)</th>
                <th className="py-3.5 px-4">Rationale Preview</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-sm">
              {trades.map((trade) => (
                <tr
                  key={trade._id}
                  className="hover:bg-slate-800/30 transition-colors group cursor-pointer"
                  onClick={() => (window.location.href = `/trades/${trade._id}`)}
                >
                  {/* Screenshot Thumbnail */}
                  <td className="py-3 px-4">
                    <div className="w-16 h-10 rounded-lg overflow-hidden border border-slate-700 bg-slate-950 relative shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={trade.entryScreenshotUrl}
                        alt={`${trade.symbol} setup`}
                        className="w-full h-full object-cover group-hover:scale-110 transition duration-200"
                      />
                    </div>
                  </td>

                  {/* Symbol & Date */}
                  <td className="py-3 px-4">
                    <div className="font-bold font-mono text-white text-base">
                      {trade.symbol}
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      {new Date(trade.tradeDate).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                  </td>

                  {/* Direction */}
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${
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
                  </td>

                  {/* Entry / Exit Prices */}
                  <td className="py-3 px-4 font-mono text-xs">
                    <div className="text-slate-300">
                      <span className="text-slate-500 mr-1">In:</span>
                      {trade.entryPrice.toFixed(2)}
                    </div>
                    <div className="text-slate-300">
                      <span className="text-slate-500 mr-1">Out:</span>
                      {trade.exitPrice.toFixed(2)}
                    </div>
                  </td>

                  {/* Quantity */}
                  <td className="py-3 px-4 font-mono text-xs text-slate-300">
                    {trade.quantity}
                  </td>

                  {/* P&L */}
                  <td className="py-3 px-4">
                    <PnlBadge
                      pnlPercent={trade.pnlPercent}
                      pnlAmount={trade.pnlAmount}
                      showAmount={true}
                      size="sm"
                    />
                  </td>

                  {/* Logic Preview */}
                  <td className="py-3 px-4 max-w-xs">
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {trade.logic}
                    </p>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/trades/${trade._id}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        title="View Full Detail"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={(e) => handleDeleteTrade(e, trade._id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        title="Delete Trade & Files"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-800/80 pt-4">
          <span className="text-xs text-slate-400 font-mono">
            Page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} trades)
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={!pagination.hasPrev}
              onClick={() => fetchTrades(pagination.page - 1)}
              className="p-2 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={!pagination.hasNext}
              onClick={() => fetchTrades(pagination.page + 1)}
              className="p-2 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
