import React, { useState, useEffect } from "react";
import { BarChart3, TrendingUp, ShieldCheck, Activity, Calendar, Clock, Database } from "lucide-react";
import { api } from "../utils/api";

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

  const monthlyMax = stats.monthly_volume?.length > 0 
    ? Math.max(...stats.monthly_volume.map(m => m.cases)) 
    : 10;
  const citedMax = stats.most_cited_sections?.length > 0 
    ? Math.max(...stats.most_cited_sections.map(s => s.count)) 
    : 10;

  return (
    <div className="space-y-8 font-sans select-none max-w-7xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[#111827]">Case Analytics & Metrics</h1>
        <p className="text-xs text-[#6B7280] mt-1">Aggregated statistics indicating incident volume trends, legal charge distribution, and drafting efficiency.</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-650 text-xs">
          {error}
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { title: "DATABASE RECORDS", val: stats.total_cases, desc: "Total case entries logged", bg: "bg-white text-[#2563EB]" },
          { title: "PENDING REVIEW", val: stats.open_cases, desc: "Awaiting final sign-off", bg: "bg-white text-[#B45309]" },
          { title: "AVERAGE DRAFT SPEED", val: `${stats.avg_drafting_time_minutes} min`, desc: "AI-assisted processing", bg: "bg-white text-[#7E22CE]" },
          { title: "CLOSED DOSSIERS", val: stats.closed_cases, desc: "Investigations completed", bg: "bg-white text-[#374151]" }
        ].map((m, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col justify-between h-32">
            <span className="block text-[10px] font-bold text-[#6B7280] tracking-widest font-mono uppercase">{m.title}</span>
            <div>
              <span className={`text-2xl font-black ${m.bg.split(" ")[1]}`}>{loading ? "..." : m.val}</span>
              <span className="block text-[10px] text-[#6B7280] mt-1 font-medium">{m.desc}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid md:grid-cols-2 gap-8">
        
        {/* Line Chart */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm flex flex-col space-y-6">
          <div className="flex items-center gap-2 text-[#111827] border-b border-[#F1F5F9] pb-3">
            <TrendingUp className="h-4.5 w-4.5 text-[#2563EB]" />
            <h3 className="text-xs font-bold tracking-wide uppercase font-mono">Case Registration volume</h3>
          </div>
          {loading ? (
            <div className="h-64 flex items-center justify-center text-xs text-[#6B7280] font-mono animate-pulse">COMPILING DATA...</div>
          ) : (
            <div className="relative w-full h-64 flex flex-col justify-end pt-4">
              <svg className="w-full h-56 overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Grids */}
                <line x1="0" y1="20" x2="100" y2="20" stroke="#F1F5F9" strokeWidth="0.8" />
                <line x1="0" y1="50" x2="100" y2="50" stroke="#F1F5F9" strokeWidth="0.8" />
                <line x1="0" y1="80" x2="100" y2="80" stroke="#F1F5F9" strokeWidth="0.8" />
                
                {/* Trend line */}
                <path
                  d={`M 10 ${100 - (stats.monthly_volume[0]?.cases / (monthlyMax || 1)) * 80} 
                     L 50 ${100 - (stats.monthly_volume[1]?.cases / (monthlyMax || 1)) * 80} 
                     L 90 ${100 - (stats.monthly_volume[2]?.cases / (monthlyMax || 1)) * 80}`}
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Circles */}
                <circle cx="10" cy={100 - (stats.monthly_volume[0]?.cases / (monthlyMax || 1)) * 80} r="4" fill="#2563EB" />
                <circle cx="50" cy={100 - (stats.monthly_volume[1]?.cases / (monthlyMax || 1)) * 80} r="4" fill="#2563EB" />
                <circle cx="90" cy={100 - (stats.monthly_volume[2]?.cases / (monthlyMax || 1)) * 80} r="4" fill="#2563EB" />
              </svg>
              {/* X Axis Labels */}
              <div className="flex justify-between px-2 pt-3 text-[10px] font-mono text-[#6B7280]">
                <span>{stats.monthly_volume[0]?.month || "May"} ({stats.monthly_volume[0]?.cases} Cases)</span>
                <span>{stats.monthly_volume[1]?.month || "Jun"} ({stats.monthly_volume[1]?.cases} Cases)</span>
                <span>{stats.monthly_volume[2]?.month || "Jul"} ({stats.monthly_volume[2]?.cases} Cases)</span>
              </div>
            </div>
          )}
        </div>

        {/* Bar Chart */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm flex flex-col space-y-6">
          <div className="flex items-center gap-2 text-[#111827] border-b border-[#F1F5F9] pb-3">
            <BarChart3 className="h-4.5 w-4.5 text-[#06B6D4]" />
            <h3 className="text-xs font-bold tracking-wide uppercase font-mono">BNS Sections Cited Counts</h3>
          </div>
          {loading ? (
            <div className="h-64 flex items-center justify-center text-xs text-[#6B7280] font-mono animate-pulse">RETRIEVING INDICES...</div>
          ) : stats.most_cited_sections?.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-[#6B7280] italic">No citations cataloged.</div>
          ) : (
            <div className="space-y-4 pt-2">
              {stats.most_cited_sections.map((cite, i) => (
                <div key={i} className="space-y-1.5 text-xs">
                  <div className="flex justify-between font-mono">
                    <span className="font-bold text-[#374151]">{cite.section}</span>
                    <span className="text-[#2563EB] font-bold">{cite.count} Citations</span>
                  </div>
                  <div className="w-full bg-[#F8FAFC] rounded-full h-3 border border-[#E2E8F0] overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-[#2563EB] to-[#06B6D4] h-full rounded-full transition-all duration-500" 
                      style={{ width: `${(cite.count / (citedMax || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Categories summary block */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-[#111827] border-b border-[#F1F5F9] pb-3">
          <Activity className="h-4.5 w-4.5 text-[#10B981]" />
          <h3 className="text-xs font-bold tracking-wide uppercase font-mono">Crime Category Classifications</h3>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-5 gap-4">
          {stats.case_categories.map((cat, i) => (
            <div key={i} className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-1">
              <span className="block text-[10px] text-[#6B7280] font-mono font-bold uppercase">{cat.name}</span>
              <span className="text-xl font-black text-[#111827] block">{cat.value}</span>
              <span className="text-[9px] text-[#6B7280] block font-semibold">Registered Dossiers</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
