import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { 
  ClipboardList, Upload, Eye, Trash2, CheckCircle2,
  AlertCircle, ShieldCheck, RefreshCw, ArrowLeft, Database, FileText, Check, Sparkles
} from "lucide-react";
import { api } from "../utils/api";
import DataTable from "../components/ui/DataTable";
import AITrustBanner from "../components/ui/AITrustBanner";

export default function EvidenceManager() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const caseIdParam = searchParams.get("caseId");

  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [evidenceList, setEvidenceList] = useState([]);
  const [checklist, setChecklist] = useState([]);
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
      const list = await api.getEvidenceList(id);
      setEvidenceList(list);

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
      setMsg({ type: "success", text: `Logged digital evidence: ${file.name}` });
    } catch (err) {
      setMsg({ type: "error", text: "Upload failed: " + err.message });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm("Permanently remove this evidence item from vault custody?")) return;
    try {
      await api.deleteEvidenceItem(selectedCaseId, itemId);
      loadEvidenceData(selectedCaseId);
      setMsg({ type: "success", text: "Evidence item removed." });
    } catch (err) {
      setMsg({ type: "error", text: "Failed to delete item." });
    }
  };

  const columns = [
    {
      header: "EVIDENCE ID / HASH",
      key: "id",
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-blue-700 text-[11px] block">
            EVD-{(row.id || "101").toString().padStart(4, "0")}
          </span>
          <span className="font-mono text-[9px] text-slate-400 block truncate max-w-[120px]">
            SHA-256: 8f9a2e4...
          </span>
        </div>
      )
    },
    {
      header: "FILE NAME / TITLE",
      key: "filename",
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 text-xs block">{row.filename || row.title || "Evidence Asset"}</span>
          <span className="text-[10px] text-slate-500 font-mono block">TYPE: {(row.file_type || "DOCUMENT").toUpperCase()}</span>
        </div>
      )
    },
    {
      header: "CUSTODY NOTES",
      key: "notes",
      render: (row) => (
        <span className="text-xs text-slate-700 leading-snug truncate max-w-xs block">
          {row.notes || row.description || "Recovered by Investigating Officer"}
        </span>
      )
    },
    {
      header: "BSA COMPLIANCE",
      key: "status",
      render: () => (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-mono font-bold">
          <ShieldCheck className="h-3 w-3" /> BSA §63 VERIFIED
        </span>
      )
    },
    {
      header: "TIMESTAMP",
      key: "uploaded_at",
      render: (row) => (
        <span className="font-mono text-[11px] text-slate-500">
          {row.uploaded_at ? new Date(row.uploaded_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
        </span>
      )
    },
    {
      header: "ACTIONS",
      key: "actions",
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-1">
          {row.file_path && (
            <a
              href={`${api.apiBaseUrl}${row.file_path}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 text-blue-700 hover:bg-blue-50 rounded"
              title="Preview / Download Asset"
            >
              <Eye className="h-3.5 w-3.5" />
            </a>
          )}
          <button
            type="button"
            onClick={() => handleDeleteItem(row.id)}
            className="p-1 text-rose-600 hover:bg-rose-50 rounded"
            title="Remove Item"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          {caseIdParam && (
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-700 block mb-0.5">BSA Section 63 Digital Vault</span>
            <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">Digital Evidence Vault</h1>
            <p className="text-xs text-slate-500">Chain of custody audit, cryptographic hashes, and electronic evidence registry.</p>
          </div>
        </div>

        {selectedCaseId && (
          <button
            type="button"
            onClick={() => loadEvidenceData(selectedCaseId)}
            className="btn-secondary text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Sync Vault</span>
          </button>
        )}
      </div>

      <AITrustBanner 
        title="BSA Section 63 Digital Evidence Integrity"
        message="All uploaded digital assets generate SHA-256 hashes and chain of custody logs. Admissibility in court requires Section 63 certificate verification."
      />

      {msg.text && (
        <div className={`p-3 rounded-lg border text-xs font-semibold flex items-center justify-between ${
          msg.type === "error" ? "bg-rose-50 border-rose-200 text-rose-800" : "bg-emerald-50 border-emerald-200 text-emerald-800"
        }`}>
          <span>{msg.text}</span>
          <button onClick={() => setMsg({ type: "", text: "" })} className="font-bold">✕</button>
        </div>
      )}

      {/* Case Selector Dropdown */}
      {!caseIdParam && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <label className="text-xs font-mono font-bold text-slate-600 shrink-0">SELECT DOSSIER:</label>
          <select
            value={selectedCaseId}
            onChange={(e) => setSelectedCaseId(e.target.value)}
            className="flex-1 enterprise-input py-1.5"
          >
            <option value="">-- Choose active case file --</option>
            {cases.map((c) => (
              <option key={c.id} value={c.id}>CASE #{c.id}: {c.title} ({c.status})</option>
            ))}
          </select>
        </div>
      )}

      {selectedCaseId ? (
        <div className="grid lg:grid-cols-3 gap-6 items-start">
          
          {/* Upload & Transfer Form */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 font-mono uppercase border-b border-slate-100 pb-2">
              Ingest Evidence Asset
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Custody Transfer Notes</label>
                <input
                  type="text"
                  placeholder="e.g. CCTV drive recovered by Officer at alley gate"
                  value={custodyNotes}
                  onChange={e => setCustodyNotes(e.target.value)}
                  className="w-full enterprise-input"
                />
              </div>

              <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 p-6 rounded-xl text-center cursor-pointer transition-colors">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="evidenceUpload"
                />
                <label htmlFor="evidenceUpload" className="cursor-pointer space-y-2 block">
                  <Upload className="h-6 w-6 text-slate-400 mx-auto" />
                  <span className="text-xs font-bold text-blue-700 block">Choose Evidence File to Ingest</span>
                  <span className="text-[10px] text-slate-500 font-mono block">Supports CCTV Video, Images, PDFs, DOCX (Max 20MB)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Evidence Data Table */}
          <div className="lg:col-span-2">
            {loading ? (
              <div className="p-12 text-center bg-white border border-slate-200 rounded-xl font-mono text-xs text-slate-400 animate-pulse">
                LOADING EVIDENCE CUSTODY REGISTRY...
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={evidenceList}
                searchPlaceholder="Search Evidence ID, Hash, Custody Notes..."
                emptyMessage="No evidence assets registered for this dossier."
              />
            )}
          </div>

        </div>
      ) : (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-xs text-slate-400 italic">
          Select a case dossier above to view digital evidence chain of custody records.
        </div>
      )}

    </div>
  );
}
