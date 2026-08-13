import React from "react";

export default function StatusBadge({ status = "draft" }) {
  const getStatusConfig = (st) => {
    const code = (st || "").toLowerCase();
    switch (code) {
      case "assigned":
        return { label: "ASSIGNED", bg: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-600" };
      case "accepted":
      case "under_investigation":
      case "investigating":
        return { label: "UNDER INVESTIGATION", bg: "bg-indigo-50 text-indigo-700 border-indigo-200", dot: "bg-indigo-600" };
      case "pending_approval":
      case "under_review":
        return { label: "PENDING APPROVAL", bg: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-600" };
      case "evidence_collection":
        return { label: "EVIDENCE COLLECTION", bg: "bg-teal-50 text-teal-700 border-teal-200", dot: "bg-teal-600" };
      case "fir_draft_ready":
      case "submitted":
      case "filed":
        return { label: "FIR FILED", bg: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-600" };
      case "rejected_by_officer":
      case "rejected":
        return { label: "DECLINED", bg: "bg-rose-50 text-rose-700 border-rose-200", dot: "bg-rose-600" };
      case "closed":
      case "archived":
        return { label: "CLOSED", bg: "bg-slate-100 text-slate-700 border-slate-300", dot: "bg-slate-500" };
      case "draft":
      default:
        return { label: "DRAFT", bg: "bg-slate-50 text-slate-600 border-slate-200", dot: "bg-slate-400" };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-mono font-bold tracking-tight ${config.bg}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
}
