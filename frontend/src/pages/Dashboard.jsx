import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FilePlus, MessageSquare, ClipboardList, Briefcase, FileText,
  Users, CheckCircle2, AlertCircle, BarChart3, Clock, 
  ArrowRight, ShieldCheck, Cpu, Terminal, Compass, BookOpen
} from "lucide-react";
import { api } from "../utils/api";

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total_cases: 0,
    open_cases: 0,
    active_cases: 0,
    closed_cases: 0,
    resolved_cases: 0,
    recent_cases: [],
    recent_logs: [],
    most_cited_sections: [],
    case_categories: [],
    monthly_volume: [],
    avg_drafting_time_minutes: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const role = api.getUserRole();
  const username = api.getUsername();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.getStats();
        setStats(data);
      } catch (err) {
        setError("Unable to connect to the backend server. Verify uvicorn is running.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case "draft": return "bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]";
      case "under_review": return "bg-[#F3E8FF] text-[#7E22CE] border-[#E9D5FF]";
      case "filed": return "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]";
      case "investigating": return "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]";
      default: return "bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]";
    }
  };

  const getTodayCasesCount = () => {
    // Mock calculating cases registered today
    return stats.recent_cases?.length || 0;
  };

  return (
    <div className="space-y-8 font-sans select-none">
      
      {/* 1. What Happened Today / Quick Starts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[#111827] text-lg font-bold tracking-tight">What happened today?</h2>
            <p className="text-xs text-[#6B7280]">Review operational diagnostics and start automated trial procedures.</p>
          </div>
          <span className="text-[10px] font-bold text-[#6B7280] font-mono tracking-widest uppercase">
            JURISDICTION STATION: {stats.recent_cases[0]?.station || "Central Cyber PS"}
          </span>
        </div>

        {/* Quick action grid boxes */}
        <div className="grid md:grid-cols-3 gap-6">
          
          <div 
            onClick={() => navigate("/new-case")}
            className="saas-card saas-card-hover p-6 flex flex-col justify-between h-44 cursor-pointer border-t-4 border-t-[#2563EB]"
          >
            <div className="h-10 w-10 bg-[#EFF6FF] text-[#2563EB] rounded-xl flex items-center justify-center">
              <FilePlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#111827] flex items-center gap-1.5">
                <span>Start New Investigation</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </h3>
              <p className="text-xs text-[#6B7280] mt-1">Ingest facts and verify code citations under BNS 2023.</p>
            </div>
          </div>

          <div 
            onClick={() => navigate("/assistant")}
            className="saas-card saas-card-hover p-6 flex flex-col justify-between h-44 cursor-pointer border-t-4 border-t-[#06B6D4]"
          >
            <div className="h-10 w-10 bg-[#ECFDF5] text-[#06B6D4] rounded-xl flex items-center justify-center">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#111827] flex items-center gap-1.5">
                <span>Ask CrimeGPT</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </h3>
              <p className="text-xs text-[#6B7280] mt-1">Query semantic databases for procedural compliance guidelines.</p>
            </div>
          </div>

          <div 
            onClick={() => navigate("/legal-search")}
            className="saas-card saas-card-hover p-6 flex flex-col justify-between h-44 cursor-pointer border-t-4 border-t-[#10B981]"
          >
            <div className="h-10 w-10 bg-emerald-50 text-[#10B981] rounded-xl flex items-center justify-center">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#111827] flex items-center gap-1.5">
                <span>IPC to BNS Converter</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </h3>
              <p className="text-xs text-[#6B7280] mt-1">Lookup legacy provision replacements and court citations.</p>
            </div>
          </div>

        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
          <AlertCircle className="h-4.5 w-4.5" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Key Metrics Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { title: "TODAY'S CASES", val: getTodayCasesCount(), desc: "Added since midnight", icon: <Clock className="h-4 w-4 text-[#2563EB]" /> },
          { title: "ACTIVE FILES", val: stats.open_cases, desc: "Awaiting legal signature", icon: <Compass className="h-4 w-4 text-[#B45309]" /> },
          { title: "FILED REPORTS", val: stats.resolved_cases, desc: "Sealed court dossiers", icon: <CheckCircle2 className="h-4 w-4 text-[#047857]" /> },
          { title: "AVERAGE DRAFTING TIME", val: `${stats.avg_drafting_time_minutes}m`, desc: "AI optimization latency", icon: <Cpu className="h-4 w-4 text-[#7E22CE]" /> }
        ].map((m, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[#6B7280] font-mono tracking-widest uppercase">{m.title}</span>
              <span className="text-2xl font-black text-[#111827] block">{loading ? "..." : m.val}</span>
              <span className="text-[10px] text-[#6B7280] block font-medium">{m.desc}</span>
            </div>
            <div className="h-8 w-8 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg flex items-center justify-center">
              {m.icon}
            </div>
          </div>
        ))}
      </div>

      {/* 3. Live Cases & Audit Logs split row */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Recent Cases */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[#111827] text-sm font-bold uppercase tracking-wider font-mono">Recent Investigation entries</h3>
            <button
              onClick={() => navigate("/cases")}
              className="text-xs text-[#2563EB] hover:underline font-semibold"
            >
              View Cases List
            </button>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-10 text-xs text-[#6B7280] font-mono animate-pulse">QUERYING FILES...</div>
            ) : stats.recent_cases.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-[#E2E8F0] text-center text-xs text-[#6B7280] italic">
                No active case logs recorded.
              </div>
            ) : (
              stats.recent_cases.map((c) => (
                <div 
                  key={c.id}
                  onClick={() => navigate(`/fir-generator?caseId=${c.id}`)}
                  className="bg-white p-4.5 rounded-2xl border border-[#E2E8F0] shadow-sm hover:border-[#CBD5E1] transition-all cursor-pointer flex items-center justify-between gap-4"
                >
                  <div className="space-y-1 truncate">
                    <h4 className="text-xs font-bold text-[#111827] truncate">{c.title}</h4>
                    <span className="text-[10px] text-[#6B7280] font-mono block">DATE: {c.date || "N/A"} • PS: {c.station || "Central Cyber Cell"}</span>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase shrink-0 ${getStatusBadge(c.status)}`}>
                    {c.status.replace("_", " ")}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Audit Log timeline terminal */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[#111827] text-sm font-bold uppercase tracking-wider font-mono">System Audit Feed</h3>
            <span className="text-[10px] font-mono text-[#10B981] font-semibold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] animate-ping" />
              <span>LIVE FEED</span>
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm max-h-[300px] overflow-y-auto space-y-4">
            {loading ? (
              <div className="text-center text-xs text-[#6B7280] font-mono py-10 animate-pulse">COMPILING LOGS...</div>
            ) : stats.recent_logs.length === 0 ? (
              <p className="text-center text-[#6B7280] italic text-xs py-4">No audit actions recorded.</p>
            ) : (
              stats.recent_logs.map((log) => (
                <div key={log.id} className="border-b border-[#F1F5F9] pb-3 last:border-0 last:pb-0 space-y-1 text-xs">
                  <div className="flex items-center justify-between text-[#6B7280]">
                    <span className="font-bold text-[#111827]">@{log.user}</span>
                    <span className="text-[9px] font-mono">{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  <span className="block font-mono text-[9px] font-bold text-[#2563EB] uppercase">{log.action}</span>
                  <p className="text-[10px] text-[#4B5563] leading-normal">{log.details}</p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
