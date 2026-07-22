import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { 
  FileText, ShieldAlert, FileDown, Cpu, RefreshCw, 
  ArrowLeft, CheckCircle, Save, Plus, AlertCircle, Trash,
  Calendar, MapPin, ClipboardList, UserCheck, ShieldCheck,
  ChevronRight, Upload, HelpCircle, Send, MessageSquare,
  BookOpen, CheckSquare, Edit3, X, Info
} from "lucide-react";
import { api } from "../utils/api";

export default function Analyze() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const caseIdParam = searchParams.get("caseId");

  const role = api.getUserRole();
  const username = api.getUsername();

  // Navigation tabs for left panel
  const [activeLeftTab, setActiveLeftTab] = useState("details"); // details, evidence, sop_chat

  // Form input states
  const [caseId, setCaseId] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [evidence, setEvidence] = useState("");
  const [witnessDetails, setWitnessDetails] = useState("");
  const [status, setStatus] = useState("draft");
  const [station, setStation] = useState("");

  // RAG Intake validation states
  const [intakeChecked, setIntakeChecked] = useState(false);
  const [missingFields, setMissingFields] = useState([]);
  const [clarifyingQuestions, setClarifyingQuestions] = useState([]);
  const [clarifyingAnswers, setClarifyingAnswers] = useState({});
  const [intakeLoading, setIntakeLoading] = useState(false);

  // RAG Output states
  const [summary, setSummary] = useState("");
  const [firDraftText, setFirDraftText] = useState("");
  const [evidenceChecklist, setEvidenceChecklist] = useState([]);
  const [checkedEvidence, setCheckedEvidence] = useState({}); // mapped by index -> boolean
  const [citations, setCitations] = useState([]);
  const [validationWarnings, setValidationWarnings] = useState([]);
  
  // AI field-level approval tracking
  const [approvedFlags, setApprovedFlags] = useState({
    summary: false,
    fir_draft_text: false,
    evidence_checklist: false
  });

  // Evidence list uploads
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [custodyNotesInput, setCustodyNotesInput] = useState("");
  const [uploadingEvidence, setUploadingEvidence] = useState(false);

  // SOP Chatbot states
  const [sopMessages, setSopMessages] = useState([]);
  const [sopInput, setSopInput] = useState("");
  const [sopLoading, setSopLoading] = useState(false);
  const chatBottomRef = useRef(null);

  // Citation details drawer slide-out state
  const [activeCitation, setActiveCitation] = useState(null); // stores citation dict

  // Edit fields inline states
  const [isEditingSummary, setIsEditingSummary] = useState(false);

  // General controls
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

  useEffect(() => {
    if (activeLeftTab === "sop_chat" && caseId) {
      loadSopChatHistory();
    }
  }, [activeLeftTab, caseId]);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [sopMessages]);

  const resetForm = () => {
    setCaseId(null);
    setTitle("");
    setDescription("");
    setLocation("");
    setDate("");
    setEvidence("");
    setWitnessDetails("");
    setStatus("draft");
    setSummary("");
    setFirDraftText("");
    setEvidenceChecklist([]);
    setCitations([]);
    setValidationWarnings([]);
    setEvidenceFiles([]);
    setSopMessages([]);
    setIntakeChecked(false);
    setMissingFields([]);
    setClarifyingQuestions([]);
    setClarifyingAnswers({});
    setApprovedFlags({
      summary: false,
      fir_draft_text: false,
      evidence_checklist: false
    });
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
      setStatus(data.status || "draft");
      setStation(data.station || "");
      
      // Load structured draft details if exists
      try {
        const draft = await api.getFIRDraft(id);
        setSummary(draft.incident_summary || "");
        setFirDraftText(draft.fir_draft_text || "");
        setEvidenceChecklist(draft.evidence_checklist || []);
        setApprovedFlags(draft.ai_approved_flags || {
          summary: false,
          fir_draft_text: false,
          evidence_checklist: false
        });
        setCitations(draft.citations || []);
        setValidationWarnings(draft.validation_warnings || []);
      } catch (draftErr) {
        // FIR draft might not exist yet, which is fine
        setSummary("");
        setFirDraftText(data.analysis_output || "");
        setEvidenceChecklist([]);
        setCitations([]);
        setValidationWarnings([]);
      }

      // Load evidence files checklist
      loadEvidenceFiles(id);

    } catch (err) {
      setMsg({ type: "error", text: "Failed to load case. " + err.message });
    } finally {
      setLoading(false);
    }
  };

  const loadEvidenceFiles = async (id) => {
    try {
      const list = await api.getEvidenceList(id);
      setEvidenceFiles(list);
    } catch (e) {
      console.log("Failed loading evidence list:", e);
    }
  };

  const loadSopChatHistory = async () => {
    try {
      const history = await api.getChatHistory(caseId, "sop_guidance");
      setSopMessages(history);
    } catch (e) {
      console.log("Failed to load chat history:", e);
    }
  };

  // Run initial intake validation before establishing case
  const handleValidateIntake = async () => {
    if (!description.trim()) {
      setMsg({ type: "error", text: "Please input an incident narrative description." });
      return;
    }
    setIntakeLoading(true);
    setMsg({ type: "", text: "" });
    try {
      const check = await api.intakeCheck({
        description,
        title,
        location,
        date
      });
      setMissingFields(check.missing_fields);
      setClarifyingQuestions(check.questions);
      setIntakeChecked(true);
      
      if (check.is_complete) {
        // Automatically proceed to save if facts are complete
        handleSaveCase();
      }
    } catch (err) {
      setMsg({ type: "error", text: "Narrative parsing check failed: " + err.message });
    } finally {
      setIntakeLoading(false);
    }
  };

  // Process answers to intake clarifying questions
  const handleAnswersSubmit = (e) => {
    e.preventDefault();
    // Merge answers into the main description
    let extraNarrative = "\n\n--- AI CLARIFICATIONS ---";
    Object.entries(clarifyingAnswers).forEach(([qIdx, answer]) => {
      if (answer.trim()) {
        const questionText = clarifyingQuestions[qIdx];
        extraNarrative += `\nQ: ${questionText}\nA: ${answer}`;
      }
    });
    
    const finalDesc = description + extraNarrative;
    setDescription(finalDesc);
    setIntakeChecked(false);
    setClarifyingQuestions([]);
    setClarifyingAnswers({});
    
    // Save the merged data
    setTimeout(() => {
      handleSaveCase(finalDesc);
    }, 100);
  };

  const handleSaveCase = async (overrideDesc = null) => {
    setSaving(true);
    setMsg({ type: "", text: "" });
    
    const finalDescription = overrideDesc || description;
    const payload = { 
      title: title || "Unnamed Case", 
      description: finalDescription, 
      location, 
      date, 
      evidence, 
      witness_details: witnessDetails 
    };
    
    try {
      if (caseId) {
        const updated = await api.updateCase(caseId, { ...payload, status });
        setMsg({ type: "success", text: "Case files saved successfully." });
      } else {
        const newCase = await api.createCase(payload);
        setCaseId(newCase.id);
        navigate(`/analyze?caseId=${newCase.id}`);
        setMsg({ type: "success", text: "New Case Entry registered in system. Run AI analysis below." });
      }
    } catch (err) {
      setMsg({ type: "error", text: "Database record save failed: " + err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleTriggerAnalysis = async () => {
    if (!caseId) {
      setMsg({ type: "error", text: "Save details before running AI RAG evaluation." });
      return;
    }
    setLoading(true);
    setMsg({ type: "", text: "" });
    
    try {
      const result = await api.analyzeCase(caseId);
      setSummary(result.summary);
      setFirDraftText(result.fir_draft_text);
      setEvidenceChecklist(result.evidence_checklist);
      setCitations(result.citations);
      setValidationWarnings(result.validation_warnings);
      setApprovedFlags({
        summary: false,
        fir_draft_text: false,
        evidence_checklist: false
      });
      setMsg({ type: "success", text: "AI Analysis successfully compiled with new legal codes." });
      loadCaseData(caseId);
    } catch (err) {
      setMsg({ type: "error", text: "RAG matching failed: " + err.message });
    } finally {
      setLoading(false);
    }
  };

  // Toggle field-level approvals to distinguish AI-generated vs approved
  const handleToggleFieldApproval = async (field) => {
    const updatedFlags = { ...approvedFlags, [field]: !approvedFlags[field] };
    setApprovedFlags(updatedFlags);
    try {
      await api.updateFIRDraft(caseId, {
        ai_approved_flags: JSON.stringify(updatedFlags)
      });
    } catch (e) {
      console.log("Failed updating approvals:", e);
    }
  };

  const handleApproveCitation = async (citeRef, currentStatus) => {
    const newStatus = currentStatus === 1 ? 0 : 1;
    // Map list of approved section references
    const updatedCites = citations.map(c => {
      if (c.section_reference === citeRef) {
        return { ...c, approved_by_officer: newStatus };
      }
      return c;
    });
    setCitations(updatedCites);
    
    const approvedList = updatedCites.filter(c => c.approved_by_officer === 1).map(c => c.section_reference);
    
    try {
      await api.updateFIRDraft(caseId, {
        approved_sections: approvedList
      });
      if (activeCitation && activeCitation.section_reference === citeRef) {
        setActiveCitation({ ...activeCitation, approved_by_officer: newStatus });
      }
    } catch (e) {
      console.log("Failed approving citation:", e);
    }
  };

  const handleUpdateFIRText = async (text) => {
    setFirDraftText(text);
    try {
      await api.updateFIRDraft(caseId, {
        fir_draft_text: text
      });
    } catch (e) {
      console.log("Failed auto-saving draft text:", e);
    }
  };

  const handleSaveSummary = async () => {
    setIsEditingSummary(false);
    try {
      await api.updateFIRDraft(caseId, {
        incident_summary: summary
      });
    } catch (e) {
      console.log("Failed saving summary details:", e);
    }
  };

  // Upload mock evidence files
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingEvidence(true);
    try {
      await api.uploadEvidenceFile(caseId, file, custodyNotesInput);
      setCustodyNotesInput("");
      loadEvidenceFiles(caseId);
      setMsg({ type: "success", text: `Uploaded evidence item: ${file.name}` });
    } catch (err) {
      setMsg({ type: "error", text: "Upload failed: " + err.message });
    } finally {
      setUploadingEvidence(false);
    }
  };

  const handleUpdateEvidenceType = async (itemId, type, notes) => {
    try {
      await api.updateEvidenceItem(caseId, itemId, type, notes);
      loadEvidenceFiles(caseId);
    } catch (err) {
      setMsg({ type: "error", text: "Failed updating evidence item." });
    }
  };

  const handleDeleteEvidence = async (itemId) => {
    if (!window.confirm("Delete evidence file from registry?")) return;
    try {
      await api.deleteEvidenceItem(caseId, itemId);
      loadEvidenceFiles(caseId);
    } catch (err) {
      setMsg({ type: "error", text: "Failed to delete evidence item." });
    }
  };

  // SOP Chatbot queries
  const handleSendSOPMessage = async (e) => {
    if (e) e.preventDefault();
    if (!sopInput.trim()) return;
    
    const userMsg = { role: "user", content: sopInput, timestamp: new Date() };
    setSopMessages(prev => [...prev, userMsg]);
    setSopInput("");
    setSopLoading(true);
    
    try {
      const res = await api.sopChat(caseId, userMsg.content);
      const botMsg = { role: "assistant", content: res.response, timestamp: new Date() };
      setSopMessages(prev => [...prev, botMsg]);
    } catch (err) {
      const errorMsg = { role: "assistant", content: "SOP Chat connection failed: " + err.message, timestamp: new Date() };
      setSopMessages(prev => [...prev, errorMsg]);
    } finally {
      setSopLoading(false);
    }
  };

  const handleFinalizeCase = async (nextStatus) => {
    setStatus(nextStatus);
    try {
      await api.updateCase(caseId, { status: nextStatus });
      setMsg({ type: "success", text: `Case status marked as: ${formatStatus(nextStatus)}` });
    } catch (err) {
      setMsg({ type: "error", text: "Status change failed: " + err.message });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-6 font-sans relative">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-police-900 pb-5">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center space-x-2 text-xs text-slate-350 hover:text-cyber-cyan hover:border-cyber-cyan/40 transition-all bg-police-900/40 px-3.5 py-2.5 rounded-xl border border-police-800/50 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Dashboard</span>
          </button>
          <h1 className="text-xl font-extrabold text-white tracking-wide">
            {caseId ? `Case Workspace ID #${caseId}` : "Case Intake & FIR Generator"}
          </h1>
        </div>

        {caseId && (
          <div className="flex items-center space-x-3">
            <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">WORKSPACE STAGE:</span>
            {role === "sho" ? (
              <select
                value={status}
                onChange={(e) => handleFinalizeCase(e.target.value)}
                className="glass-input px-3.5 py-2 text-xs font-black font-sans cursor-pointer focus:border-cyan-400 border border-cyber-cyan/30"
              >
                <option value="draft" className="bg-police-900 text-slate-400">DRAFT STAGE</option>
                <option value="under_review" className="bg-police-900 text-purple-400">UNDER REVIEW</option>
                <option value="filed" className="bg-police-900 text-emerald-400">FILED / finalized</option>
                <option value="investigating" className="bg-police-900 text-amber-400">ACTIVE INVESTIGATION</option>
                <option value="closed" className="bg-police-900 text-slate-500">CLOSED ARCHIVE</option>
              </select>
            ) : (
              <span className={`px-4 py-2 rounded-xl text-xs font-extrabold border uppercase tracking-wider ${
                status === "draft" ? "border-slate-700 text-slate-400" :
                status === "under_review" ? "border-purple-500/30 text-purple-450" :
                status === "filed" ? "border-emerald-500/30 text-emerald-400" :
                status === "investigating" ? "border-amber-500/30 text-amber-400" : "border-slate-800 text-slate-500"
              }`}>
                {formatStatus(status)}
              </span>
            )}
          </div>
        )}
      </div>

      {msg.text && (
        <div className={`p-4 rounded-xl flex items-center space-x-3 text-xs border ${
          msg.type === "error" 
            ? "bg-rose-950/40 border-rose-500/30 text-rose-455" 
            : "bg-emerald-950/40 border-emerald-500/30 text-emerald-400"
        }`}>
          <AlertCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{msg.text}</span>
        </div>
      )}

      {/* RAG intake questionnaire dialog */}
      {clarifyingQuestions.length > 0 && (
        <div className="p-6 rounded-2xl border border-amber-500/30 bg-amber-950/20 space-y-4">
          <div className="flex items-center space-x-2 text-amber-400">
            <HelpCircle className="h-5 w-5 animate-pulse" />
            <h3 className="text-sm font-bold tracking-wide uppercase">AI-Detected Missing Details: Please Clarify</h3>
          </div>
          <form onSubmit={handleAnswersSubmit} className="space-y-4 text-xs">
            {clarifyingQuestions.map((question, qIdx) => (
              <div key={qIdx} className="space-y-1.5">
                <label className="block text-slate-300 font-medium">{question}</label>
                <input
                  type="text"
                  placeholder="Provide any details you remember (leave empty to skip)..."
                  value={clarifyingAnswers[qIdx] || ""}
                  onChange={(e) => setClarifyingAnswers(prev => ({ ...prev, [qIdx]: e.target.value }))}
                  className="w-full glass-input px-3.5 py-2.5"
                />
              </div>
            ))}
            <div className="flex space-x-3 pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 text-white font-extrabold rounded-xl cursor-pointer hover:shadow-lg transition-all"
              >
                Merge Answers & Save File
              </button>
              <button
                type="button"
                onClick={() => { setClarifyingQuestions([]); setClarifyingAnswers({}); handleSaveCase(); }}
                className="px-5 py-2.5 glass-panel text-slate-355 font-semibold rounded-xl cursor-pointer hover:bg-police-900/40"
              >
                Skip & Save File As Is
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Split Layout Workspace */}
      <div className="grid lg:grid-cols-2 gap-8 items-start">
        
        {/* LEFT PANEL: Intake details, checklists, evidence logs, SOP Guidance */}
        <div className="rounded-2xl glass-panel border-glass-inset shadow-glass flex flex-col min-h-[700px]">
          
          {/* Tab Selection */}
          <div className="flex border-b border-police-900 shrink-0">
            {[
              { id: "details", label: "Incident Intake", icon: <ClipboardList className="h-4 w-4" /> },
              { id: "evidence", label: "Evidence Chest", icon: <CheckSquare className="h-4 w-4" />, disabled: !caseId },
              { id: "sop_chat", label: "SOP Guidance", icon: <MessageSquare className="h-4 w-4" />, disabled: !caseId }
            ].map(tab => (
              <button
                key={tab.id}
                disabled={tab.disabled}
                onClick={() => setActiveLeftTab(tab.id)}
                className={`flex-1 flex items-center justify-center space-x-2 py-4 text-xs font-bold transition-all border-b-2 disabled:opacity-40 cursor-pointer ${
                  activeLeftTab === tab.id 
                    ? "border-cyber-cyan text-cyber-cyan bg-police-900/20" 
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab contents */}
          <div className="flex-1 p-6 overflow-y-auto max-h-[620px]">
            
            {/* Details Tab */}
            {activeLeftTab === "details" && (
              <form onSubmit={(e) => { e.preventDefault(); handleValidateIntake(); }} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1.5 font-mono uppercase tracking-wider">CASE SUBJECT / ALIAS</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cyber Cafe Intrusion & Database Extraction"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full glass-input px-3.5 py-3 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1.5 font-mono uppercase tracking-wider">INCIDENT JURISDICTION</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                        <MapPin className="h-4 w-4" />
                      </span>
                      <input
                        type="text"
                        placeholder="e.g. Sector 62 Cyber PS"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full glass-input pl-10 pr-3 py-3 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1.5 font-mono uppercase tracking-wider">OCCURRENCE DATE/TIME</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                        <Calendar className="h-4 w-4" />
                      </span>
                      <input
                        type="text"
                        placeholder="e.g. 2026-07-16 02:00 AM"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full glass-input pl-10 pr-3 py-3 text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1.5 font-mono uppercase tracking-wider">INCIDENT DESCRIPTION & MO</label>
                  <textarea
                    rows={6}
                    required
                    placeholder="Describe facts, victims, suspects, what items were stolen, physical damage, and any threat issued..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full glass-input px-3.5 py-3 text-xs resize-none leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1.5 font-mono uppercase tracking-wider">PHYSICAL EVIDENCE SUMMARY</label>
                    <input
                      type="text"
                      placeholder="e.g. Server syslogs, CCTV DVR unit"
                      value={evidence}
                      onChange={(e) => setEvidence(e.target.value)}
                      className="w-full glass-input px-3.5 py-3 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1.5 font-mono uppercase tracking-wider">WITNESS STATEMENTS</label>
                    <input
                      type="text"
                      placeholder="e.g. Security guard heard windows shattering"
                      value={witnessDetails}
                      onChange={(e) => setWitnessDetails(e.target.value)}
                      className="w-full glass-input px-3.5 py-3 text-xs"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-police-900">
                  <button
                    type="button"
                    onClick={() => handleSaveCase()}
                    disabled={saving}
                    className="flex-1 flex items-center justify-center space-x-2 py-3.5 rounded-xl bg-police-900/60 hover:bg-police-800 border border-police-800 text-slate-300 hover:text-white font-bold text-xs tracking-wider uppercase transition-all cursor-pointer"
                  >
                    <Save className="h-4 w-4" />
                    <span>{saving ? "Saving Record..." : "Save Record"}</span>
                  </button>

                  <button
                    type="submit"
                    disabled={intakeLoading}
                    className="flex-1 flex items-center justify-center space-x-2 py-3.5 rounded-xl bg-gradient-to-r from-police-600 to-cyber-cyan text-white font-extrabold text-xs tracking-wider uppercase hover:shadow-cyber-glow transition-all cursor-pointer animate-pulse"
                  >
                    <Cpu className="h-4 w-4" />
                    <span>{intakeLoading ? "Validating Facts..." : "Ingest & Run AI"}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Evidence Tab */}
            {activeLeftTab === "evidence" && (
              <div className="space-y-6 text-xs font-sans">
                
                {/* Mock Upload Card */}
                <div className="p-5 rounded-2xl border border-police-850 bg-police-950/40 space-y-4">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Upload New Evidence Registry</h4>
                  <div className="grid grid-cols-1 gap-3.5">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-mono mb-1">CUSTODY ACCESS NOTES</label>
                      <input
                        type="text"
                        placeholder="e.g. CCTV drive recovered by Officer at alley gateway"
                        value={custodyNotesInput}
                        onChange={(e) => setCustodyNotesInput(e.target.value)}
                        className="w-full glass-input px-3 py-2 text-xs"
                      />
                    </div>
                    <div className="relative border-2 border-dashed border-police-800 rounded-xl p-6 text-center hover:border-cyber-cyan/45 transition-colors cursor-pointer">
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        disabled={uploadingEvidence}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Upload className="h-6 w-6 text-slate-500 mx-auto mb-2" />
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {uploadingEvidence ? "SAVING FILE METADATA..." : "SELECT FILE TO RECORD IN TRIAL CUSTODY"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Evidence items database lists */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Evidence Logs ({evidenceFiles.length})</h4>
                  {evidenceFiles.length === 0 ? (
                    <p className="text-slate-500 italic py-4">No uploaded documents logged in custody registry.</p>
                  ) : (
                    <div className="space-y-3">
                      {evidenceFiles.map((file) => (
                        <div key={file.id} className="p-4 rounded-xl border border-police-850 bg-police-950/20 space-y-3 relative group">
                          <button
                            onClick={() => handleDeleteEvidence(file.id)}
                            className="absolute top-3 right-3 text-slate-500 hover:text-rose-455 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove evidence"
                          >
                            <Trash className="h-3.5 w-3.5" />
                          </button>
                          
                          <div className="space-y-1">
                            <span className="block font-bold text-slate-200 truncate pr-6">{file.filename}</span>
                            <span className="block text-[9px] text-slate-550 font-mono">HASH CHECK: SHA-256 SECURED LOG</span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-[10px]">
                            <div>
                              <label className="block text-[9px] text-slate-500 font-mono uppercase mb-0.5">Classification</label>
                              <select
                                value={file.file_type}
                                onChange={(e) => handleUpdateEvidenceType(file.id, e.target.value, file.custody_notes)}
                                className="w-full glass-input px-2 py-1 text-[10px]"
                              >
                                <option value="CCTV">CCTV Footage</option>
                                <option value="Document">Signed Document</option>
                                <option value="ID Proof">Official ID Proof</option>
                                <option value="Chat Log">Cyber Chat Log</option>
                                <option value="Other">Other Material</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[9px] text-slate-500 font-mono uppercase mb-0.5">Custody Notes</label>
                              <input
                                type="text"
                                value={file.custody_notes || ""}
                                onChange={(e) => handleUpdateEvidenceType(file.id, file.file_type, e.target.value)}
                                className="w-full glass-input px-2 py-1 text-[10px]"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* AI-Generated checklists based on crime codes */}
                <div className="space-y-3 border-t border-police-900 pt-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Required Evidence Checklist</h4>
                    <span className="text-[10px] font-mono text-cyan-400">
                      {Object.values(checkedEvidence).filter(Boolean).length} / {evidenceChecklist.length} COMPLETE
                    </span>
                  </div>
                  {evidenceChecklist.length === 0 ? (
                    <p className="text-slate-500 italic">No checklist generated. Run AI Analysis to compile recommendations.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {evidenceChecklist.map((item, idx) => (
                        <div key={idx} className="flex items-start space-x-2.5 p-2 rounded-lg hover:bg-police-900/10 transition-colors">
                          <input
                            type="checkbox"
                            checked={!!checkedEvidence[idx]}
                            onChange={(e) => setCheckedEvidence(prev => ({ ...prev, [idx]: e.target.checked }))}
                            className="mt-0.5 rounded border-police-800 text-cyber-cyan focus:ring-cyber-cyan cursor-pointer h-3.5 w-3.5"
                          />
                          <span className={`text-[11px] leading-tight ${checkedEvidence[idx] ? "line-through text-slate-500" : "text-slate-300"}`}>
                            {item}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* SOP Guidance Chatbot Tab */}
            {activeLeftTab === "sop_chat" && (
              <div className="flex flex-col h-[520px] font-sans">
                
                {/* Chat feed logs */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4 scroll-smooth">
                  {sopMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-20 text-xs">
                      <MessageSquare className="h-8 w-8 text-slate-600 animate-pulse" />
                      <p className="text-slate-450 italic max-w-xs">
                        This Case SOP chatbot is context-aware. Ask specific guidance queries like: "How do I certify the cyber log?" or "What are the rules for videography?"
                      </p>
                    </div>
                  ) : (
                    sopMessages.map((msg, idx) => (
                      <div 
                        key={idx} 
                        className={`flex flex-col max-w-[85%] ${
                          msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
                        }`}
                      >
                        <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                          msg.role === "user" 
                            ? "bg-police-700/60 border border-cyber-cyan/25 text-slate-100 rounded-tr-none" 
                            : "bg-police-950/80 border border-police-850 text-slate-300 rounded-tl-none font-sans"
                        }`}>
                          {msg.content}
                        </div>
                        <span className="text-[8px] font-mono text-slate-550 mt-1 uppercase">
                          {msg.role === "user" ? "Officer Logs" : "CrimeGPT SOP Kernel"} | {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    ))
                  )}
                  {sopLoading && (
                    <div className="flex items-center space-x-2 mr-auto bg-police-950/60 border border-police-900 p-3 rounded-xl">
                      <RefreshCw className="h-3.5 w-3.5 text-cyber-cyan animate-spin" />
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Compiling SOP guidelines...</span>
                    </div>
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* Input action form */}
                <form onSubmit={handleSendSOPMessage} className="flex gap-2.5 shrink-0 border-t border-police-900 pt-3">
                  <input
                    type="text"
                    placeholder="Ask step-by-step SOP procedures for this case..."
                    value={sopInput}
                    onChange={(e) => setSopInput(e.target.value)}
                    className="flex-1 glass-input px-3.5 py-2.5 text-xs focus:border-cyan-400"
                  />
                  <button
                    type="submit"
                    className="p-3 bg-gradient-to-tr from-police-600 to-cyber-cyan text-white rounded-xl cursor-pointer hover:shadow-cyber-glow transition-all"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>

              </div>
            )}

          </div>
        </div>

        {/* RIGHT PANEL: AI Generated Structured Draft & Citations */}
        <div className="rounded-2xl glass-panel p-6 border-glass-inset shadow-glass flex flex-col h-[700px] relative">
          
          <div className="flex items-center justify-between border-b border-police-900 pb-4 mb-4 shrink-0">
            <div className="flex items-center space-x-2">
              <Cpu className="h-5 w-5 text-cyber-cyan animate-pulse" />
              <h2 className="text-base font-bold text-white tracking-wide">AI structured Legal outputs</h2>
            </div>
            
            {firDraftText && (
              <div className="flex space-x-2">
                <button
                  onClick={() => api.downloadPDF(caseId)}
                  className="flex items-center space-x-1.5 bg-police-900 hover:bg-police-800 border border-police-850 text-slate-350 hover:text-white px-3 py-2 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer"
                  title="Download certified PDF"
                >
                  <FileDown className="h-3.5 w-3.5 text-rose-400" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={() => api.downloadDocx(caseId)}
                  className="flex items-center space-x-1.5 bg-police-900 hover:bg-police-800 border border-police-850 text-slate-350 hover:text-white px-3 py-2 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer"
                  title="Download certified DOCX"
                >
                  <FileDown className="h-3.5 w-3.5 text-blue-400" />
                  <span>DOCX</span>
                </button>
              </div>
            )}
          </div>

          {/* RAG output window */}
          <div className="flex-1 overflow-y-auto pr-1 bg-police-950/70 p-5 rounded-xl border border-police-900/60 scroll-smooth relative space-y-6">
            
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full space-y-4 py-40">
                <RefreshCw className="h-10 w-10 text-cyber-cyan animate-spin" />
                <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">RETRIEVING LAWS & DRAFTING COMPLIANT CODES...</span>
              </div>
            ) : !summary && !firDraftText ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-20">
                <Cpu className="h-10 w-10 text-slate-650 animate-pulse" />
                <p className="text-slate-450 italic text-xs max-w-sm">
                  Structured RAG classification is empty. Modify case specifications on the left, then click 'Ingest & Run AI'.
                </p>
              </div>
            ) : (
              <>
                {/* 1. Incident Summary */}
                <div className={`p-4 rounded-xl border transition-all ${
                  approvedFlags.summary 
                    ? "border-police-800/80 bg-police-900/10" 
                    : "border-dashed border-cyber-cyan/35 bg-cyber-cyan/5 shadow-[0_0_10px_rgba(6,182,212,0.05)]"
                }`}>
                  <div className="flex items-center justify-between mb-3 border-b border-police-900 pb-2">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">1. Incident summary</span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setIsEditingSummary(!isEditingSummary)}
                        className="text-[10px] text-slate-400 hover:text-white font-mono px-2 py-0.5 rounded border border-police-800"
                      >
                        {isEditingSummary ? "Cancel" : "Edit"}
                      </button>
                      <button
                        onClick={() => handleToggleFieldApproval("summary")}
                        className={`flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border transition-all ${
                          approvedFlags.summary 
                            ? "bg-emerald-950 border-emerald-500/30 text-emerald-450" 
                            : "bg-cyber-cyan/15 border-cyber-cyan/30 text-cyber-cyan animate-pulse"
                        }`}
                      >
                        {approvedFlags.summary ? <CheckCircle className="h-2.5 w-2.5" /> : null}
                        <span>{approvedFlags.summary ? "APPROVED" : "APPROVE"}</span>
                      </button>
                    </div>
                  </div>
                  
                  {isEditingSummary ? (
                    <div className="space-y-2">
                      <textarea
                        rows={3}
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                        className="w-full glass-input p-2 text-xs text-slate-200 resize-none leading-relaxed"
                      />
                      <button 
                        onClick={handleSaveSummary}
                        className="px-3 py-1 bg-police-800 hover:bg-police-700 text-white text-[10px] font-bold rounded"
                      >
                        Save Summary
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">{summary}</p>
                  )}
                </div>

                {/* 2. Act & Sections cited */}
                <div className="space-y-3">
                  <span className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">2. Recommended Legal provisions</span>
                  <div className="flex flex-wrap gap-2.5">
                    {citations.map((cite) => (
                      <button
                        key={cite.section_reference}
                        onClick={() => setActiveCitation(cite)}
                        className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          cite.approved_by_officer === 1
                            ? "bg-emerald-950/80 border-emerald-500/40 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                            : "bg-police-950 border-dashed border-cyber-cyan/30 text-cyan-400 hover:border-cyber-cyan/60"
                        }`}
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>{cite.section_reference}</span>
                        {cite.approved_by_officer === 1 && <CheckCircle className="h-3 w-3" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Editable FIR Draft */}
                <div className={`p-4 rounded-xl border transition-all ${
                  approvedFlags.fir_draft_text 
                    ? "border-police-800/80 bg-police-900/10" 
                    : "border-dashed border-cyber-cyan/35 bg-cyber-cyan/5"
                }`}>
                  <div className="flex items-center justify-between mb-3 border-b border-police-900 pb-2">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">3. First Information Report Draft</span>
                    <button
                      onClick={() => handleToggleFieldApproval("fir_draft_text")}
                      className={`flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border transition-all cursor-pointer ${
                        approvedFlags.fir_draft_text 
                          ? "bg-emerald-950 border-emerald-500/30 text-emerald-405" 
                          : "bg-cyber-cyan/15 border-cyber-cyan/30 text-cyber-cyan"
                      }`}
                    >
                      {approvedFlags.fir_draft_text ? <CheckCircle className="h-2.5 w-2.5" /> : null}
                      <span>{approvedFlags.fir_draft_text ? "APPROVED" : "APPROVE DRAFT"}</span>
                    </button>
                  </div>
                  
                  <textarea
                    rows={12}
                    value={firDraftText}
                    onChange={(e) => handleUpdateFIRText(e.target.value)}
                    className="w-full bg-transparent border-0 resize-none font-sans text-xs text-slate-300 leading-relaxed focus:ring-0 focus:outline-none scrollbar-thin"
                    placeholder="Structure draft text goes here..."
                  />
                </div>

                {/* 4. Cross-Reference Inconsistencies Warnings */}
                {validationWarnings.length > 0 && (
                  <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-xl space-y-2">
                    <div className="flex items-center space-x-2 text-amber-400 font-mono text-[10px] font-bold uppercase tracking-wider">
                      <AlertCircle className="h-4 w-4" />
                      <span>Cross-Reference Inconsistency check</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] list-disc list-inside text-slate-350 leading-relaxed font-sans">
                      {validationWarnings.map((warning, wIdx) => (
                        <li key={wIdx} className="marker:text-amber-500">{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

          </div>
        </div>

      </div>

      {/* Slide-out Citation Details Drawer */}
      {activeCitation && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
          <div 
            className="w-full max-w-lg bg-police-950 border-l border-police-900 h-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto space-y-6 animate-slide-in relative font-sans"
          >
            {/* Close Button */}
            <button 
              onClick={() => setActiveCitation(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-police-900"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-6">
              <div className="space-y-1 pb-4 border-b border-police-900">
                <span className="text-[9px] font-mono text-cyan-400 font-black tracking-widest uppercase">LEGAL CITATION AUDIT</span>
                <h3 className="text-lg font-black text-white">{activeCitation.section_reference}</h3>
                <span className="text-xs text-slate-450 font-bold">{activeCitation.act} • {activeCitation.title}</span>
              </div>

              <div className="space-y-4 text-xs leading-relaxed">
                <div className="space-y-1">
                  <span className="block text-[9px] text-slate-500 font-mono uppercase font-bold tracking-wider">Justification Analysis</span>
                  <p className="p-3.5 bg-police-900/30 rounded-xl border border-police-850 text-slate-300 italic font-medium font-sans">
                    {activeCitation.justification}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="block text-[9px] text-slate-500 font-mono uppercase font-bold tracking-wider">Exact Legal Source Passage</span>
                  <p className="p-4 bg-police-950 border border-police-900 rounded-xl text-slate-300 font-mono text-[11px] leading-relaxed select-all">
                    {activeCitation.citation_text}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-police-900 pt-4">
                  <div>
                    <span className="block text-[9px] text-slate-500 font-mono uppercase font-bold">RAG Retrieval Confidence</span>
                    <span className="text-base font-black text-cyber-cyan font-mono mt-1 block">
                      {activeCitation.confidence_score}% Match
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-500 font-mono uppercase font-bold">Old Law Equivalent</span>
                    <span className="text-sm font-bold text-slate-300 font-mono mt-1 block">
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

            <div className="pt-4 border-t border-police-900 flex space-x-3">
              <button
                onClick={() => handleApproveCitation(activeCitation.section_reference, activeCitation.approved_by_officer)}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  activeCitation.approved_by_officer === 1
                    ? "bg-emerald-950 hover:bg-emerald-900 border-emerald-500/30 text-emerald-400"
                    : "bg-police-900 hover:bg-police-850 border-police-800 text-slate-300 hover:text-white"
                }`}
              >
                <CheckSquare className="h-4 w-4" />
                <span>{activeCitation.approved_by_officer === 1 ? "Citation Approved" : "Approve Citation"}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
