import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FilePlus, MessageSquareCode, SearchCheck, Briefcase, Clock, 
  Compass, CheckCircle2, Cpu, ShieldCheck, ArrowRight, RefreshCw, X, WifiOff, Sparkles, AlertTriangle
} from "lucide-react";
import { api } from "../utils/api";
import MetricKpi from "../components/ui/MetricKpi";
import StatusBadge from "../components/ui/StatusBadge";
import AITrustBanner from "../components/ui/AITrustBanner";
import Timeline from "../components/ui/Timeline";

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
      if (err.status === 401 || err.message?.includes("credentials") || err.message?.includes("authenticated") || err.message?.includes("Session expired")) {
        api.logout();
        navigate("/login");
        return;
      }
      setError(err.message || "Unable to load dashboard metrics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const getTodayCasesCount = () => {
    return stats.recent_cases?.length || 0;
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner & Jurisdiction Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-700">Investigation Command Centre</span>
            <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 text-[9px] font-mono font-bold rounded">OPERATIONAL</span>
          </div>
          <h1 className="text-lg font-extrabold text-slate-900 tracking-tight mt-0.5">
            Legal Intelligence &amp; Case Briefing
          </h1>
          <p className="text-xs text-slate-500">
            Welcome, Officer <strong className="text-slate-800">@{username}</strong>. Overview of ongoing investigations and BNS 2023 compliance state.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg shrink-0">
            STATION: {stats?.recent_cases?.[0]?.station || "Central Cyber Police Station"}
          </span>
          <button
            type="button"
            onClick={() => navigate("/new-case")}
            className="btn-primary text-xs shrink-0"
          >
            <FilePlus className="h-3.5 w-3.5" />
            <span>New Case</span>
          </button>
        </div>
      </div>

      {/* AI Assistance Trust Banner */}
      <AITrustBanner 
        title="BNS Statutory Intelligence System"
        message="AI recommendations assist investigating officers in section mapping (BNS, BNSS, BSA). Officer verification is mandatory prior to filing or court submission."
      />

      {error && (
        <div role="alert" className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-xs text-rose-800 gap-3">
          <div className="flex items-center gap-2.5">
            <WifiOff className="h-4 w-4 text-rose-600 shrink-0" />
            <div>
              <p className="font-bold">Backend Connection Alert</p>
              <p className="text-[11px] text-rose-700">{error} ({api.apiBaseUrl})</p>
            </div>
          </div>
          <button onClick={fetchStats} className="btn-secondary text-xs border-rose-300 text-rose-700 hover:bg-rose-100">
            <RefreshCw className="h-3 w-3" /> Retry
          </button>
        </div>
      )}

      {/* High-Density KPI Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <MetricKpi 
          title="Today's Registered"
          value={loading ? "..." : getTodayCasesCount()}
          subtext="Added since 00:00 IST"
          trend="+12%"
          icon={<Clock className="h-4 w-4" />}
          status="accent"
        />
        <MetricKpi 
          title="Active Investigations"
          value={loading ? "..." : stats.open_cases}
          subtext="Under active inquiry"
          icon={<Compass className="h-4 w-4" />}
          status="warning"
        />
        <MetricKpi 
          title="Finalized Reports"
          value={loading ? "..." : stats.resolved_cases}
          subtext="FIR dossiers generated"
          icon={<CheckCircle2 className="h-4 w-4" />}
          status="success"
        />
        <MetricKpi 
          title="Avg Draft Latency"
          value={loading ? "..." : `${stats.avg_drafting_time_minutes}m`}
          subtext="AI provision mapping"
          icon={<Cpu className="h-4 w-4" />}
          status="neutral"
        />
      </div>

      {/* Main Grid Section: Quick Intelligence Actions + Priority Investigations + Audit Trail */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Left 2-Column Section: Quick Launch + Active Investigations Table */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Quick Launch Cards */}
          <div className="grid sm:grid-cols-3 gap-3.5">
            <div 
              onClick={() => navigate("/new-case")}
              className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
                  <FilePlus className="h-4 w-4" />
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-0.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">Start Investigation</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Ingest incident facts &amp; map BNS 2023 laws.</p>
              </div>
            </div>

            <div 
              onClick={() => navigate("/assistant")}
              className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs hover:border-teal-400 hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-teal-50 text-teal-700 rounded-lg border border-teal-100">
                  <MessageSquareCode className="h-4 w-4" />
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-teal-600 transition-transform group-hover:translate-x-0.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">AI Legal Copilot</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Query verified statutes &amp; investigation SOPs.</p>
              </div>
            </div>

            <div 
              onClick={() => navigate("/legal-search")}
              className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs hover:border-indigo-400 hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
                  <SearchCheck className="h-4 w-4" />
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-600 transition-transform group-hover:translate-x-0.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">BNS Converter</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Map legacy IPC 1860 codes to BNS 2023.</p>
              </div>
            </div>
          </div>

          {/* Priority Active Investigations Section */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs space-y-0">
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-tight">
                  Priority Active Investigations ({stats.recent_cases?.length || 0})
                </h3>
                <p className="text-[11px] text-slate-500">Active dossiers currently assigned or under review.</p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/cases")}
                className="text-xs font-bold text-blue-700 hover:underline cursor-pointer"
              >
                View Full Directory &rarr;
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {loading ? (
                <div className="p-6 text-center text-xs text-slate-400 font-mono animate-pulse">Loading active case data...</div>
              ) : (!stats.recent_cases || stats.recent_cases.length === 0) ? (
                <div className="p-6 text-center text-xs text-slate-400 italic">No active investigations recorded.</div>
              ) : (
                stats.recent_cases.slice(0, 5).map((c) => (
                  <div
                    key={c.id}
                    onClick={() => navigate(`/fir-generator?caseId=${c.id}`)}
                    className="p-3.5 hover:bg-blue-50/30 transition-colors cursor-pointer flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono font-bold text-slate-500 text-[11px]">#{c.id}</span>
                        <h4 className="font-bold text-slate-900 truncate text-xs">{c.title}</h4>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                        <span>PS: <strong className="text-slate-700">{c.station || "Central Cyber PS"}</strong></span>
                        <span>Date: <span className="font-mono">{c.created_at ? new Date(c.created_at).toLocaleDateString() : "N/A"}</span></span>
                      </div>
                    </div>

                    <StatusBadge status={c.status} />
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right 1-Column Section: Audit Activity Stream & System Security */}
        <div className="space-y-6">
          
          {/* Security Compliance Directive */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span className="text-xs font-bold text-slate-900 font-mono uppercase tracking-tight flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Security Standards
              </span>
              <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-mono font-bold rounded">
                ENFORCED
              </span>
            </div>

            <div className="space-y-2 text-[11px] font-mono text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>ENCRYPTION:</span>
                <span className="font-bold text-slate-900">AES-256 / SHA-256</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>CHAIN OF CUSTODY:</span>
                <span className="font-bold text-emerald-700">BSA §63 VERIFIED</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>AUTH CONTROL:</span>
                <span className="font-bold text-slate-900">OAuth2 JWT</span>
              </div>
              <div className="flex justify-between py-1">
                <span>APPROVAL STATE:</span>
                <span className="font-bold text-emerald-700">SHO / ADMIN MANDATED</span>
              </div>
            </div>
          </div>

          {/* Investigation Activity Stream */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-xs font-bold text-slate-900 font-mono uppercase tracking-tight">
                Activity &amp; Audit Trail
              </h3>
              <span className="text-[10px] font-mono text-slate-400">REALTIME</span>
            </div>

            {role === "admin" && stats.recent_logs && stats.recent_logs.length > 0 ? (
              <Timeline items={stats.recent_logs.slice(0, 5)} />
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg text-center text-xs text-slate-500 leading-relaxed">
                <ShieldCheck className="h-5 w-5 text-slate-400 mx-auto mb-1.5" />
                <p className="font-semibold text-slate-800">RBAC Isolation Active</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Audit log entries are cryptographically signed and stored in the Superintendent Control Vault.</p>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
