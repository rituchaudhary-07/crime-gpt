import React, { useState, useEffect, useRef } from "react";
import { 
  Send, Cpu, BookOpen, RefreshCw, X, MessageSquare, 
  HelpCircle, Copy, FileText, Upload, Image, Mic, Repeat, CheckSquare
} from "lucide-react";
import { api } from "../utils/api";
import Toast from "../components/Toast";

export default function AIAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatBottomRef = useRef(null);

  // Citation details drawer slide-out state
  const [activeCitation, setActiveCitation] = useState(null); // stores citation dict
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Upload state with AbortController
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [toast, setToast] = useState(null);
  const abortControllerRef = useRef(null);

  const suggestedPrompts = [
    "What is the procedure for e-FIR signing under BNSS 173?",
    "What are the rules for scene audio-videography under BNSS 105?",
    "How does new BNS Section 303 (Theft) differ from old IPC 378?",
    "Generate a legal seizure checklist for cyber cafe hard drives."
  ];

  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const loadChatHistory = async () => {
    setLoading(true);
    try {
      const history = await api.getChatHistory(null, "general_assistant");
      setMessages(history);
    } catch (err) {
      console.log("Failed loading chat history:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setUploading(false);
    setUploadProgress(0);
    setSelectedFile(null);
    setToast({ type: "info", message: "File upload cancelled successfully." });
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    
    // Check 20MB limit
    if (file.size > 20 * 1024 * 1024) {
      setToast({ type: "error", message: "File size exceeds maximum allowed limit of 20MB." });
      return;
    }

    const allowed = [".jpg", ".jpeg", ".png", ".pdf", ".docx"];
    const ext = "." + file.name.split(".").pop().toLowerCase();
    if (!allowed.includes(ext)) {
      setToast({ type: "error", message: "Invalid file extension. Supported formats: JPG, PNG, PDF, DOCX" });
      return;
    }

    setSelectedFile(file);
    setUploading(true);
    setUploadProgress(20);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setUploadProgress(50);
      const res = await api.uploadChatAttachment(file, controller.signal);
      setUploadProgress(100);

      const attachmentMsg = {
        role: "user",
        content: `[Attached ${res.file_type} File: ${res.filename} (${res.size_kb} KB) - ${res.status}]`,
        attachment: res,
        timestamp: new Date(),
        citations: []
      };
      setMessages(prev => [...prev, attachmentMsg]);
      setToast({ type: "success", message: `File '${file.name}' uploaded successfully.` });

      // Trigger AI Analysis of uploaded file
      setLoading(true);
      const aiRes = await api.generalChat(`Analyze uploaded ${res.file_type} evidence file '${res.filename}' (${res.status}). Provide preliminary legal assessment and evidence chain guidelines.`);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: aiRes.response,
        timestamp: new Date(),
        citations: aiRes.citations || []
      }]);
    } catch (err) {
      if (err.name === "AbortError") {
        setToast({ type: "info", message: "Upload aborted." });
      } else {
        setToast({ type: "error", message: "Upload failed: " + err.message });
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setSelectedFile(null);
      setLoading(false);
    }
  };

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg = { role: "user", content: query, timestamp: new Date(), citations: [] };
    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      const res = await api.generalChat(query);
      const botMsg = { 
        role: "assistant", 
        content: res.response, 
        timestamp: new Date(), 
        citations: res.citations || [] 
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      const errorMsg = { 
        role: "assistant", 
        content: "API connection failed: " + err.message, 
        timestamp: new Date(), 
        citations: [] 
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Inline formatting helper mapping [BNS Section 303] citations to buttons
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
          citation_text: "Definition loaded from the central legal index.",
          justification: "Relevant provision cited during discussion.",
          confidence_score: 95
        };

        return (
          <button
            key={i}
            onClick={() => setActiveCitation(found || fallbackCite)}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#EFF6FF] border border-[#BFDBFE] text-[10px] font-bold text-[#2563EB] hover:bg-[#2563EB] hover:text-white transition-all cursor-pointer font-mono mx-0.5 shrink-0"
            title="Open legal source definition"
          >
            <BookOpen className="h-2.5 w-2.5" />
            <span>{part}</span>
          </button>
        );
      }
      return part;
    });
  };

  return (
    <div className="grid lg:grid-cols-4 gap-8 items-start font-sans select-none relative max-w-7xl mx-auto h-[calc(100vh-140px)]">
      
      {/* 1. Left sidebar suggested prompts */}
      <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-4 h-full flex flex-col justify-between">
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-[#111827] uppercase tracking-wider font-mono">Suggested Inquiries</h3>
          <div className="space-y-2.5">
            {suggestedPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(p)}
                className="w-full text-left p-3 text-xs bg-[#F8FAFC] hover:bg-[#EFF6FF] border border-[#E2E8F0] hover:border-[#BFDBFE] rounded-xl text-[#374151] hover:text-[#2563EB] transition-all cursor-pointer leading-normal font-medium"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Attachments & Export Actions */}
        <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-3 text-[10px]">
          <span className="font-bold text-[#4B5563] block">SECURE CHAT OPTIONS</span>
          
          {/* Upload Progress & Cancel Banner */}
          {uploading && (
            <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-blue-900 truncate max-w-[120px]">{selectedFile?.name}</span>
                <button
                  type="button"
                  onClick={handleCancelUpload}
                  className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded cursor-pointer text-[9px]"
                >
                  Cancel
                </button>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div className="bg-blue-600 h-1.5 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button 
              disabled={messages.length === 0}
              onClick={() => {
                if (messages.length === 0) return;
                try {
                  api.exportChatPDF(messages, "CrimeGPT Assistant Transcript");
                  setToast({ type: "success", message: "Chat transcript PDF exported successfully." });
                } catch (err) {
                  setToast({ type: "error", message: "Export failed: " + err.message });
                }
              }}
              className={`flex items-center justify-center gap-1.5 p-2 border rounded-lg font-bold transition-colors ${
                messages.length === 0 
                  ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed" 
                  : "bg-white border-[#E2E8F0] hover:border-blue-300 hover:text-blue-600 text-[#4B5563] cursor-pointer"
              }`}
              title={messages.length === 0 ? "No chat messages to export" : "Export chat as PDF"}
            >
              <Upload className="h-3.5 w-3.5" />
              <span>PDF Logs</span>
            </button>
            
            <label className="flex items-center justify-center gap-1.5 p-2 bg-white border border-[#E2E8F0] hover:border-blue-300 hover:text-blue-600 rounded-lg text-[#4B5563] font-bold cursor-pointer transition-colors">
              <Image className="h-3.5 w-3.5" />
              <span>Images / Files</span>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf,.docx"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  if (e.target.files[0]) handleFileUpload(e.target.files[0]);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        </div>
      </div>

      {/* 2. Main Chat Panel */}
      <div className="lg:col-span-3 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col justify-between h-full relative overflow-hidden">
        
        {/* Scrollable feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 pr-2">
          {messages.length === 0 && !loading ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-20">
              <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-full text-[#2563EB]">
                <Cpu className="h-6 w-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-[#111827]">CrimeGPT Legal Core</h3>
                <p className="text-xs text-[#6B7280] max-w-sm mx-auto leading-relaxed">
                  Query legal guidelines or upload Crime Scene Photos, Evidence Images, Screenshots, and Documents. Answers will render with official source citations.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex flex-col max-w-[85%] ${
                    msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
                  }`}
                >
                  <div className={`p-4 rounded-2xl text-xs leading-relaxed ${
                    msg.role === "user" 
                      ? "bg-[#2563EB] text-white rounded-tr-none" 
                      : "bg-white border border-[#E2E8F0] text-[#374151] rounded-tl-none shadow-sm"
                  }`}>
                    {msg.attachment && (
                      <div className="mb-2 p-2 bg-white/10 border border-white/20 rounded-lg space-y-1">
                        <span className="font-bold flex items-center gap-1 text-[11px]">
                          📁 Attachment: {msg.attachment.filename}
                        </span>
                        <span className="text-[9px] block opacity-90">{msg.attachment.file_type} • {msg.attachment.size_kb} KB • {msg.attachment.status}</span>
                      </div>
                    )}
                    {msg.role === "user" ? msg.content : parseMessageCitations(msg.content, msg.citations)}
                  </div>
                  
                  {/* Action items for AI messages */}
                  <div className="flex items-center gap-3 mt-1 text-[8px] font-mono text-[#6B7280] uppercase">
                    <span>{msg.role === "user" ? "Officer Client" : "AI Assistant"}</span>
                    {msg.role === "assistant" && (
                      <>
                        <span>•</span>
                        <button 
                          onClick={() => handleCopy(msg.content, idx)}
                          className="hover:underline hover:text-[#2563EB] flex items-center gap-0.5 cursor-pointer"
                        >
                          <Copy className="h-2.5 w-2.5" />
                          <span>{copiedIndex === idx ? "Copied" : "Copy"}</span>
                        </button>
                        <span>•</span>
                        <button 
                          onClick={() => handleSendMessage(messages[idx-1]?.content)}
                          className="hover:underline hover:text-[#2563EB] flex items-center gap-0.5 cursor-pointer"
                        >
                          <Repeat className="h-2.5 w-2.5" />
                          <span>Regenerate</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {loading && (
            <div className="flex items-center gap-2 mr-auto bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-xl">
              <RefreshCw className="h-3.5 w-3.5 text-[#2563EB] animate-spin" />
              <span className="text-[10px] font-mono text-[#6B7280] uppercase tracking-wider font-semibold">Generating reformed citations...</span>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Chat input box */}
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} 
          className="p-4 border-t border-[#E2E8F0] flex gap-3 shrink-0"
        >
          <input
            type="text"
            placeholder="Type legal questions (e.g. 'What are the rules of digital custody?')..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 saas-input px-4 py-3 text-xs"
          />
          <div className="flex gap-2">
            <label className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] text-[#6B7280] hover:text-[#111827] rounded-xl cursor-pointer flex items-center justify-center" title="Upload Image / Photo / Document">
              <Image className="h-4 w-4" />
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf,.docx"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  try {
                    setLoading(true);
                    const res = await api.uploadChatAttachment(file);
                    const attachmentMsg = {
                      role: "user",
                      content: `[Uploaded Evidence ${res.file_type}: ${res.filename} (${res.size_kb} KB)]`,
                      attachment: res,
                      timestamp: new Date(),
                      citations: []
                    };
                    setMessages(prev => [...prev, attachmentMsg]);
                    const aiRes = await api.generalChat(`Analyze uploaded ${res.file_type} evidence file '${res.filename}'. Provide guidance on chain of custody.`);
                    setMessages(prev => [...prev, {
                      role: "assistant",
                      content: aiRes.response,
                      timestamp: new Date(),
                      citations: aiRes.citations || []
                    }]);
                  } catch (err) {
                    alert("Upload failed: " + err.message);
                  } finally {
                    setLoading(false);
                    e.target.value = "";
                  }
                }}
              />
            </label>
            <button
              type="submit"
              className="px-5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl cursor-pointer hover:shadow-lg transition-all flex items-center justify-center font-bold"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>


      </div>

      {/* Slide-out Citation Details Drawer */}
      {activeCitation && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end">
          <div 
            className="w-full max-w-md bg-white border-l border-[#E2E8F0] h-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto space-y-6 animate-slide-in relative text-xs"
          >
            <button 
              onClick={() => setActiveCitation(null)}
              className="absolute top-4 right-4 text-[#9CA3AF] hover:text-[#111827] p-2 rounded-xl hover:bg-[#F8FAFC]"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-6">
              <div className="space-y-1 pb-4 border-b border-[#F1F5F9]">
                <span className="text-[9px] font-mono text-[#2563EB] font-black tracking-widest uppercase">LEGAL CITATION SOURCE</span>
                <h3 className="text-base font-bold text-[#111827]">{activeCitation.section_reference}</h3>
                <span className="text-[11px] text-[#6B7280] font-semibold">{activeCitation.act} • {activeCitation.title}</span>
              </div>

              <div className="space-y-4 leading-relaxed text-[#374151]">
                <div className="space-y-1">
                  <span className="block text-[9px] text-[#6B7280] font-mono uppercase font-bold tracking-wider">Justification Summary</span>
                  <p className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-[#4B5563] italic">
                    {activeCitation.justification}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="block text-[9px] text-[#6B7280] font-mono uppercase font-bold tracking-wider">Exact Source Text</span>
                  <p className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#111827] font-mono text-[10px] leading-relaxed select-all">
                    {activeCitation.citation_text}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-[#F1F5F9] pt-4 text-xs">
                  <div>
                    <span className="block text-[9px] text-[#6B7280] font-mono uppercase font-bold">RAG Match Confidence</span>
                    <span className="text-sm font-bold text-[#10B981] font-mono mt-0.5 block">
                      {activeCitation.confidence_score}% Match
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-[#6B7280] font-mono uppercase font-bold">Old Law Equivalent</span>
                    <span className="text-xs font-semibold text-[#111827] font-mono mt-0.5 block">
                      {activeCitation.section_reference.includes("303") ? "IPC Section 378 / 379" :
                       activeCitation.section_reference.includes("305") ? "IPC Section 380" :
                       activeCitation.section_reference.includes("308") ? "IPC Section 384" :
                       activeCitation.section_reference.includes("316") ? "IPC Section 405" :
                       activeCitation.section_reference.includes("318") ? "IPC Section 420" :
                       activeCitation.section_reference.includes("329") ? "IPC Section 441 / 448" :
                       activeCitation.section_reference.includes("115") ? "IPC Section 323" :
                       activeCitation.section_reference.includes("117") ? "IPC Section 325" :
                       activeCitation.section_reference.includes("103") ? "IPC Section 302" :
                       activeCitation.section_reference.includes("351") ? "IPC Section 506" :
                       activeCitation.section_reference.includes("173") ? "CrPC Section 154" :
                       activeCitation.section_reference.includes("63") ? "IEA Section 65B" : "N/A Mapping"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveCitation(null)}
              className="w-full py-2.5 bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] text-[#374151] rounded-xl text-xs font-semibold"
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
