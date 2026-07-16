import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FileText, ShieldAlert, CheckCircle, Database, 
  FolderPlus, History, Settings, ShieldAlert as AdminIcon,
  Plus, ArrowRight, Eye, Calendar, MapPin
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
    recent_logs: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const role = api.getUserRole();
  const username = api.getUsername();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await api.getStats();
        setStats(data);
      } catch (err) {
        setError("Failed to fetch dashboard metrics. Is the backend running?");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "open": return "bg-sky-950 border-sky-500/30 text-sky-400";
      case "under_investigation": return "bg-amber-950 border-amber-500/30 text-amber-400";
      case "resolved": return "bg-emerald-950 border-emerald-500/30 text-emerald-400";
      case "closed": return "bg-slate-800 border-slate-700 text-slate-400";
      default: return "bg-police-800 text-slate-300";
    }
  };

  const formatStatus = (status) => {
    return status ? status.replace("_", " ").toUpperCase() : "N/A";
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8 font-sans">
      
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl glass-panel border-glass-inset shadow-glass bg-gradient-to-r from-police-900/60 to-police-950/30">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">
            Welcome back, <span className="text-cyber-cyan">{username}</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Logged into terminal as <span className="text-cyan-400/80 font-mono uppercase">{role === "admin" ? "Superintendent / Admin" : "Investigating Officer"}</span>. Ready for case logging and BNS alignment.
          </p>
        </div>
        <button
          onClick={() => navigate("/analyze")}
          className="flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-gradient-to-r from-police-600 to-cyber-cyan text-white font-bold text-sm hover:shadow-cyber-glow transition-all duration-300 transform hover:scale-[1.02] cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>New Case Entry</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-400 text-sm">
          {error}
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Cases */}
        <div className="p-5 rounded-2xl glass-panel border-glass-inset shadow-glass flex items-start space-x-4">
          <div className="p-3 bg-blue-950/80 border border-blue-500/20 text-blue-400 rounded-xl">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-xs font-medium text-slate-400 font-mono">TOTAL FILES</span>
            <span className="text-2xl md:text-3xl font-black text-white">{loading ? "..." : stats.total_cases}</span>
          </div>
        </div>

        {/* Active Investigations */}
        <div className="p-5 rounded-2xl glass-panel border-glass-inset shadow-glass flex items-start space-x-4">
          <div className="p-3 bg-amber-950/80 border border-amber-500/20 text-amber-400 rounded-xl">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-xs font-medium text-slate-400 font-mono">UNDER INVESTIGATION</span>
            <span className="text-2xl md:text-3xl font-black text-white">{loading ? "..." : stats.active_cases + stats.open_cases}</span>
          </div>
        </div>

        {/* Resolved Cases */}
        <div className="p-5 rounded-2xl glass-panel border-glass-inset shadow-glass flex items-start space-x-4">
          <div className="p-3 bg-emerald-950/80 border border-emerald-500/20 text-emerald-400 rounded-xl">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-xs font-medium text-slate-400 font-mono">RESOLVED CASES</span>
            <span className="text-2xl md:text-3xl font-black text-white">{loading ? "..." : stats.resolved_cases}</span>
          </div>
        </div>

        {/* Closed Cases */}
        <div className="p-5 rounded-2xl glass-panel border-glass-inset shadow-glass flex items-start space-x-4">
          <div className="p-3 bg-slate-900 border border-slate-700/30 text-slate-400 rounded-xl">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-xs font-medium text-slate-400 font-mono">CLOSED FILE ARCHIVE</span>
            <span className="text-2xl md:text-3xl font-black text-white">{loading ? "..." : stats.closed_cases}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Section (Recent Cases), Right Section (Action Panel + Audit) */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Recent Cases */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Recent Cases Dashboard</h2>
            <button 
              onClick={() => navigate("/history")} 
              className="text-xs text-cyber-cyan hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <span>View History Archive</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="p-8 rounded-2xl glass-panel text-center text-slate-400">Loading cases...</div>
            ) : stats.recent_cases.length === 0 ? (
              <div className="p-8 rounded-2xl glass-panel text-center text-slate-400 space-y-3">
                <p>No cases registered in local database yet.</p>
                <button
                  onClick={() => navigate("/analyze")}
                  className="px-4 py-2 bg-police-800 hover:bg-police-700 text-cyber-cyan border border-cyber-cyan/30 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Create Your First Case File
                </button>
              </div>
            ) : (
              stats.recent_cases.map((caseItem) => (
                <div 
                  key={caseItem.id}
                  className="p-5 rounded-2xl glass-panel border-glass-inset shadow-glass hover:bg-police-900/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2.5">
                      <h3 className="text-base font-extrabold text-slate-100">{caseItem.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${getStatusColor(caseItem.status)}`}>
                        {formatStatus(caseItem.status)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400 font-mono">
                      <span className="flex items-center space-x-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-500" />
                        <span>Created: {new Date(caseItem.created_at).toLocaleDateString()}</span>
                      </span>
                      <span>Case ID: #{caseItem.id}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/analyze?caseId=${caseItem.id}`)}
                    className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg bg-police-850 hover:bg-police-800 border border-police-700/50 text-slate-200 hover:text-cyber-cyan text-xs font-bold transition-all cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>View Analysis</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right 1 Col: Quick Links + Audit Trail */}
        <div className="space-y-6">
          
          {/* Quick Actions Portal */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-white">System Portals</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate("/analyze")}
                className="p-4 rounded-xl glass-panel border-glass-inset text-left hover:bg-police-800/20 border hover:border-cyber-cyan/30 group transition-all cursor-pointer"
              >
                <FolderPlus className="h-5 w-5 text-cyber-cyan mb-2 group-hover:scale-110 transition-transform" />
                <span className="block text-xs font-bold text-white">Case Entry</span>
                <span className="text-[9px] text-slate-400">Launch AI RAG</span>
              </button>

              <button
                onClick={() => navigate("/history")}
                className="p-4 rounded-xl glass-panel border-glass-inset text-left hover:bg-police-800/20 border hover:border-cyber-cyan/30 group transition-all cursor-pointer"
              >
                <History className="h-5 w-5 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                <span className="block text-xs font-bold text-white">Archive</span>
                <span className="text-[9px] text-slate-400">Search FIR logs</span>
              </button>

              <button
                onClick={() => navigate("/settings")}
                className="p-4 rounded-xl glass-panel border-glass-inset text-left hover:bg-police-800/20 border hover:border-cyber-cyan/30 group transition-all cursor-pointer"
              >
                <Settings className="h-5 w-5 text-slate-400 mb-2 group-hover:scale-110 transition-transform" />
                <span className="block text-xs font-bold text-white">Settings</span>
                <span className="text-[9px] text-slate-400">API Key status</span>
              </button>

              <button
                onClick={() => navigate(role === "admin" ? "/admin" : "/settings")}
                className="p-4 rounded-xl glass-panel border-glass-inset text-left hover:bg-police-800/20 border hover:border-cyber-cyan/30 group transition-all cursor-pointer"
              >
                <AdminIcon className="h-5 w-5 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
                <span className="block text-xs font-bold text-white">Security</span>
                <span className="text-[9px] text-slate-400">{role === "admin" ? "Audit Admin" : "Officer Config"}</span>
              </button>
            </div>
          </div>

          {/* Audit Activity mock logs (mini card) */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-white">Live System Logs</h2>
            <div className="p-4 rounded-2xl glass-panel border-glass-inset shadow-glass space-y-3 font-mono text-[10px]">
              {loading ? (
                <div className="text-center text-slate-500 py-3">Fetching logs...</div>
              ) : stats.recent_logs.length === 0 ? (
                <div className="text-center text-slate-500 py-3">No activity logs recorded.</div>
              ) : (
                stats.recent_logs.map((log) => (
                  <div key={log.id} className="border-b border-police-800/40 pb-2.5 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="text-cyan-400">{log.user}</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <span className="block text-slate-200 uppercase font-semibold">{log.action}</span>
                    <span className="block text-slate-400 leading-normal">{log.details}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
