import React from "react";
import { ShieldAlert, Info, Sparkles } from "lucide-react";

export default function AITrustBanner({ title, message, compact = false }) {
  if (compact) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-teal-50 border border-teal-200/80 rounded-md text-[11px] font-medium text-teal-800">
        <Sparkles className="h-3 w-3 text-teal-600 shrink-0" />
        <span>{title || "AI-Assisted Insight"} — Requires Investigator Verification</span>
      </div>
    );
  }

  return (
    <div className="p-3 bg-slate-900/90 text-white border border-slate-700/80 rounded-lg shadow-sm flex items-start gap-3 text-xs">
      <div className="p-1.5 bg-teal-500/20 text-teal-300 rounded-md shrink-0 mt-0.5 border border-teal-500/30">
        <ShieldAlert className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-100 text-xs tracking-tight">
            {title || "AI-Assisted Intelligence Output"}
          </span>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-teal-500/20 text-teal-300 border border-teal-500/30">
            Human-in-the-Loop
          </span>
        </div>
        <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
          {message || "AI assists investigators. All generated provisions, FIR drafts, and case relationships are decision-support suggestions and require verification against current official statutes before filing."}
        </p>
      </div>
    </div>
  );
}
