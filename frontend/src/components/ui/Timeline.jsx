import React from "react";
import { Clock, ShieldCheck, FileText, UserCheck, AlertTriangle } from "lucide-react";

export default function Timeline({ items = [] }) {
  if (!items || items.length === 0) {
    return (
      <div className="p-6 text-center text-slate-400 text-xs italic">
        No recorded activity entries.
      </div>
    );
  }

  const getIcon = (action = "") => {
    const act = action.toUpperCase();
    if (act.includes("CASE") || act.includes("CREATE")) return <FileText className="h-3.5 w-3.5 text-blue-600" />;
    if (act.includes("USER") || act.includes("LOGIN") || act.includes("AUTH")) return <UserCheck className="h-3.5 w-3.5 text-indigo-600" />;
    if (act.includes("EVIDENCE") || act.includes("SCAN")) return <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />;
    if (act.includes("ALERT") || act.includes("LOCKED")) return <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />;
    return <Clock className="h-3.5 w-3.5 text-slate-500" />;
  };

  return (
    <div className="relative pl-4 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {items.map((item, index) => (
        <div key={item.id || index} className="relative flex items-start gap-3 text-xs">
          <div className="absolute -left-4 top-1.5 h-3.5 w-3.5 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
          </div>
          <div className="flex-1 bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <span className="font-bold text-slate-800 text-[11px] font-mono uppercase tracking-tight flex items-center gap-1.5">
                {getIcon(item.action)}
                {item.action || "ACTIVITY"}
              </span>
              <span className="text-[10px] font-mono text-slate-400 shrink-0">
                {item.timestamp ? new Date(item.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : ''}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">{item.details}</p>
            {item.user && (
              <span className="text-[9px] text-slate-400 font-medium block mt-1">
                By Officer: <span className="font-mono font-semibold text-slate-700">@{item.user}</span>
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
