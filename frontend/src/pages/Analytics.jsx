import React, { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Activity, Clock, ShieldCheck } from "lucide-react";
import { api } from "../utils/api";
import MetricKpi from "../components/ui/MetricKpi";

export default function Analytics() {
  const [stats, setStats] = useState({
    total_cases: 0,
    open_cases: 0,
    active_cases: 0,
    closed_cases: 0,
    resolved_cases: 0,
    most_cited_sections: [],
    case_categories: [],
    monthly_volume: [],
    avg_drafting_time_minutes: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await api.getStats();
        setStats(data);
      } catch (err) {
        setError("Failed to load analytics metrics from central database.");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const citedMax = stats.most_cited_sections?.length > 0 
    ? Math.max(...stats.most_cited_sections.map(s => s.count)) 
    : 10;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-700 block mb-0.5">Executive &amp; Operational Metrics</span>
          <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">Investigation Analytics &amp; Reports</h1>
          <p className="text-xs text-slate-500">Incident frequency, BNS statutory charge distribution, and drafting efficiency performance.</p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-lg">
          {error}
        </div>
      )}

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <MetricKpi 
          title="Total Logged Dossiers"
          value={loading ? "..." : stats.total_cases}
          subtext="Central database total"
          icon={<Activity className="h-4 w-4" />}
          status="accent"
        />
        <MetricKpi 
          title="Under Investigation"
          value={loading ? "..." : stats.open_cases}
          subtext="Active police inquiries"
          icon={<TrendingUp className="h-4 w-4" />}
          status="warning"
        />
        <MetricKpi 
          title="FIR Draft Speed"
          value={loading ? "..." : `${stats.avg_drafting_time_minutes}m`}
          subtext="AI processing latency"
          icon={<Clock className="h-4 w-4" />}
          status="success"
        />
        <MetricKpi 
          title="Closed Cases"
          value={loading ? "..." : stats.closed_cases}
          subtext="Court finalized dossiers"
          icon={<ShieldCheck className="h-4 w-4" />}
          status="neutral"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Monthly Volume Trend Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-900 font-mono uppercase tracking-tight flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Investigation Registration Trend
            </h3>
            <span className="text-[10px] font-mono text-slate-400">QUARTERLY</span>
          </div>

          {loading ? (
            <div className="h-48 flex items-center justify-center text-xs font-mono text-slate-400 animate-pulse">COMPILING METRICS...</div>
          ) : (
            <div className="space-y-4 pt-2">
              {stats.monthly_volume?.map((m, idx) => (
                <div key={idx} className="space-y-1 text-xs">
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="font-semibold text-slate-700">{m.month} 2026</span>
                    <span className="font-bold text-blue-700">{m.cases} Cases Registered</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: `${Math.min((m.cases / 20) * 100, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* BNS Section Frequency */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-900 font-mono uppercase tracking-tight flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-teal-600" />
              Most Cited BNS 2023 Statutory Sections
            </h3>
            <span className="text-[10px] font-mono text-slate-400">FREQUENCY</span>
          </div>

          {loading ? (
            <div className="h-48 flex items-center justify-center text-xs font-mono text-slate-400 animate-pulse">ANALYZING CITATIONS...</div>
          ) : stats.most_cited_sections?.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-slate-400 italic">No statutory citations cataloged.</div>
          ) : (
            <div className="space-y-3.5 pt-1">
              {stats.most_cited_sections.map((cite, idx) => (
                <div key={idx} className="space-y-1 text-xs">
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="font-bold text-slate-900">{cite.section}</span>
                    <span className="font-bold text-teal-700">{cite.count} FIR Citations</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                    <div className="bg-teal-600 h-full rounded-full" style={{ width: `${(cite.count / (citedMax || 1)) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Case Categories Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-xs font-bold text-slate-900 font-mono uppercase tracking-tight">
            Crime Category Classifications
          </h3>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
          {stats.case_categories.map((cat, idx) => (
            <div key={idx} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
              <span className="block text-[10px] text-slate-500 font-mono font-bold uppercase truncate">{cat.name}</span>
              <span className="text-lg font-extrabold text-slate-900 font-mono block">{cat.value}</span>
              <span className="text-[10px] text-slate-400 block font-medium">Logged Investigations</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
