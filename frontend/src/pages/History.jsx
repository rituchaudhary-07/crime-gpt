import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, Eye, Filter, Calendar, MapPin, Tag, RefreshCw, FolderSearch,
  MessageSquare, Trash2, Download, Clock, User, ArrowUpDown, FileText, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight, Layers, ExternalLink
} from "lucide-react";
import { api } from "../utils/api";
import Toast from "../components/Toast";

export default function History() {
  const navigate = useNavigate();
  const currentUsername = api.getUsername() || "Officer";

  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [actionTypeFilter, setActionTypeFilter] = useState("all"); // 'all', 'ai_chat', 'case_generation', 'legal_search', 'evidence_upload', 'fir_generation'
  const [sortOrder, setSortOrder] = useState("newest"); // 'newest', 'oldest'

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await api.getHistory(actionTypeFilter, searchQuery);
      setHistoryItems(data);
    } catch (err) {
      setToast({ type: "error", message: "Failed to load history items: " + err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (e, id) => {
    e.stopPropagation();
    try {
      await api.deleteHistoryItem(id);
      setToast({ type: "success", message: "History item deleted successfully." });
      loadHistory();
    } catch (err) {
      setToast({ type: "error", message: "Delete failed: " + err.message });
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to permanently clear all history records?")) return;
    try {
      await api.clearAllHistory();
      setToast({ type: "success", message: "All history records cleared successfully." });
      loadHistory();
    } catch (err) {
      setToast({ type: "error", message: "Clear failed: " + err.message });
    }
  };

  const handleReopenSession = (item) => {
    if (item.action_type === "ai_chat") {
      navigate("/assistant");
    } else if (item.action_type === "case_generation" || item.action_type === "fir_generation") {
      if (item.case_id) {
        navigate(`/fir-generator?caseId=${item.case_id}`);
      } else {
        navigate("/cases");
      }
    } else if (item.action_type === "evidence_upload") {
      if (item.case_id) {
        navigate(`/evidence?caseId=${item.case_id}`);
      } else {
        navigate("/evidence");
      }
    } else if (item.action_type === "legal_search") {
      navigate("/legal-search");
    } else {
      navigate("/dashboard");
    }
  };

  const getActionBadge = (type) => {
    switch (type) {
      case "ai_chat":
        return { label: "AI Chat", color: "bg-blue-50 text-blue-700 border-blue-200" };
      case "case_generation":
        return { label: "Case File", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case "legal_search":
        return { label: "Legal Search", color: "bg-purple-50 text-purple-700 border-purple-200" };
      case "evidence_upload":
        return { label: "Evidence Upload", color: "bg-indigo-50 text-indigo-700 border-indigo-200" };
      case "fir_generation":
        return { label: "FIR Draft", color: "bg-amber-50 text-amber-800 border-amber-200" };
      default:
        return { label: "System Action", color: "bg-slate-100 text-slate-700 border-slate-300" };
    }
  };

  // Filter & Sort
  const filteredItems = historyItems
    .filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        (item.action && item.action.toLowerCase().includes(q)) ||
        (item.case_id && item.case_id.toString().includes(q));

      const matchesType = actionTypeFilter === "all" || item.action_type === actionTypeFilter;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 font-sans select-none pb-12">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <FolderSearch className="h-5 w-5 text-blue-600" />
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Historical Activity & Audit Logs</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review past AI chats, legal searches, case dossiers, and evidence uploads. Click any log entry to reopen the session.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {historyItems.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs cursor-pointer transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="h-4 w-4" />
              <span>Clear All History</span>
            </button>
          )}

          <button
            onClick={loadHistory}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs cursor-pointer shadow-xs flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 text-blue-600 ${loading ? 'animate-spin' : ''}`} />
            <span>Reload Logs</span>
          </button>
        </div>
      </div>

      {/* Search & Action Filter Controls */}
      <div className="flex flex-col md:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search by action title, keyword, or Case ID..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full saas-input pl-9 pr-4 py-2 text-xs"
          />
        </div>

        <select
          value={actionTypeFilter}
          onChange={(e) => { setActionTypeFilter(e.target.value); setCurrentPage(1); }}
          className="saas-input px-3.5 py-2 text-xs font-semibold cursor-pointer"
        >
          <option value="all">All Action Types ({historyItems.length})</option>
          <option value="ai_chat">AI Assistant Chats</option>
          <option value="case_generation">Case Dossier Creation</option>
          <option value="legal_search">Legal Code Searches</option>
          <option value="evidence_upload">Evidence File Uploads</option>
          <option value="fir_generation">FIR Generation Drafts</option>
        </select>

        <button
          onClick={() => setSortOrder(prev => prev === "newest" ? "oldest" : "newest")}
          className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-2 cursor-pointer transition-all shrink-0"
        >
          <ArrowUpDown className="h-3.5 w-3.5 text-blue-600" />
          <span>Sort: {sortOrder === "newest" ? "Newest First" : "Oldest First"}</span>
        </button>

      </div>

      {/* History Items Feed */}
      {loading ? (
        <div className="text-center py-16 text-xs font-mono font-semibold text-slate-500 animate-pulse">
          QUERYING HISTORICAL ACTIVITY LOGS...
        </div>
      ) : paginatedItems.length === 0 ? (
        <div className="bg-white p-16 rounded-2xl border border-slate-200 text-center text-xs text-slate-500 space-y-3">
          <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <MessageSquare className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="font-bold text-slate-900 text-sm">No History Records Found</p>
            <p className="text-slate-500 max-w-sm mx-auto">
              No historical session logs match your query. Perform actions in the portal to populate activity entries.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedItems.map((item) => {
            const badge = getActionBadge(item.action_type);
            return (
              <div 
                key={item.id}
                onClick={() => handleReopenSession(item)}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase font-mono ${badge.color}`}>
                      {badge.label}
                    </span>
                    {item.case_id && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border bg-purple-50 text-purple-700 border-purple-200 font-mono">
                        Case #{item.case_id}
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(item.timestamp).toLocaleString()}</span>
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-slate-900 line-clamp-2 leading-relaxed">
                    {item.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleReopenSession(item); }}
                    className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs cursor-pointer flex items-center gap-1 transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Reopen Session</span>
                  </button>

                  <button
                    onClick={(e) => handleDeleteItem(e, item.id)}
                    className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 cursor-pointer transition-colors"
                    title="Delete log item"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 text-xs font-semibold">
          <span className="text-slate-500 font-mono">
            Showing Page {currentPage} of {totalPages} ({filteredItems.length} total logs)
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className={`p-2 rounded-xl border flex items-center justify-center transition-all ${
                currentPage === 1 ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 cursor-pointer'
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className={`p-2 rounded-xl border flex items-center justify-center transition-all ${
                currentPage === totalPages ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 cursor-pointer'
              }`}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Global Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />

    </div>
  );
}

