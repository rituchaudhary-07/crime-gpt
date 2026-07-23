import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, Eye, Filter, Calendar, MapPin, Tag, RefreshCw, FolderSearch,
  MessageSquare, Trash2, Download, Clock, User, ArrowUpDown, FileText, CheckCircle2, AlertCircle
} from "lucide-react";
import { api } from "../utils/api";

export default function History() {
  const navigate = useNavigate();
  const currentUsername = api.getUsername() || "Officer";

  const [activeTab, setActiveTab] = useState("chats"); // 'chats' or 'cases'
  const [chats, setChats] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all"); // 'all', 'general_assistant', 'sop'
  const [sortOrder, setSortOrder] = useState("newest"); // 'newest', 'oldest'

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      if (activeTab === "chats") {
        const data = await api.getChatHistory(null, "general_assistant");
        setChats(data);
      } else {
        const data = await api.getCases();
        setCases(data);
      }
    } catch (err) {
      setError("Failed to load historical archives: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChat = async (chatId) => {
    if (!window.confirm("Are you sure you want to delete this chat transcript entry?")) return;
    setError("");
    setSuccessMsg("");
    try {
      await api.deleteChatHistory(chatId);
      setSuccessMsg("Chat entry deleted successfully.");
      loadData();
    } catch (err) {
      setError("Delete failed: " + err.message);
    }
  };

  const handleExportPDF = (chat) => {
    const formattedMessages = [
      { role: "user", content: chat.user_message, timestamp: new Date(chat.created_at).toLocaleString() },
      { role: "assistant", content: chat.bot_response, timestamp: new Date(chat.created_at).toLocaleString() }
    ];
    api.exportChatPDF(formattedMessages, chat.case_id ? `Case #${chat.case_id}` : "General Legal Consultation");
  };

  // Filter and Sort Chat Sessions
  const filteredChats = chats
    .filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        c.user_message.toLowerCase().includes(q) ||
        (c.bot_response && c.bot_response.toLowerCase().includes(q)) ||
        (c.case_id && c.case_id.toString().includes(q));
      
      const matchesType = typeFilter === "all" || c.message_type === typeFilter;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

  // Filter and Sort Cases
  const filteredCases = cases
    .filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      return (
        !q ||
        c.id.toString().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        (c.location && c.location.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

  return (
    <div className="space-y-6 font-sans select-none pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <FolderSearch className="h-5 w-5 text-[#2563EB]" />
            <h1 className="text-xl font-bold tracking-tight text-[#111827]">Historical Investigation Archives</h1>
          </div>
          <p className="text-xs text-[#6B7280] mt-1">Review legal Q&A transcripts, case dossier archives, and audit history logs.</p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="saas-card saas-card-hover px-4 py-2.5 flex items-center gap-2 text-xs font-semibold text-[#1E293B] cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 text-[#2563EB] ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Archive Feeds</span>
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Archive Category Tabs */}
      <div className="flex border-b border-[#E2E8F0] space-x-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("chats")}
          className={`pb-3.5 flex items-center gap-2 cursor-pointer transition-all ${activeTab === 'chats' ? 'border-b-2 border-[#2563EB] text-[#2563EB]' : 'text-[#64748B] hover:text-[#1E293B]'}`}
        >
          <MessageSquare className="h-4 w-4" />
          <span>AI Legal Assistance Chat History ({chats.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("cases")}
          className={`pb-3.5 flex items-center gap-2 cursor-pointer transition-all ${activeTab === 'cases' ? 'border-b-2 border-[#2563EB] text-[#2563EB]' : 'text-[#64748B] hover:text-[#1E293B]'}`}
        >
          <FileText className="h-4 w-4" />
          <span>Case Investigation Archives ({cases.length})</span>
        </button>
      </div>

      {/* Control Bar: Search, Filters & Sorting */}
      <div className="flex flex-col md:flex-row gap-3 bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-sm">
        
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#9CA3AF]">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder={activeTab === "chats" ? "Search chat messages, questions, responses, or Case ID..." : "Search case titles, numbers, locations..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full saas-input pl-9 pr-4 py-2 text-xs"
          />
        </div>

        {activeTab === "chats" && (
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="saas-input px-3.5 py-2 text-xs font-semibold cursor-pointer"
          >
            <option value="all">All Chat Types</option>
            <option value="general_assistant">General Legal Q&A</option>
            <option value="sop">Case SOP Guidance</option>
          </select>
        )}

        <button
          onClick={() => setSortOrder(prev => prev === "newest" ? "oldest" : "newest")}
          className="px-3.5 py-2 rounded-xl border border-[#E2E8F0] hover:bg-[#F8FAFC] text-xs font-semibold text-[#475569] flex items-center gap-2 cursor-pointer transition-all shrink-0"
        >
          <ArrowUpDown className="h-3.5 w-3.5 text-[#2563EB]" />
          <span>Sort: {sortOrder === "newest" ? "Newest First" : "Oldest First"}</span>
        </button>

      </div>

      {/* TAB 1: CHAT HISTORY */}
      {activeTab === "chats" && (
        <>
          {loading ? (
            <div className="text-center py-16 text-xs font-semibold text-[#6B7280] animate-pulse">LOADING CHAT TRANSCRIPTS...</div>
          ) : filteredChats.length === 0 ? (
            <div className="bg-white p-16 rounded-2xl border border-[#E2E8F0] text-center text-xs text-[#6B7280] space-y-3">
              <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-slate-900 text-sm">No Saved Conversation History</p>
                <p className="text-slate-500 max-w-sm mx-auto">
                  You have not performed any AI assistant inquiries yet matching your query. Ask questions in the AI Assistant module to start logging transcripts.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredChats.map((chat) => (
                <div key={chat.id} className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm hover:border-[#CBD5E1] transition-all space-y-4">
                  
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F1F5F9] pb-3 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[#111827] flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-[#2563EB]" />
                        <span>Officer: @{currentUsername}</span>
                      </span>
                      <span className="text-[#94A3B8]">•</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE] uppercase font-mono">
                        {chat.message_type === 'sop' ? 'SOP Guidance' : 'General Legal Q&A'}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-slate-100 text-slate-700 border-slate-300 font-mono">
                        Messages: 2
                      </span>
                      {chat.case_id && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-[#F5F3FF] text-[#7C3AED] border-[#DDD6FE] font-mono">
                          Case Number #{chat.case_id}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-mono text-[#64748B]">
                      <Clock className="h-3.5 w-3.5 text-[#9CA3AF]" />
                      <span>{new Date(chat.created_at).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Message Content */}
                  <div className="space-y-2 text-xs">
                    <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                      <span className="text-[10px] font-mono font-bold text-[#475569] uppercase block">OFFICER QUERY:</span>
                      <p className="font-medium text-[#1E293B] leading-relaxed">{chat.user_message}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#EFF6FF]/60 border border-[#BFDBFE]/60 space-y-1">
                      <span className="text-[10px] font-mono font-bold text-[#1E40AF] uppercase block">CRIMEGPT LEGAL INTELLIGENCE RESPONSE:</span>
                      <p className="text-[#1E3A8A] leading-relaxed line-clamp-3 whitespace-pre-wrap">{chat.bot_response}</p>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#F1F5F9]">
                    <span className="text-[10px] font-mono text-[#94A3B8]">TRANSCRIPT ID: #{chat.id}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleExportPDF(chat)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer flex items-center gap-1.5 transition-all shadow-xs"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Export PDF</span>
                      </button>
                      <button
                        onClick={() => handleExportChat(chat)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-[#CBD5E1] text-[#334155] hover:bg-[#F8FAFC] font-semibold text-xs cursor-pointer flex items-center gap-1.5 transition-all shadow-xs"
                      >
                        <Download className="h-3.5 w-3.5 text-[#2563EB]" />
                        <span>Export TXT</span>
                      </button>
                      <button
                        onClick={() => handleDeleteChat(chat.id)}
                        className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 cursor-pointer transition-all"
                        title="Delete chat log entry"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* TAB 2: CASE INVESTIGATION ARCHIVES */}
      {activeTab === "cases" && (
        <>
          {loading ? (
            <div className="text-center py-16 text-xs font-semibold text-[#6B7280] animate-pulse">LOADING CASE DOSSIERS...</div>
          ) : filteredCases.length === 0 ? (
            <div className="bg-white p-16 rounded-2xl border border-[#E2E8F0] text-center text-xs text-[#6B7280] italic">
              No archived investigation dossiers match current filters.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCases.map((c) => (
                <div 
                  key={c.id}
                  onClick={() => navigate(`/fir-generator?caseId=${c.id}`)}
                  className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2">
                      <span className="text-[10px] font-mono font-bold text-[#6B7280]">CASE ID: #{c.id}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]">
                        {c.status || 'ARCHIVED'}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-[#111827] line-clamp-1">{c.title}</h3>
                    <div className="space-y-1 text-[10px] text-[#6B7280]">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-[#9CA3AF]" />
                        <span>Date: {c.date || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-[#9CA3AF]" />
                        <span className="truncate">Location: {c.location || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-[#F1F5F9] pt-4 mt-4 text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/fir-generator?caseId=${c.id}`); }}
                      className="text-xs font-bold text-[#2563EB] hover:underline"
                    >
                      View Full Dossier &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

    </div>
  );
}

