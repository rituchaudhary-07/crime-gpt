import React, { useState, useEffect } from "react";
import { MessageSquare, Search, BookOpen, Calendar, Clock, AlertCircle, Cpu } from "lucide-react";
import { api } from "../utils/api";

export default function ChatHistory() {
  const [activeTab, setActiveTab] = useState("general_assistant");
  const [searchQuery, setSearchQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadHistory();
  }, [activeTab]);

  const loadHistory = async () => {
    setLoading(true);
    setError("");
    try {
      const history = await api.getChatHistory(null, activeTab);
      setMessages(history);
    } catch (err) {
      setError("Failed to load conversation history: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredMessages = messages.filter((msg) => {
    return msg.content.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans select-none">
      
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[#111827]">Secure Chat Transcript Archive</h1>
        <p className="text-xs text-[#6B7280] mt-1">Search and review past conversational logs and guidance sessions.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E2E8F0] shrink-0 bg-white rounded-2xl p-1 border shadow-sm">
        <button
          onClick={() => setActiveTab("general_assistant")}
          className={`flex-1 py-3 text-xs font-bold transition-all rounded-xl cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === "general_assistant" 
              ? "bg-[#EFF6FF] text-[#2563EB]" 
              : "text-[#6B7280] hover:text-[#111827]"
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          <span>General Assistant Chat Logs</span>
        </button>
        <button
          onClick={() => setActiveTab("sop_guidance")}
          className={`flex-1 py-3 text-xs font-bold transition-all rounded-xl cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === "sop_guidance" 
              ? "bg-[#EFF6FF] text-[#2563EB]" 
              : "text-[#6B7280] hover:text-[#111827]"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>SOP Guidance Chat Logs</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-650 text-xs">
          {error}
        </div>
      )}

      {/* Search Input bar */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#9CA3AF] pointer-events-none">
          <Search className="h-4 w-4" />
        </span>
        <input
          type="text"
          placeholder="Filter logs by keywords..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full saas-input pl-10 pr-4 py-2.5"
        />
      </div>

      {/* Chat Logs List */}
      {loading ? (
        <div className="text-center py-16 text-xs text-[#6B7280] font-mono animate-pulse">QUERYING CACHED TRANSCRIPTS...</div>
      ) : filteredMessages.length === 0 ? (
        <div className="bg-white p-16 rounded-2xl border border-[#E2E8F0] text-center text-xs text-[#6B7280] italic shadow-sm">
          No records match search queries.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMessages.map((msg) => (
            <div 
              key={msg.id}
              className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm flex items-start gap-4"
            >
              <div className={`p-2.5 rounded-xl border shrink-0 ${
                msg.role === "user" ? "bg-[#F8FAFC] border-[#E2E8F0] text-[#6B7280]" : "bg-[#EFF6FF] border-[#BFDBFE] text-[#2563EB]"
              }`}>
                {msg.role === "user" ? <MessageSquare className="h-4 w-4" /> : <Cpu className="h-4 w-4" />}
              </div>
              
              <div className="space-y-2 flex-1 text-xs">
                <div className="flex items-center justify-between text-[9px] font-mono text-[#6B7280]">
                  <span className="font-bold uppercase tracking-wider">
                    {msg.role === "user" ? "USER INQUIRY" : "AI RESPONSE"}
                  </span>
                  <span className="flex items-center gap-1 font-semibold">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{new Date(msg.timestamp).toLocaleString()}</span>
                  </span>
                </div>
                
                <p className="text-xs text-[#374151] leading-relaxed font-sans font-medium">{msg.content}</p>
                
                {msg.citations && msg.citations.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {msg.citations.map((c, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-[#6B7280] text-[9px] font-mono">
                        {c.section_reference || c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
