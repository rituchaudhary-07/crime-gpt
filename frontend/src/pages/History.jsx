import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Eye, Filter, Calendar, MapPin, Tag, RefreshCw } from "lucide-react";
import { api } from "../utils/api";

export default function History() {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Filtering States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.getCases();
      setCases(data);
    } catch (err) {
      setError("Failed to fetch cases list: " + err.message);
    } finally {
      setLoading(false);
    }
  };

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

  // Filter cases based on inputs
  const filteredCases = cases.filter(item => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.location && item.location.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6 font-sans">
      <div className="flex items-center justify-between border-b border-police-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100">FIR Investigation Archive</h1>
          <p className="text-xs text-slate-400 mt-1">Search, examine, and modify recorded crime entries and legal analysis reports.</p>
        </div>
        <button
          onClick={loadCases}
          disabled={loading}
          className="p-2.5 rounded-xl bg-police-900/40 hover:bg-police-800/60 border border-police-800 text-slate-300 hover:text-white transition-all cursor-pointer"
          title="Refresh table content"
        >
          <RefreshCw className={`h-4.5 w-4.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-400 text-sm">
          {error}
        </div>
      )}

      {/* Control Box: Search & Filters */}
      <div className="grid md:grid-cols-4 gap-4 items-center">
        
        {/* Search Input */}
        <div className="md:col-span-2 relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search by subject, description keywords, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full glass-input pl-10 pr-4 py-2.5 text-xs focus:border-cyan-500"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 pointer-events-none">
            <Filter className="h-4 w-4" />
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full glass-input pl-10 pr-3 py-2.5 text-xs font-bold font-sans cursor-pointer focus:border-cyan-500"
          >
            <option value="all" className="bg-police-900 text-slate-200">ALL STATUSES</option>
            <option value="open" className="bg-police-900 text-sky-400">OPEN FILE</option>
            <option value="under_investigation" className="bg-police-900 text-amber-400">UNDER INVESTIGATION</option>
            <option value="resolved" className="bg-police-900 text-emerald-400">RESOLVED</option>
            <option value="closed" className="bg-police-900 text-slate-400">CLOSED</option>
          </select>
        </div>

        {/* Counter Card */}
        <div className="p-2.5 bg-police-900/30 border border-police-800/40 rounded-xl text-center text-xs font-mono font-semibold text-slate-400">
          FILTERED: <span className="text-cyber-cyan">{filteredCases.length}</span> / {cases.length} FILES
        </div>
      </div>

      {/* Case Table / List Grid */}
      {loading ? (
        <div className="p-12 rounded-2xl glass-panel text-center text-slate-400">Querying database records...</div>
      ) : filteredCases.length === 0 ? (
        <div className="p-12 rounded-2xl glass-panel text-center text-slate-400">
          No records match search queries or filters.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-police-800/40 bg-police-950/20 shadow-glass">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-police-900/50 border-b border-police-800/60 font-mono text-[10px] text-slate-400 tracking-wider">
                <th className="p-4 w-16">FILE ID</th>
                <th className="p-4">SUBJECT / CASE DETAILS</th>
                <th className="p-4">LOCATION</th>
                <th className="p-4 w-36">DATE</th>
                <th className="p-4 w-32 text-center">STATUS</th>
                <th className="p-4 w-28 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-police-900/30 text-xs">
              {filteredCases.map((item) => (
                <tr 
                  key={item.id}
                  className="hover:bg-police-900/20 transition-all font-sans"
                >
                  <td className="p-4 font-mono font-bold text-slate-400">#{item.id}</td>
                  <td className="p-4 space-y-1 max-w-sm">
                    <span className="block font-bold text-slate-100 line-clamp-1">{item.title}</span>
                    <span className="block text-[10px] text-slate-400 line-clamp-1">{item.description}</span>
                  </td>
                  <td className="p-4 font-mono text-slate-300">
                    <span className="flex items-center space-x-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{item.location || "N/A"}</span>
                    </span>
                  </td>
                  <td className="p-4 font-mono text-slate-400">
                    <span className="flex items-center space-x-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <span>{item.date || new Date(item.created_at).toLocaleDateString()}</span>
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border ${getStatusColor(item.status)}`}>
                      {formatStatus(item.status)}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => navigate(`/analyze?caseId=${item.id}`)}
                      className="inline-flex items-center justify-center p-2 rounded-lg bg-police-800 hover:bg-police-700 text-slate-300 hover:text-cyber-cyan border border-police-700/50 transition-colors cursor-pointer"
                      title="Open Analysis Workspace"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
