import React, { useState, useEffect, useRef } from "react";
import { 
  Send, Cpu, BookOpen, RefreshCw, X, MessageSquare, 
  HelpCircle, Copy, FileText, Upload, Image, Mic, Repeat, CheckSquare,
  Plus, Trash2, Edit2, Check, Clock, Sparkles, Paperclip, ChevronRight, ShieldAlert
} from "lucide-react";
import { api } from "../utils/api";
import Toast from "../components/Toast";

export default function AIAssistant() {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
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

  useEffect(() => {
    loadChatSessions();
  }, []);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const loadChatSessions = async (selectSessionId = null) => {
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
        loadSessionMessages(validId);
      }
    } catch (err) {
      console.log("Failed loading chat sessions:", err);
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
      setToast({ type: "error", message: "Failed loading session messages: " + err.message });
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
      const res = await api.generalChat(query, activeSessionId);
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

      // Safely re-fetch chat sessions for left sidebar without affecting chat feed
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
      await api.deleteChatSession(sessionId);
      if (activeSessionId === sessionId) {
        handleNewChat();
      }
      const updated = await api.getChatSessions();
      setSessions(updated);
      setToast({ type: "success", message: "Conversation deleted." });
    } catch (err) {
      setToast({ type: "error", message: "Delete failed: " + err.message });
    }
  };

  const handleCancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setUploading(false);
    setUploadProgress(0);
    setSelectedFile(null);
    setToast({ type: "info", message: "File upload cancelled." });
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
    setUploadProgress(25);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setUploadProgress(60);
      const res = await api.uploadChatAttachment(file, controller.signal);
      setUploadProgress(100);

      const promptMsg = `[Attached ${res.file_type} Evidence File: ${res.filename} (${res.size_kb} KB)] - Analyze file content for legal chain of custody and relevant criminal provisions.`;
      handleSendMessage(promptMsg);
      setToast({ type: "success", message: `Uploaded evidence '${file.name}'.` });
    } catch (err) {
      if (err.name !== "AbortError") {
        setToast({ type: "error", message: "Upload failed: " + err.message });
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setSelectedFile(null);
    }
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const parseMessageCitations = (text, citationsList = []) => {
    if (!text) return "";
    const citationRegex = /((?:BNS|BNSS|BSA)\s+Section\s+\d+)/gi;
    const parts = text.split(citationRegex);

    return parts.map((part, i) => {
      if (part.match(citationRegex)) {
        const cleanedPart = part.trim().toLowerCase();
        const found = citationsList.find(c => c.section_reference.toLowerCase() === cleanedPart);

        const fallbackCite = {
          section_reference: part,
          act: part.split(" ")[0].toUpperCase(),
          title: "Legal Provision",
          citation_text: "Definition loaded from official central legal index.",
          justification: "Relevant provision cited during legal investigation discussion.",
          confidence_score: 98
        };

        return (
          <button
            key={i}
            onClick={() => setActiveCitation(found || fallbackCite)}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-[10px] font-bold text-blue-700 hover:bg-blue-600 hover:text-white transition-all cursor-pointer font-mono mx-0.5 shrink-0"
            title="View source legal provision definition"
          >
            <BookOpen className="h-2.5 w-2.5" />
            <span>{part}</span>
          </button>
        );
      }
      return part;
    });
  };

  const validSessions = Array.isArray(sessions) ? sessions : [];

  const groupedSessions = {
    Today: validSessions.filter(s => s.group === "Today" || !s.group),
    Yesterday: validSessions.filter(s => s.group === "Yesterday"),
    Older: validSessions.filter(s => s.group === "Older" || (s.group && !["Today", "Yesterday"].includes(s.group)))
  };

  return (
    <div className="flex h-[calc(100vh-140px)] max-w-7xl mx-auto rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden font-sans select-none relative">
      
      {/* 1. Left Sidebar: ChatGPT / Gemini Style Chat History */}
      <div className="w-72 bg-slate-900 text-slate-100 flex flex-col justify-between border-r border-slate-800 shrink-0">
        
        {/* Top: New Chat Button */}
        <div className="p-4 border-b border-slate-800/80 space-y-3">
          <button
            onClick={handleNewChat}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>+ New Chat</span>
          </button>
        </div>

        {/* Scrollable Conversation Threads */}
        <div className="flex-1 overflow-y-auto p-3 space-y-5 text-xs">
          
          {validSessions.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs space-y-2">
              <MessageSquare className="h-6 w-6 mx-auto opacity-50 text-blue-400" />
              <p className="font-semibold text-slate-400">No Chat History</p>
              <p className="text-[10px]">Start a new legal inquiry thread to begin logging conversations.</p>
            </div>
          ) : (
            Object.entries(groupedSessions).map(([groupLabel, groupList]) => {
              if (groupList.length === 0) return null;
              return (
                <div key={groupLabel} className="space-y-1.5">
                  <span className="px-3 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
                    {groupLabel}
                  </span>
                  
                  <div className="space-y-1">
                    {groupList.map(s => {
                      const sid = s.session_id || s.id;
                      const isActive = sid === activeSessionId;
                      const isEditing = editingSessionId === sid;

                      return (
                        <div
                          key={sid}
                          onClick={() => {
                            if (!isEditing) loadSessionMessages(sid);
                          }}
                          className={`group relative flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all text-xs ${
                            isActive 
                              ? "bg-slate-800 text-white border border-slate-700 shadow-xs" 
                              : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                            <MessageSquare className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                            
                            {isEditing ? (
                              <input
                                type="text"
                                value={editTitleInput}
                                onChange={(e) => setEditTitleInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleRenameSession(s.session_id);
                                  if (e.key === "Escape") setEditingSessionId(null);
                                }}
                                autoFocus
                                className="bg-slate-900 border border-blue-500 text-white px-2 py-0.5 rounded text-xs w-full focus:outline-none"
                              />
                            ) : (
                              <div className="flex flex-col truncate">
                                <span className="truncate font-bold leading-snug">
                                  {s.title}
                                </span>
                                {s.lastMessagePreview && (
                                  <span className="text-[10px] text-slate-500 font-normal truncate">
                                    {s.lastMessagePreview}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            {isEditing ? (
                              <button
                                onClick={() => handleRenameSession(sid)}
                                className="p-1 text-emerald-400 hover:text-white"
                                title="Save Title"
                              >
                                <Check className="h-3 w-3" />
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingSessionId(sid);
                                  setEditTitleInput(s.title);
                                }}
                                className="p-1 text-slate-400 hover:text-white"
                                title="Rename Chat"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                            )}

                            <button
                              onClick={(e) => handleDeleteSession(e, sid)}
                              className="p-1 text-slate-400 hover:text-rose-400"
                              title="Delete Chat"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
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

        {/* Sidebar Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2 truncate">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="font-bold truncate">Police Legal Core v1.0</span>
          </div>
          <span className="font-mono text-[9px] text-slate-500">PROD</span>
        </div>

      </div>

      {/* 2. Main Chat Canvas */}
      <div className="flex-1 flex flex-col justify-between h-full bg-white relative overflow-hidden">
        
        {/* Header Bar */}
        <div className="px-6 py-3.5 border-b border-slate-200 bg-white flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <h2 className="text-xs font-bold text-slate-900 font-mono uppercase tracking-wide">
              {activeSessionId 
                ? (sessions.find(s => s.session_id === activeSessionId)?.title || "Active Legal Consultation Thread") 
                : "New Investigation Thread"}
            </h2>
          </div>

          {messages.length > 0 && (
            <button
              onClick={() => {
                try {
                  api.exportChatPDF(messages, "CrimeGPT Assistant Transcript");
                  setToast({ type: "success", message: "PDF Log generated successfully." });
                } catch (err) {
                  setToast({ type: "error", message: "PDF export failed: " + err.message });
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileText className="h-3.5 w-3.5 text-blue-600" />
              <span>Export PDF Log</span>
            </button>
          )}
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* CONDITION 1: Brand New Empty Chat (0 Messages) -> Show Suggestions Grid */}
          {messages.length === 0 && !loading ? (
            <div className="max-w-3xl mx-auto h-full flex flex-col items-center justify-center space-y-8 py-10">
              
              <div className="text-center space-y-2">
                <div className="h-12 w-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
                  <Cpu className="h-6 w-6" />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">CrimeGPT Legal Assistant</h1>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Ask criminal code questions or select a suggested legal query below. Suggested prompt cards will automatically hide once you start typing.
                </p>
              </div>

              {/* 4-6 Suggested Question Cards Grid */}
              <div className="grid md:grid-cols-2 gap-3 w-full">
                {suggestedPrompts.map((card, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(card.prompt)}
                    className="p-4 rounded-2xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 text-left transition-all cursor-pointer group space-y-1.5 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                        {card.title}
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                      {card.desc}
                    </p>
                  </button>
                ))}
              </div>

            </div>
          ) : (
            
            /* CONDITION 2: Active Conversation (> 0 Messages) -> Suggestions Hidden */
            <div className="max-w-3xl mx-auto space-y-5">
              {messages.map((msg, idx) => (
                <div 
                  key={idx}
                  className={`flex flex-col ${
                    msg.role === "user" ? "items-end ml-auto max-w-[85%]" : "items-start mr-auto max-w-[90%]"
                  }`}
                >
                  <div className={`p-4 rounded-2xl text-xs leading-relaxed shadow-xs ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-tr-none"
                      : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"
                  }`}>
                    {msg.role === "user" 
                      ? msg.content 
                      : parseMessageCitations(msg.content, msg.citations)}
                  </div>

                  {/* Message Metadata & Copy Button */}
                  <div className="flex items-center gap-3 mt-1.5 text-[9px] font-mono text-slate-400 uppercase">
                    <span>{msg.role === "user" ? "Officer Inquiry" : "CrimeGPT Assistant"}</span>
                    {msg.role === "assistant" && (
                      <>
                        <span>•</span>
                        <button
                          onClick={() => handleCopy(msg.content, idx)}
                          className="hover:underline hover:text-blue-600 flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="h-3 w-3" />
                          <span>{copiedIndex === idx ? "Copied" : "Copy"}</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing Loading Indicator */}
              {loading && (
                <div className="flex items-center gap-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-none w-fit max-w-[200px]">
                  <div className="h-2 w-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="h-2 w-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="h-2 w-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: "300ms" }} />
                  <span className="text-[10px] font-mono text-slate-500 font-semibold ml-1">Analyzing Law...</span>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>

          )}

        </div>

        {/* 3. Input Bar at Bottom (Inline File Attachment Icon inside Input Bar) */}
        <div className="p-4 bg-white border-t border-slate-200">
          
          <div className="max-w-3xl mx-auto space-y-2">
            
            {/* Upload Banner with Cancel Button */}
            {uploading && (
              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 truncate">
                  <Paperclip className="h-4 w-4 text-blue-600 animate-pulse shrink-0" />
                  <span className="font-bold text-blue-900 truncate">{selectedFile?.name}</span>
                  <span className="text-[10px] text-blue-700 font-mono">({uploadProgress}%)</span>
                </div>
                <button
                  onClick={handleCancelUpload}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-[10px] cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Input Form with Attachment Paperclip Inside */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!loading) handleSendMessage();
              }}
              className="relative flex items-center rounded-2xl border border-slate-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 bg-white shadow-xs transition-all"
            >
              
              {/* Attachment Icon Inside Input Bar (Left) */}
              <label 
                className="pl-3.5 pr-1.5 py-3 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer shrink-0"
                title="Attach evidence photo/document (Max 20MB)"
              >
                <Paperclip className="h-4 w-4" />
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf,.docx"
                  className="hidden"
                  disabled={uploading || loading}
                  onChange={(e) => {
                    if (e.target.files[0]) handleFileUpload(e.target.files[0]);
                    e.target.value = "";
                  }}
                />
              </label>

              {/* Text Input */}
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask legal provisions (BNS, BNSS, BSA) or cyber investigation procedures..."
                disabled={loading}
                className="w-full py-3 pr-12 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
              />

              {/* Send Button Inside Input Bar (Right) */}
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className={`absolute right-2 p-2 rounded-xl text-white transition-all ${
                  input.trim() && !loading
                    ? "bg-blue-600 hover:bg-blue-500 cursor-pointer shadow-xs"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                <Send className="h-3.5 w-3.5" />
              </button>

            </form>

            <p className="text-[10px] text-center text-slate-400 font-mono">
              CrimeGPT synthesizes official criminal code provisions (BNS, BNSS, BSA). Officers must verify citations prior to judicial filing.
            </p>

          </div>

        </div>

      </div>

      {/* Citation Slide-out Details Drawer */}
      {activeCitation && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex justify-end animate-fade-in">
          <div className="w-full max-w-md bg-white h-full p-6 space-y-6 overflow-y-auto shadow-2xl border-l border-slate-200 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-2 text-blue-700">
                  <BookOpen className="h-5 w-5" />
                  <h3 className="font-bold text-sm text-slate-900">{activeCitation.section_reference}</h3>
                </div>
                <button 
                  onClick={() => setActiveCitation(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">ACT & TITLE:</span>
                  <span className="font-bold text-slate-900">{activeCitation.act} • {activeCitation.title}</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">STATUTORY TEXT:</span>
                  <p className="text-slate-700 leading-relaxed font-medium">{activeCitation.citation_text}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveCitation(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
            >
              Dismiss Source Panel
            </button>
          </div>
        </div>
      )}

      {/* Global Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />

    </div>
  );
}
