import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { 
  FileText, ShieldAlert, FileDown, Cpu, RefreshCw, 
  ArrowLeft, CheckCircle, Save, Plus, AlertCircle, Trash
} from "lucide-react";
import { api } from "../utils/api";

export default function Analyze() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const caseIdParam = searchParams.get("caseId");

  // Form input states
  const [caseId, setCaseId] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [evidence, setEvidence] = useState("");
  const [witnessDetails, setWitnessDetails] = useState("");
  const [status, setStatus] = useState("open");

  // Output and control states
  const [analysisOutput, setAnalysisOutput] = useState("");
  const [citations, setCitations] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    if (caseIdParam) {
      loadCaseData(caseIdParam);
    } else {
      resetForm();
    }
  }, [caseIdParam]);

  const resetForm = () => {
    setCaseId(null);
    setTitle("");
    setDescription("");
    setLocation("");
    setDate("");
    setEvidence("");
    setWitnessDetails("");
    setStatus("open");
    setAnalysisOutput("");
    setCitations("");
  };

  const loadCaseData = async (id) => {
    setLoading(true);
    setMsg({ type: "", text: "" });
    try {
      const data = await api.getCase(id);
      setCaseId(data.id);
      setTitle(data.title);
      setDescription(data.description);
      setLocation(data.location || "");
      setDate(data.date || "");
      setEvidence(data.evidence || "");
      setWitnessDetails(data.witness_details || "");
      setStatus(data.status || "open");
      setAnalysisOutput(data.analysis_output || "");
      
      // Extract brief citations if already generated
      if (data.analysis_output) {
        setCitations("BNS/BNSS Citations Loaded");
      }
    } catch (err) {
      setMsg({ type: "error", text: "Failed to load case. " + err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCase = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setMsg({ type: "", text: "" });
    
    const payload = { title, description, location, date, evidence, witness_details: witnessDetails, status };
    
    try {
      if (caseId) {
        await api.updateCase(caseId, payload);
        setMsg({ type: "success", text: "Case file details saved successfully." });
      } else {
        const newCase = await api.createCase(payload);
        setCaseId(newCase.id);
        navigate(`/analyze?caseId=${newCase.id}`);
        setMsg({ type: "success", text: "New Case file established. Click Analyze to trigger AI." });
      }
    } catch (err) {
      setMsg({ type: "error", text: "Failed to save case file. " + err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleTriggerAnalysis = async () => {
    if (!caseId) {
      setMsg({ type: "error", text: "Please save the case details before triggering AI evaluation." });
      return;
    }
    setLoading(true);
    setMsg({ type: "", text: "" });
    
    try {
      const result = await api.analyzeCase(caseId);
      setAnalysisOutput(result.analysis);
      setCitations(result.citations);
      setMsg({ type: "success", text: "AI Legal Analysis and FIR drafted successfully." });
      // Reload case details to ensure saved
      loadCaseData(caseId);
    } catch (err) {
      setMsg({ type: "error", text: "RAG generation process failed. " + err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCase = async () => {
    if (!window.confirm("Are you sure you want to permanently delete this case? This cannot be undone.")) return;
    try {
      await api.deleteCase(caseId);
      navigate("/dashboard");
    } catch (err) {
      setMsg({ type: "error", text: "Failed to delete case file: " + err.message });
    }
  };

  const handleDownloadPDF = async () => {
    try {
      await api.downloadPDF(caseId);
    } catch (err) {
      setMsg({ type: "error", text: "PDF export failed: " + err.message });
    }
  };

  const handleDownloadDocx = async () => {
    try {
      await api.downloadDocx(caseId);
    } catch (err) {
      setMsg({ type: "error", text: "Word export failed: " + err.message });
    }
  };

  // Safe Inline Markdown parsing helper
  const parseInlineFormatting = (text) => {
    const parts = text.split(/(\*\*.*?\*\*)/);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="text-white font-extrabold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  // Safe Line-by-line Markdown parsing helper
  const renderMarkdown = (text) => {
    if (!text) return <p className="text-slate-400 italic text-xs">AI Legal recommendations not yet triggered. Click 'Run AI Evaluation' below.</p>;
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      const lineStrip = line.trim();
      if (!lineStrip) return <div key={idx} className="h-2.5" />;

      if (lineStrip.startsWith("# ")) {
        return <h1 key={idx} className="text-lg font-black text-slate-100 mt-5 mb-2.5 border-b border-police-800 pb-1 uppercase font-sans tracking-wide">{lineStrip.slice(2)}</h1>;
      }
      if (lineStrip.startsWith("## ")) {
        return <h2 key={idx} className="text-sm font-extrabold text-cyan-400 mt-4 mb-2 tracking-wide uppercase font-sans">{lineStrip.slice(3)}</h2>;
      }
      if (lineStrip.startsWith("### ")) {
        return <h3 key={idx} className="text-xs font-bold text-slate-200 mt-3 mb-1.5">{lineStrip.slice(4)}</h3>;
      }

      if (lineStrip.startsWith(">")) {
        const cleanQuote = lineStrip.replace(/^>\s*/, "").replace(/\[!(NOTE|WARNING|IMPORTANT|CAUTION)\]\s*/i, "");
        return (
          <blockquote key={idx} className="p-3.5 bg-police-900/60 border-l-4 border-cyber-cyan text-slate-300 italic text-xs rounded-r-xl my-3.5 leading-relaxed">
            {cleanQuote}
          </blockquote>
        );
      }

      if (lineStrip.startsWith("- ") || lineStrip.startsWith("* ")) {
        return (
          <li key={idx} className="list-disc list-inside text-xs text-slate-300 ml-4 mb-1.5 leading-relaxed">
            {parseInlineFormatting(lineStrip.slice(2))}
          </li>
        );
      }

      return <p key={idx} className="text-xs text-slate-300 leading-relaxed mb-2.5">{parseInlineFormatting(lineStrip)}</p>;
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6 font-sans">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center space-x-2 text-xs text-slate-400 hover:text-cyber-cyan transition-colors bg-police-900/30 px-3.5 py-2 rounded-xl border border-police-800/40 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </button>
        
        {caseId && (
          <div className="flex items-center space-x-2.5">
            <span className="text-xs font-mono text-slate-400">STATUS:</span>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                // Trigger save auto
                setTimeout(() => handleSaveCase(), 100);
              }}
              className="glass-input px-3 py-1.5 text-xs font-bold font-sans cursor-pointer focus:border-cyan-400"
            >
              <option value="open" className="bg-police-900 text-sky-400 font-bold">OPEN CASE</option>
              <option value="under_investigation" className="bg-police-900 text-amber-400 font-bold">UNDER INVESTIGATION</option>
              <option value="resolved" className="bg-police-900 text-emerald-400 font-bold">RESOLVED</option>
              <option value="closed" className="bg-police-900 text-slate-400 font-bold">CLOSED ARCHIVE</option>
            </select>
          </div>
        )}
      </div>

      {msg.text && (
        <div className={`p-4 rounded-xl flex items-start space-x-3 text-xs border ${
          msg.type === "error" 
            ? "bg-rose-950/30 border-rose-500/30 text-rose-400" 
            : "bg-emerald-950/30 border-emerald-500/30 text-emerald-400"
        }`}>
          <AlertCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{msg.text}</span>
        </div>
      )}

      {/* Main Workspace split */}
      <div className="grid lg:grid-cols-2 gap-8 items-start">
        
        {/* Left Side: Case Metadata Form */}
        <div className="rounded-2xl glass-panel p-6 border-glass-inset shadow-glass space-y-5">
          <div className="flex items-center justify-between border-b border-police-800 pb-3">
            <h2 className="text-lg font-bold text-white">
              {caseId ? `Case Log Details #${caseId}` : "Establish New Case Record"}
            </h2>
            {caseId && (
              <button
                onClick={handleDeleteCase}
                className="text-rose-400 hover:text-rose-300 p-1.5 rounded-lg hover:bg-rose-950/30 transition-colors cursor-pointer"
                title="Delete Case File"
              >
                <Trash className="h-4.5 w-4.5" />
              </button>
            )}
          </div>

          <form onSubmit={handleSaveCase} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 font-mono">CASE HEADER / SUBJECT</label>
              <input
                type="text"
                required
                placeholder="e.g. Cyber Burglary and Database Extraction at Sector 18 Cafe"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full glass-input px-3.5 py-2.5 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 font-mono">INCIDENT LOCATION</label>
                <input
                  type="text"
                  placeholder="e.g. Noida Cyber Hub, UP"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full glass-input px-3.5 py-2.5 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 font-mono">DATE & TIME OF OCCURRENCE</label>
                <input
                  type="text"
                  placeholder="e.g. 2026-07-16 02:30 AM"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full glass-input px-3.5 py-2.5 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 font-mono">INCIDENT DESCRIPTION (AI KNOWLEDGE RAG TARGET)</label>
              <textarea
                rows={5}
                required
                placeholder="Detail the narrative of what occurred, how the intruders entered, what was stolen or broken, and any cyber activities."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full glass-input px-3.5 py-2.5 text-xs resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 font-mono">EVIDENCE GATHERED / INVENTORY</label>
              <input
                type="text"
                placeholder="e.g. shattered front glass samples, CCTV footage backup thumb drive, server event log printouts"
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                className="w-full glass-input px-3.5 py-2.5 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 font-mono">WITNESS ACCOUNTS / INFORMATION</label>
              <input
                type="text"
                placeholder="e.g. Security guard Rajesh Kumar claims seeing 3 masked men running from back door"
                value={witnessDetails}
                onChange={(e) => setWitnessDetails(e.target.value)}
                className="w-full glass-input px-3.5 py-2.5 text-xs"
              />
            </div>

            <div className="flex gap-4 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl bg-police-800 hover:bg-police-700 border border-police-700/60 text-slate-200 hover:text-white font-bold text-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? "Saving case file..." : "Save Case Record"}</span>
              </button>

              {caseId && (
                <button
                  type="button"
                  onClick={handleTriggerAnalysis}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl bg-gradient-to-r from-police-600 to-cyber-cyan text-white font-extrabold text-xs hover:shadow-cyber-glow transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Cpu className="h-4 w-4" />
                  <span>{loading ? "RAG Retrieval active..." : "Run AI Evaluation"}</span>
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right Side: AI Generated Output */}
        <div className="rounded-2xl glass-panel p-6 border-glass-inset shadow-glass flex flex-col h-[650px]">
          <div className="flex items-center justify-between border-b border-police-800 pb-3 mb-4 shrink-0">
            <div className="flex items-center space-x-2.5">
              <Cpu className="h-5 w-5 text-cyber-cyan" />
              <h2 className="text-lg font-bold text-white">AI Analysis & FIR drafting</h2>
            </div>
            
            {analysisOutput && (
              <div className="flex space-x-2">
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center space-x-1 bg-police-800/80 hover:bg-police-700 border border-police-700 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                  title="Download legal PDF Report"
                >
                  <FileDown className="h-3.5 w-3.5 text-rose-400" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={handleDownloadDocx}
                  className="flex items-center space-x-1 bg-police-800/80 hover:bg-police-700 border border-police-700 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                  title="Download Word File"
                >
                  <FileDown className="h-3.5 w-3.5 text-blue-400" />
                  <span>DOCX</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto pr-1 bg-police-950/40 p-4 rounded-xl border border-police-900/60 scroll-smooth">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full space-y-4">
                <RefreshCw className="h-8 w-8 text-cyber-cyan animate-spin" />
                <span className="text-xs text-slate-400 font-mono">RETRIEVING APPLICABLE SECTIONS FROM BNS, BNSS, AND BSA...</span>
              </div>
            ) : (
              renderMarkdown(analysisOutput)
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
