import React from "react";
import TradeForm from "@/components/trades/TradeForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Log New Trade | AlphaJournal",
};

export default function NewTradePage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Link
        href="/trades"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Trade Journal</span>
      </Link>

      <TradeForm />
    </div>
  );
}
