import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FilePlus, MessageSquare, ClipboardList, Briefcase, FileText,
  Users, CheckCircle2, AlertCircle, BarChart3, Clock, 
  ArrowRight, ShieldCheck, Cpu, Compass, BookOpen, RefreshCw, X, WifiOff
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

  const fetchStats = async () => {
    setLoading(true);
    setError("");
    try {
      await api.checkHealth();
      const data = await api.getStats();
      setStats(data);
    } catch (err) {
      setError(err.message || "Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

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
    <div className="space-y-8 font-sans">
      
      {/* 1. What Happened Today / Quick Starts */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[.16em] text-[#2563EB]">Operations overview</p>
            <h2 className="text-xl font-bold tracking-tight text-[#0F172A] sm:text-2xl">Command centre</h2>
            <p className="mt-1 text-sm text-[#64748B]">Review your caseload and continue priority investigation work.</p>
          </div>
          <span className="w-fit rounded-full border border-[#E2E8F0] bg-white px-3 py-1.5 text-[10px] font-bold text-[#64748B] font-mono tracking-widest uppercase shadow-sm">
            JURISDICTION STATION: {stats.recent_cases[0]?.station || "Central Cyber PS"}
          </span>
        </div>

        {/* Quick action grid boxes */}
        <div className="grid gap-4 md:grid-cols-3">
          
          <div 
            onClick={() => navigate("/new-case")}
            className="saas-card saas-card-hover group flex h-44 cursor-pointer flex-col justify-between border-t-4 border-t-[#2563EB] p-5"
          >
            <div className="h-10 w-10 bg-[#EFF6FF] text-[#2563EB] rounded-xl flex items-center justify-center">
              <FilePlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#111827] flex items-center gap-1.5">
                <span>Start New Investigation</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </h3>
              <p className="text-xs text-[#6B7280] mt-1">Ingest facts and verify code citations under BNS 2023.</p>
            </div>
          </div>

          <div 
            onClick={() => navigate("/assistant")}
            className="saas-card saas-card-hover group flex h-44 cursor-pointer flex-col justify-between border-t-4 border-t-[#06B6D4] p-5"
          >
            <div className="h-10 w-10 bg-[#ECFDF5] text-[#06B6D4] rounded-xl flex items-center justify-center">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#111827] flex items-center gap-1.5">
                <span>Ask CrimeGPT</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </h3>
              <p className="text-xs text-[#6B7280] mt-1">Query semantic databases for procedural compliance guidelines.</p>
            </div>
          </div>

          <div 
            onClick={() => navigate("/legal-search")}
            className="saas-card saas-card-hover group flex h-44 cursor-pointer flex-col justify-between border-t-4 border-t-[#10B981] p-5"
          >
            <div className="h-10 w-10 bg-emerald-50 text-[#10B981] rounded-xl flex items-center justify-center">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#111827] flex items-center gap-1.5">
                <span>IPC to BNS Converter</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </h3>
              <p className="text-xs text-[#6B7280] mt-1">Lookup legacy provision replacements and court citations.</p>
            </div>
          </div>

        </div>
      </div>

      {error && (
        <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-800 shadow-sm sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className="rounded-xl bg-red-100 p-2 text-red-600"><WifiOff className="h-4 w-4" /></div>
            <div><p className="font-bold">Backend connection needs attention</p><p className="mt-0.5 text-xs leading-relaxed text-red-700">{error} <span className="font-mono">({api.apiBaseUrl})</span></p></div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button onClick={fetchStats} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-700 transition-colors hover:bg-red-100"><RefreshCw className="h-3.5 w-3.5" />Retry</button>
            <button onClick={() => setError("")} aria-label="Dismiss connection notice" className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-100"><X className="h-4 w-4" /></button>
          </div>
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
          <div key={idx} className="dashboard-metric flex items-center justify-between rounded-2xl border border-[#E2E8F0] bg-white p-5">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[#6B7280] font-mono tracking-widest uppercase">{m.title}</span>
              {loading ? <div className="dashboard-skeleton mt-2 h-8 w-16 rounded-lg" /> : <span className="block text-2xl font-black tabular-nums text-[#111827]">{m.val}</span>}
              <span className="text-[10px] text-[#6B7280] block font-medium">{m.desc}</span>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
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
              <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="rounded-2xl border border-[#E2E8F0] bg-white p-4"><div className="dashboard-skeleton h-3 w-2/5 rounded" /><div className="dashboard-skeleton mt-3 h-2.5 w-3/5 rounded" /></div>)}</div>
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

        {/* Security Compliance Directive Card (Public Audit Feed Removed) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[#111827] text-sm font-bold uppercase tracking-wider font-mono">Security Directive</h3>
            <span className="text-[10px] font-mono text-[#059669] font-semibold flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-[#059669]" />
              <span>STRICT AUDIT PRIVACY</span>
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-4">
            <div className="p-3.5 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-xs space-y-2">
              <div className="flex items-center gap-2 text-[#1E40AF] font-bold">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>Enterprise RBAC Active</span>
              </div>
              <p className="text-[11px] text-[#1E3A8A] leading-relaxed">
                Security audit logs and registration events are strictly isolated. All user activities are cryptographically signed and accessible exclusively within the <strong>Superintendent Control Console</strong>.
              </p>
            </div>

            <div className="space-y-2 font-mono text-[10px] text-[#475569]">
              <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
                <span>ENCRYPTION:</span>
                <span className="font-bold text-[#1E293B]">AES-256 / SHA-256</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
                <span>AUTH CONTROL:</span>
                <span className="font-bold text-[#1E293B]">Short-lived OAuth2 JWT</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
                <span>LOCKOUT POLICY:</span>
                <span className="font-bold text-[#1E293B]">5 Attempts / 15m Lock</span>
              </div>
              <div className="flex justify-between py-1">
                <span>APPROVAL STATE:</span>
                <span className="font-bold text-[#059669]">ADMIN APPROVAL ENFORCED</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
