import React, { useState, useEffect } from "react";
import { FileText, FileDown, Eye, CheckCircle2, ShieldCheck, AlertCircle, RefreshCw, Calendar, User } from "lucide-react";
import { api } from "../utils/api";

export default function Reports() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.getCases();
      // Filter cases that have AI output compiled (so they have reports ready)
      setCases(data);
    } catch (err) {
      setError("Failed to retrieve cases list: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "draft": return "border-slate-700 text-slate-400";
      case "under_review": return "border-purple-500/30 text-purple-400";
      case "filed": return "border-emerald-500/30 text-emerald-400";
      case "investigating": return "border-amber-500/30 text-amber-450";
      default: return "border-slate-800 text-slate-500";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-police-900 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-wide">Case Reports & Export Hub</h1>
          <p className="text-xs text-slate-400 mt-1">Download official First Information Reports and investigation dossiers certified under new BSA guidelines.</p>
        </div>
        <button
          onClick={loadCases}
          disabled={loading}
          className="p-3 rounded-xl bg-police-900/40 hover:bg-police-850 border border-police-800 text-slate-350 hover:text-white transition-all cursor-pointer"
        >
          <RefreshCw className={`h-4.5 w-4.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-455 text-xs">
          {error}
        </div>
      )}

      {/* Reports Table list */}
      {loading ? (
        <div className="p-16 rounded-2xl glass-panel text-center text-slate-500 font-mono text-xs animate-pulse">SEARCHING REPORTS REGISTRY...</div>
      ) : cases.length === 0 ? (
        <div className="p-16 rounded-2xl glass-panel text-center text-slate-400 text-xs italic">
          No case files registered in database yet.
        </div>
      ) : (
        <div className="grid gap-4">
          {cases.map((c) => {
            const hasReport = !!c.analysis_output;
            return (
              <div 
                key={c.id}
                className="p-5 rounded-2xl glass-panel border-glass-inset shadow-glass flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-cyber-cyan/15 transition-all bg-police-950/20"
              >
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-mono text-slate-500 font-bold">CASE #{c.id}</span>
                    <h3 className="text-sm font-black text-slate-200">{c.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${getStatusBadge(c.status)}`}>
                      {c.status.replace("_", " ")}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-x-4 text-[10px] text-slate-450 font-mono">
                    <span className="flex items-center space-x-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-600" />
                      <span>Date: {c.date || "N/A"}</span>
                    </span>
                    <span className="flex items-center space-x-1.5">
                      <User className="h-3.5 w-3.5 text-slate-600" />
                      <span>Precinct Station: {c.station || "Central Cyber PS"}</span>
                    </span>
                  </div>
                </div>

                {/* Report Download controls */}
                <div className="flex items-center space-x-3 shrink-0">
                  {hasReport ? (
                    <>
                      <div className="flex items-center space-x-1.5 text-[10px] font-mono text-emerald-400 mr-2 bg-emerald-950/60 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>BSA 63 CERTIFIED</span>
                      </div>
                      <button
                        onClick={() => api.downloadPDF(c.id)}
                        className="flex items-center space-x-1.5 bg-rose-950/40 hover:bg-rose-900/30 border border-rose-500/30 text-rose-400 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        title="Download official PDF report"
                      >
                        <FileDown className="h-4 w-4" />
                        <span>PDF Report</span>
                      </button>
                      <button
                        onClick={() => api.downloadDocx(c.id)}
                        className="flex items-center space-x-1.5 bg-blue-950/40 hover:bg-blue-900/30 border border-blue-500/30 text-blue-400 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        title="Download editable Word document"
                      >
                        <FileDown className="h-4 w-4" />
                        <span>Word DOCX</span>
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center space-x-1.5 text-[10px] font-mono text-slate-500 bg-police-900 px-3 py-2 rounded-xl">
                      <AlertCircle className="h-3.5 w-3.5 text-slate-600 animate-pulse" />
                      <span>Awaiting AI generation...</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
