import React from "react";

export default function MetricKpi({ title, value, subtext, icon, trend = null, status = "neutral" }) {
  const getStatusColor = () => {
    if (status === "success") return "text-emerald-600 bg-emerald-50 border-emerald-200/80";
    if (status === "warning") return "text-amber-600 bg-amber-50 border-amber-200/80";
    if (status === "danger") return "text-rose-600 bg-rose-50 border-rose-200/80";
    if (status === "accent") return "text-blue-600 bg-blue-50 border-blue-200/80";
    return "text-slate-700 bg-slate-50 border-slate-200/80";
  };

  return (
    <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center justify-between gap-3 transition-all hover:border-slate-300">
      <div className="flex-1 min-w-0">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
          {title}
        </span>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-xl font-extrabold text-slate-900 font-mono tracking-tight">
            {value}
          </span>
          {trend && (
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${trend.startsWith('+') ? 'bg-emerald-50 text-emerald-700 font-mono' : 'bg-slate-100 text-slate-600 font-mono'}`}>
              {trend}
            </span>
          )}
        </div>
        {subtext && (
          <p className="text-[11px] text-slate-400 mt-0.5 truncate leading-tight">
            {subtext}
          </p>
        )}
      </div>
      {icon && (
        <div className={`p-2 rounded-lg border shrink-0 ${getStatusColor()}`}>
          {icon}
        </div>
      )}
    </div>
  );
}
