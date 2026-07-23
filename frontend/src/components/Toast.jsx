import React, { useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export default function Toast({ toast, onClose }) {
  if (!toast || !toast.message) return null;

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  const getStyle = () => {
    switch (toast.type) {
      case "success":
        return "bg-slate-900 text-emerald-300 border-emerald-800";
      case "error":
        return "bg-slate-900 text-rose-300 border-rose-800";
      case "warning":
        return "bg-slate-900 text-amber-300 border-amber-800";
      default:
        return "bg-slate-900 text-blue-300 border-blue-800";
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-amber-400 shrink-0" />;
      default:
        return <Info className="h-5 w-5 text-blue-400 shrink-0" />;
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up max-w-md w-full">
      <div className={`p-4 rounded-2xl border shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 text-xs font-semibold ${getStyle()}`}>
        <div className="flex items-center gap-3">
          {getIcon()}
          <span className="leading-snug">{toast.message}</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
