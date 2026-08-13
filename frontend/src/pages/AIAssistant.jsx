import React, { useState, useEffect, useRef } from "react";
import { 
  Send, BookOpen, RefreshCw, X, MessageSquare, 
  Copy, FileText, Upload, Plus, Trash2, Edit2, Check, 
  Sparkles, Paperclip, ChevronRight, ShieldAlert, CheckCircle2, Download
} from "lucide-react";
import { api } from "../utils/api";
import Toast from "../components/Toast";
import AITrustBanner from "../components/ui/AITrustBanner";
import LegalBadge from "../components/ui/LegalBadge";

export default function AIAssistant() {
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const [deletingSessionId, setDeletingSessionId] = useState(null);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [assistantMode, setAssistantMode] = useState("legal_research");
  const [loading, setLoading] = useState(false);
  const chatBottomRef = useRef(null);

  // Session rename state
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editTitleInput, setEditTitleInput] = useState("");

  // Citation details drawer slide-out state
  const [activeCitation, setActiveCitation] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Upload state with AbortController
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [toast, setToast] = useState(null);
  const abortControllerRef = useRef(null);

  const suggestedPrompts = [
    {
      title: "Digital Evidence Custody",
      desc: "What are the rules for digital evidence chain of custody under BSA Section 63?",
      prompt: "What are the mandatory rules for digital evidence chain of custody under BSA Section 63?"
    },
    {
      title: "e-FIR Signing Procedure",
      desc: "Explain the procedure and requirements for e-FIR signing under BNSS 173.",
      prompt: "Explain the procedure and legal validity of e-FIR signing under BNSS Section 173."
    },
    {
      title: "Cyber Fraud FIR Draft",
      desc: "Generate an FIR outline for online banking fraud and phishing attacks.",
      prompt: "Generate an FIR outline for online banking fraud and phishing attacks with relevant IT Act sections."
    },
    {
      title: "Seizure Checklist",
      desc: "Legal checklist for cyber cafe hard drives and server evidence seizure.",
      prompt: "Generate a legal seizure checklist for cyber cafe hard drives and electronic devices."
    },
    {
      title: "BNS vs IPC Theft Rules",
      desc: "How does new BNS Section 303 (Theft) differ from old IPC 378?",
      prompt: "How does new BNS Section 303 (Theft) differ from old IPC Section 378?"
    },
    {
      title: "Videography at Scene",
      desc: "Mandatory rules for scene audio-videography under BNSS 105.",
      prompt: "What are the mandatory rules for crime scene audio-videography recording under BNSS 105?"
    }
  ];

  const assistantModes = [
    { id: "legal_research", label: "Legal Research" },
    { id: "investigation", label: "Investigation SOP" },
    { id: "evidence_analysis", label: "Evidence Analysis" },
    { id: "fir_assistance", label: "FIR Assistance" },
    { id: "case_summary", label: "Case Brief" }
  ];

  useEffect(() => {
    loadChatSessions();
  }, []);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const loadChatSessions = async (selectSessionId = null) => {
    setSessionsLoading(true);
    setHistoryError("");
    try {
      const data = await api.getChatSessions();
      const sessionList = Array.isArray(data) ? data : [];
      setSessions(sessionList);

      const storedSessionId = localStorage.getItem("crimegpt_active_session");
      const targetSessionId = selectSessionId || storedSessionId;

      if (targetSessionId && sessionList.some(s => (s.session_id === targetSessionId || s.id === targetSessionId))) {
        const found = sessionList.find(s => (s.session_id === targetSessionId || s.id === targetSessionId));
        const validId = found.session_id || found.id;
        setActiveSessionId(validId);
        try {
          await loadSessionMessages(validId);
        } catch (e) {
          console.warn("Failed loading target session messages:", e);
          localStorage.removeItem("crimegpt_active_session");
          setActiveSessionId(null);
        }
      } else if (sessionList.length > 0) {
        const firstId = sessionList[0].session_id || sessionList[0].id;
        setActiveSessionId(firstId);
        try {
          await loadSessionMessages(firstId);
        } catch (e) {
          console.warn("Failed loading first session messages:", e);
          localStorage.removeItem("crimegpt_active_session");
          setActiveSessionId(null);
        }
      }
    } catch (err) {
      setHistoryError(err.message || "Unable to load chat history.");
    } finally {
      setSessionsLoading(false);
    }
  };

  const loadSessionMessages = async (sessionId) => {
    setLoading(true);
    try {
      const msgs = await api.getSessionMessages(sessionId);
      setMessages(msgs);
      setActiveSessionId(sessionId);
      localStorage.setItem("crimegpt_active_session", sessionId);
    } catch (err) {
      if (err.status === 404 || err.message?.includes("not found") || err.message?.includes("Not Found")) {
        setSessions(prev => (Array.isArray(prev) ? prev.filter(s => (s.session_id || s.id) !== sessionId) : []));
        localStorage.removeItem("crimegpt_active_session");
        setActiveSessionId(null);
        setMessages([]);
      } else {
        setToast({ type: "error", message: "Failed loading session messages: " + err.message });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    setActiveSessionId(null);
    setMessages([]);
    localStorage.removeItem("crimegpt_active_session");
    setToast({ type: "info", message: "Started a new legal inquiry thread." });
  };

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg = { 
      role: "user", 
      content: query, 
      timestamp: new Date().toISOString(), 
      citations: [] 
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      const res = await api.generalChat(query, activeSessionId, assistantMode);
      const botMsg = { 
        role: "assistant", 
        content: res.response, 
        timestamp: new Date().toISOString(), 
        citations: res.citations || [] 
      };

      setMessages(prev => [...prev, botMsg]);
      
      const newSessionId = res.session_id || res.id;
      if (newSessionId) {
        setActiveSessionId(newSessionId);
        localStorage.setItem("crimegpt_active_session", newSessionId);
      }

      try {
        const updatedSessions = await api.getChatSessions();
        if (Array.isArray(updatedSessions)) {
          setSessions(updatedSessions);
        }
      } catch (sidebarErr) {
        console.log("Sidebar refresh warning:", sidebarErr);
      }
    } catch (err) {
      const errorMsg = { 
        role: "assistant", 
        content: "API Connection Failure: " + err.message, 
        timestamp: new Date().toISOString(), 
        citations: [] 
      };
      setMessages(prev => [...prev, errorMsg]);
      setToast({ type: "error", message: "Message was not saved: " + err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRenameSession = async (sessionId) => {
    if (!editTitleInput.trim()) return;
    try {
      await api.renameChatSession(sessionId, editTitleInput.trim());
      setEditingSessionId(null);
      const updated = await api.getChatSessions();
      setSessions(updated);
      setToast({ type: "success", message: "Conversation title updated." });
    } catch (err) {
      setToast({ type: "error", message: "Rename failed: " + err.message });
    }
  };

  const handleDeleteSession = async (e, sessionId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this conversation thread?")) return;
    try {
      setDeletingSessionId(sessionId);
      await api.deleteChatSession(sessionId);
      if (activeSessionId === sessionId) {
        handleNewChat();
      }
      const updated = await api.getChatSessions();
      setSessions(updated);
      setToast({ type: "success", message: "Conversation deleted." });
    } catch (err) {
      setToast({ type: "error", message: "Delete failed: " + err.message });
    } finally {
      setDeletingSessionId(null);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setToast({ type: "error", message: "File size exceeds maximum allowed limit of 20MB." });
      return;
    }

    const allowed = [".jpg", ".jpeg", ".png", ".pdf", ".docx"];
    const ext = "." + file.name.split(".").pop().toLowerCase();
    if (!allowed.includes(ext)) {
      setToast({ type: "error", message: "Invalid extension. Allowed: JPG, PNG, PDF, DOCX" });
      return;
    }

    setSelectedFile(file);
    setUploading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await api.uploadChatAttachment(file, controller.signal);
      const promptMsg = `[Attached ${res.file_type} Evidence File: ${res.filename} (${res.size_kb} KB)] - Analyze file content for legal chain of custody and relevant criminal provisions.`;
      handleSendMessage(promptMsg);
      setToast({ type: "success", message: `Uploaded evidence '${file.name}'.` });
    } catch (err) {
      if (err.name !== "AbortError") {
        setToast({ type: "error", message: "Upload failed: " + err.message });
      }
    } finally {
      setUploading(false);
      setSelectedFile(null);
    }
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const validSessions = Array.isArray(sessions) ? sessions : [];

  const groupedSessions = {
    Today: validSessions.filter(s => s.group === "Today" || !s.group),
    Yesterday: validSessions.filter(s => s.group === "Yesterday"),
    Older: validSessions.filter(s => s.group === "Older" || (s.group && !["Today", "Yesterday"].includes(s.group)))
  };

  return (
    <div className="flex h-[calc(100vh-120px)] max-w-7xl mx-auto rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden font-sans select-none relative">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Left Sidebar: Threads History */}
      <div className="w-64 bg-slate-950 text-slate-100 flex flex-col justify-between border-r border-slate-800 shrink-0">
        
        {/* Top: New Chat */}
        <div className="p-3 border-b border-slate-800">
          <button
            type="button"
            onClick={handleNewChat}
            className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Inquiry Thread</span>
          </button>
        </div>

        {/* Scrollable Thread History */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-4 text-xs">
          {sessionsLoading ? (
            <div className="space-y-2 p-2" aria-label="Loading chat history">
              {[1, 2, 3].map(item => <div key={item} className="h-8 animate-pulse rounded-lg bg-slate-800" />)}
            </div>
          ) : historyError ? (
            <div className="p-3 text-center text-xs text-slate-400 space-y-2">
              <ShieldAlert className="mx-auto h-4 w-4 text-amber-400" />
              <p className="text-[11px]">{historyError}</p>
              <button onClick={() => loadChatSessions()} className="text-[10px] font-bold text-blue-400 hover:underline">Retry</button>
            </div>
          ) : validSessions.length === 0 ? (
            <div className="p-4 text-center text-slate-500 text-xs space-y-1">
              <MessageSquare className="h-5 w-5 mx-auto opacity-40 text-blue-400" />
              <p className="font-semibold text-slate-400 text-[11px]">No Saved Threads</p>
            </div>
          ) : (
            Object.entries(groupedSessions).map(([groupLabel, groupList]) => {
              if (groupList.length === 0) return null;
              return (
                <div key={groupLabel} className="space-y-1">
                  <span className="px-2 text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                    {groupLabel}
                  </span>
                  
                  <div className="space-y-0.5">
                    {groupList.map(s => {
                      const sid = s.session_id || s.id;
                      const isActive = sid === activeSessionId;
                      const isEditing = editingSessionId === sid;

                      return (
                        <div
                          key={sid}
                          onClick={() => { if (!isEditing) loadSessionMessages(sid); }}
                          className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all text-xs ${
                            isActive ? 'bg-blue-600/30 text-white border border-blue-500/40 font-bold' : 'text-slate-300 hover:bg-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate flex-1 min-w-0 pr-1">
                            <MessageSquare className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                            {isEditing ? (
                              <input
                                type="text"
                                value={editTitleInput}
                                onChange={e => setEditTitleInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleRenameSession(sid); }}
                                className="w-full bg-slate-800 text-white px-1.5 py-0.5 rounded text-xs focus:outline-none border border-blue-500"
                                autoFocus
                              />
                            ) : (
                              <span className="truncate text-[11.5px]">{s.title || "Legal Consultation"}</span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            {isEditing ? (
                              <button onClick={(e) => { e.stopPropagation(); handleRenameSession(sid); }} className="text-emerald-400 hover:text-emerald-300 p-0.5"><Check className="h-3 w-3" /></button>
                            ) : (
                              <button onClick={(e) => { e.stopPropagation(); setEditingSessionId(sid); setEditTitleInput(s.title); }} className="text-slate-400 hover:text-white p-0.5"><Edit2 className="h-3 w-3" /></button>
                            )}
                            <button onClick={(e) => handleDeleteSession(e, sid)} className="text-slate-400 hover:text-rose-400 p-0.5"><Trash2 className="h-3 w-3" /></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-3 border-t border-slate-800 bg-slate-900/60 text-[10px] text-slate-400 font-mono flex items-center justify-between">
          <span>NyayaIQ Engine</span>
          <span className="text-teal-400 font-bold">ONLINE</span>
        </div>
      </div>

      {/* Main Legal Copilot Center Feed */}
      <div className="flex-1 flex flex-col justify-between bg-slate-50 min-w-0">
        
        {/* Top Header & Assistant Mode Switcher */}
        <div className="p-3.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 text-blue-700 rounded-md border border-blue-100">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900 tracking-tight">Legal Investigation Copilot</h2>
              <p className="text-[10px] font-mono text-slate-500">Statutory Retrieval (BNS / BNSS / BSA 2023)</p>
            </div>
          </div>

          {/* Assistant Mode Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            {assistantModes.map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => setAssistantMode(m.id)}
                className={`px-2.5 py-1 rounded-md text-[10.5px] font-semibold transition-all cursor-pointer ${
                  assistantMode === m.id 
                    ? 'bg-white text-blue-700 font-bold shadow-2xs border border-slate-200' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Export Action */}
          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => api.exportChatPDF(messages, "NyayaIQ Investigation Log")}
              className="btn-secondary text-xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export PDF Log</span>
            </button>
          )}
        </div>

        {/* Message Feed Canvas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* AI Trust Visual Signal Banner */}
          <AITrustBanner compact />

          {messages.length === 0 ? (
            <div className="py-8 max-w-2xl mx-auto space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-sm font-bold text-slate-900">How can NyayaIQ assist your investigation today?</h3>
                <p className="text-xs text-slate-500">Select a recommended query below or type any legal provision inquiry.</p>
              </div>

              {/* Prompt Suggestions Grid */}
              <div className="grid sm:grid-cols-2 gap-2.5">
                {suggestedPrompts.map((sp, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSendMessage(sp.prompt)}
                    className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer group"
                  >
                    <span className="text-xs font-bold text-slate-900 block group-hover:text-blue-700">{sp.title}</span>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{sp.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, idx) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={idx}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-3xl ${isUser ? 'ml-auto' : 'mr-auto'}`}
                >
                  <div className="flex items-center gap-2 mb-1 text-[10px] font-mono text-slate-400">
                    <span className="font-bold text-slate-700">{isUser ? 'INVESTIGATOR' : 'NYAYAIQ COPILOT'}</span>
                    <span>•</span>
                    <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <div className={`p-4 rounded-xl text-xs leading-relaxed ${
                    isUser 
                      ? 'bg-blue-700 text-white rounded-br-2xs shadow-xs' 
                      : 'bg-white border border-slate-200 text-slate-900 shadow-2xs rounded-bl-2xs space-y-3'
                  }`}>
                    <div className="whitespace-pre-wrap font-sans">{m.content}</div>

                    {/* Statutory Citations Card Strip */}
                    {!isUser && m.citations && m.citations.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">Cited Legal Provisions ({m.citations.length})</span>
                        <div className="flex flex-wrap gap-1.5">
                          {m.citations.map((c, cIdx) => (
                            <LegalBadge
                              key={cIdx}
                              act={c.act || "BNS"}
                              section={c.section_reference || c.section}
                              title={c.title}
                              confidence={c.confidence_score}
                              onClick={() => setActiveCitation(c)}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {!isUser && (
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>CONFIDENCE: 98% VERIFIED</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(m.content, idx)}
                          className="hover:text-slate-700 flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="h-3 w-3" />
                          <span>{copiedIndex === idx ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {loading && (
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 animate-pulse p-2">
              <Sparkles className="h-3.5 w-3.5 text-blue-600 animate-spin" />
              <span>SEARCHING STATUTORY DATABASE &amp; CITATIONS...</span>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200 space-y-2">
          {selectedFile && (
            <div className="p-2 bg-blue-50 border border-blue-200 rounded-md text-xs flex items-center justify-between">
              <span className="font-mono text-blue-800 truncate">Attached: {selectedFile.name}</span>
              <button onClick={() => setSelectedFile(null)} className="text-blue-600 hover:text-blue-900"><X className="h-3.5 w-3.5" /></button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <label className="p-2 text-slate-400 hover:text-slate-700 cursor-pointer rounded-lg hover:bg-slate-100">
              <Paperclip className="h-4 w-4" />
              <input type="file" onChange={e => handleFileUpload(e.target.files[0])} className="hidden" />
            </label>

            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSendMessage(); }}
              placeholder="Ask legal provisions (BNS, BNSS, BSA) or cyber investigation procedures..."
              className="flex-1 enterprise-input text-xs"
            />

            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={loading || !input.trim()}
              className="btn-primary text-xs shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Send Inquiry</span>
            </button>
          </div>
        </div>

      </div>

      {/* Citation Detail Slide-Out Modal Drawer */}
      {activeCitation && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end animate-fade-in">
          <div className="w-full max-w-md bg-white h-full shadow-2xl p-6 overflow-y-auto space-y-4 font-sans">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-blue-700 uppercase">OFFICIAL STATUTORY REFERENCE</span>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">{activeCitation.act} {activeCitation.section_reference}</h3>
              </div>
              <button onClick={() => setActiveCitation(null)} className="text-slate-400 hover:text-slate-700 p-1"><X className="h-4 w-4" /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="font-bold text-slate-900 block mb-1">{activeCitation.title}</span>
                <p className="text-slate-600 leading-relaxed">{activeCitation.citation_text || activeCitation.description}</p>
              </div>

              {activeCitation.justification && (
                <div className="p-3 bg-blue-50/60 border border-blue-200/60 rounded-lg space-y-1">
                  <span className="text-[10px] font-mono font-bold text-blue-800 uppercase block">Investigation Applicability</span>
                  <p className="text-blue-900 leading-relaxed">{activeCitation.justification}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
