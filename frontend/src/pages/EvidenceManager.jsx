import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { 
  ClipboardList, Upload, Eye, Trash2, CheckCircle2,
  AlertCircle, ShieldCheck, RefreshCw, ArrowLeft, Database, CheckSquare
} from "lucide-react";
import { api } from "../utils/api";

export default function EvidenceManager() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const caseIdParam = searchParams.get("caseId");

  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [evidenceList, setEvidenceList] = useState([]);
  const [checklist, setChecklist] = useState([]);
  const [checkedItems, setCheckedItems] = useState({});
  const [custodyNotes, setCustodyNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    loadAllCases();
  }, []);

  useEffect(() => {
    if (caseIdParam) {
      setSelectedCaseId(caseIdParam);
      loadEvidenceData(caseIdParam);
    } else if (selectedCaseId) {
      loadEvidenceData(selectedCaseId);
    }
  }, [caseIdParam, selectedCaseId]);

  const loadAllCases = async () => {
    try {
      const data = await api.getCases();
      setCases(data);
    } catch (e) {
      console.log("Failed loading cases:", e);
    }
  };

  const loadEvidenceData = async (id) => {
    setLoading(true);
    setMsg({ type: "", text: "" });
    try {
      // 1. Get uploaded files checklist
      const list = await api.getEvidenceList(id);
      setEvidenceList(list);

      // 2. Get AI checklists from draft file if exists
      try {
        const draft = await api.getFIRDraft(id);
        setChecklist(draft.evidence_checklist || []);
      } catch (draftErr) {
        setChecklist([]);
      }
    } catch (err) {
      setMsg({ type: "error", text: "Failed loading evidence logs: " + err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!selectedCaseId) {
      setMsg({ type: "error", text: "Select a case file first." });
      return;
    }
    
    setUploading(true);
    setMsg({ type: "", text: "" });
    try {
      await api.uploadEvidenceFile(selectedCaseId, file, custodyNotes);
      setCustodyNotes("");
      loadEvidenceData(selectedCaseId);
      setMsg({ type: "success", text: `Logged evidence: ${file.name}` });
    } catch (err) {
      setMsg({ type: "error", text: "Upload failed: " + err.message });
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateNotes = async (itemId, type, notes) => {
    try {
      await api.updateEvidenceItem(selectedCaseId, itemId, type, notes);
      loadEvidenceData(selectedCaseId);
    } catch (err) {
      setMsg({ type: "error", text: "Failed updating notes." });
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm("Permanently delete this evidence item from custody registry?")) return;
    try {
      await api.deleteEvidenceItem(selectedCaseId, itemId);
      loadEvidenceData(selectedCaseId);
      setMsg({ type: "success", text: "Evidence removed." });
    } catch (err) {
      setMsg({ type: "error", text: "Failed to delete item." });
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        {caseIdParam && (
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 bg-white border border-[#E2E8F0] rounded-xl hover:bg-[#F8FAFC] text-[#4B5563]"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#111827]">Secure Evidence Management</h1>
          <p className="text-xs text-[#6B7280] mt-1">Audit chain of custody records and document compliance under the new Bharatiya Sakshya Adhiniyam (BSA) 2023.</p>
        </div>
      </div>

      {msg.text && (
        <div className={`p-4 rounded-xl flex items-center gap-2 text-xs border ${
          msg.type === "error" ? "bg-red-50 border-red-200 text-red-600" : "bg-emerald-50 border-emerald-200 text-emerald-600"
        }`}>
          <AlertCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{msg.text}</span>
        </div>
      )}

      {/* Case Selection Dropdown */}
      {!caseIdParam && (
        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm flex items-center gap-4">
          <label className="text-xs font-bold text-[#4B5563] font-mono shrink-0">SELECT CASE FILE:</label>
          <select
            value={selectedCaseId}
            onChange={(e) => setSelectedCaseId(e.target.value)}
            className="flex-1 saas-input px-3.5 py-2.5"
          >
            <option value="">-- Choose active case log --</option>
            {cases.map((c) => (
              <option key={c.id} value={c.id}>CASE #{c.id}: {c.title} ({c.status})</option>
            ))}
          </select>
        </div>
      )}

      {selectedCaseId ? (
        <div className="grid md:grid-cols-2 gap-8 items-start animate-slide-up">
          
          {/* Left panel: Secure Upload / Registry Logs */}
          <div className="space-y-6">
            
            {/* Upload form card */}
            <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-[#111827] uppercase tracking-wider font-mono">1. Register Trial Custody Evidence</h3>
              
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-[#4B5563] mb-1">CUSTODY TRANSFER NOTES</label>
                  <input
                    type="text"
                    placeholder="e.g. CCTV drive recovered by Officer at alley gate"
                    value={custodyNotes}
                    onChange={(e) => setCustodyNotes(e.target.value)}
                    className="w-full saas-input px-3 py-2"
                  />
                </div>

                <div className="relative border-2 border-dashed border-[#E2E8F0] rounded-xl p-8 text-center hover:border-[#2563EB]/40 transition-colors cursor-pointer bg-[#F8FAFC]">
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="h-6 w-6 text-[#9CA3AF] mx-auto mb-2" />
                  <span className="text-[10px] text-[#6B7280] font-semibold block">
                    {uploading ? "COMPILING FILE HASH..." : "CLICK OR DRAG EVIDENCE FILE METADATA TO LOG"}
                  </span>
                </div>
              </div>
            </div>

            {/* Evidence items database lists */}
            <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-[#111827] uppercase tracking-wider font-mono">2. Chain of Custody Registry ({evidenceList.length})</h3>
              {loading ? (
                <div className="text-center py-6 text-xs text-[#6B7280] font-mono animate-pulse">QUERYING REGISTRY...</div>
              ) : evidenceList.length === 0 ? (
                <p className="text-[#6B7280] italic text-xs py-2">No documents currently registered under secure custody.</p>
              ) : (
                <div className="space-y-4">
                  {evidenceList.map((file) => (
                    <div key={file.id} className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-3 relative group">
                      
                      <button
                        onClick={() => handleDeleteItem(file.id)}
                        className="absolute top-3 right-3 text-[#9CA3AF] hover:text-[#EF4444] cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove evidence"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>

                      <div className="space-y-1">
                        <span className="block text-xs font-bold text-[#111827] truncate pr-6">{file.filename}</span>
                        <div className="flex items-center gap-1.5 text-[9px] font-mono text-[#059669]">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          <span>MD5 HASH SECURED LOG</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-[10px]">
                        <div>
                          <label className="block text-[9px] text-[#6B7280] font-mono uppercase mb-0.5">Classification</label>
                          <select
                            value={file.file_type}
                            onChange={(e) => handleUpdateNotes(file.id, e.target.value, file.custody_notes)}
                            className="w-full saas-input px-2 py-1 text-[10px]"
                          >
                            <option value="CCTV">CCTV Footage</option>
                            <option value="Document">Seized Document</option>
                            <option value="ID Proof">Official ID Proof</option>
                            <option value="Chat Log">Cyber Chat Log</option>
                            <option value="Other">Other Material</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] text-[#6B7280] font-mono uppercase mb-0.5">Custody Notes</label>
                          <input
                            type="text"
                            value={file.custody_notes || ""}
                            onChange={(e) => handleUpdateNotes(file.id, file.file_type, e.target.value)}
                            className="w-full saas-input px-2 py-1 text-[10px]"
                          />
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right panel: Admissibility checklist guidelines */}
          <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-[#111827] uppercase tracking-wider font-mono">3. Legal Admissibility Checklist (BSA 2023)</h3>
            <p className="text-[11px] text-[#6B7280] leading-relaxed">
              Ensure all files matching BNS recommendations are recorded below. Missing hashes or checksum certification stamps could disqualify items in courtroom trial hearings.
            </p>

            {checklist.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-[#E2E8F0] text-center text-xs text-[#6B7280] italic bg-[#F8FAFC]">
                No checklist generated. Perform AI analysis on this case first to calculate requirements.
              </div>
            ) : (
              <div className="space-y-3">
                {checklist.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-[#F8FAFC] transition-colors text-xs">
                    <input
                      type="checkbox"
                      checked={!!checkedItems[idx]}
                      onChange={(e) => setCheckedItems(prev => ({ ...prev, [idx]: e.target.checked }))}
                      className="mt-0.5 rounded border-[#E2E8F0] text-[#2563EB] focus:ring-[#2563EB] h-4 w-4 cursor-pointer"
                    />
                    <span className={`leading-relaxed ${checkedItems[idx] ? "line-through text-[#9CA3AF] font-medium" : "text-[#374151] font-semibold"}`}>
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      ) : (
        <div className="bg-white p-16 rounded-2xl border border-[#E2E8F0] text-center text-xs text-[#6B7280] italic">
          Select or load an active case docket above to access evidence manager modules.
        </div>
      )}

    </div>
  );
}
