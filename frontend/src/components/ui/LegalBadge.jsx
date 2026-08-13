import React from "react";
import { BookOpen } from "lucide-react";

export default function LegalBadge({ act = "BNS", section = "", title = "", confidence = null, onClick = null }) {
  const getActStyle = () => {
    const code = (act || "").toUpperCase();
    if (code.includes("BNS")) return "bg-blue-50 text-blue-800 border-blue-200/80";
    if (code.includes("BNSS")) return "bg-indigo-50 text-indigo-800 border-indigo-200/80";
    if (code.includes("BSA")) return "bg-teal-50 text-teal-800 border-teal-200/80";
    if (code.includes("IPC")) return "bg-amber-50 text-amber-800 border-amber-200/80";
    if (code.includes("IT")) return "bg-purple-50 text-purple-800 border-purple-200/80";
    return "bg-slate-50 text-slate-700 border-slate-200";
  };

  const formattedSection = section
    .toString()
    .replace(/^(BNS|BNSS|BSA|IPC|IT\s+Act|IT|Section|Sec\.?|\s+)+/gi, "")
    .trim();

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] font-medium transition-all ${getActStyle()} ${onClick ? 'hover:shadow-xs cursor-pointer' : 'cursor-default'}`}
    >
      <BookOpen className="h-3 w-3 opacity-70 shrink-0" />
      <span className="font-semibold">{act}</span>
      {formattedSection && (
        <span className="font-mono font-bold tracking-tight">§{formattedSection}</span>
      )}
      {title && <span className="max-w-[140px] truncate text-slate-600 hidden sm:inline">({title})</span>}
      {confidence !== null && (
        <span className="text-[9px] font-mono px-1 bg-white/80 rounded border border-slate-200/60 font-bold ml-0.5">
          {confidence}%
        </span>
      )}
    </button>
  );
}
