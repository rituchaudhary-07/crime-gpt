import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { 
  FileText, FileDown, Printer, AlertCircle, 
  RefreshCw, CheckCircle2, Save, ArrowLeft, ShieldCheck, Check, Sparkles, Download
} from "lucide-react";
import { api } from "../utils/api";
import AITrustBanner from "../components/ui/AITrustBanner";
import LegalBadge from "../components/ui/LegalBadge";

export default function FIRGenerator() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const caseIdParam = searchParams.get("caseId");

  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [activeStep, setActiveStep] = useState(1); // 1: Select/Incident, 2: Complainant & Accused, 3: Provisions, 4: Review & Sign

  // Editor states
  const [district, setDistrict] = useState("Cyber Crimes Division");
  const [firNumber, setFirNumber] = useState("");
  const [occurrenceDate, setOccurrenceDate] = useState("");
  const [occurrencePlace, setOccurrencePlace] = useState("");
  const [complainantName, setComplainantName] = useState("State of India / Public Complainant");
  const [accusedDetails, setAccusedDetails] = useState("Unknown / Under Cyber Tracing");
  const [narrativeText, setNarrativeText] = useState("");
  const [chargeProvisions, setChargeProvisions] = useState("BNS Section 303, BNSS Section 173, BSA Section 63");
  const [isDigitallySigned, setIsDigitallySigned] = useState(true);

  const wizardSteps = [
    { num: 1, label: "Incident Details" },
    { num: 2, label: "Complainant & Accused" },
    { num: 3, label: "Statutory Charges" },
    { num: 4, label: "Review & Sign" }
  ];

  useEffect(() => {
    loadAllCases();
  }, []);

  useEffect(() => {
    if (caseIdParam) {
      setSelectedCaseId(caseIdParam);
      loadCaseFIR(caseIdParam);
    } else if (selectedCaseId) {
      loadCaseFIR(selectedCaseId);
    }
  }, [caseIdParam, selectedCaseId]);

  const loadAllCases = async () => {
    try {
      const data = await api.getCases();
      setCases(data);
    } catch (e) {
      console.log("Failed loading cases list:", e);
    }
  };

  const loadCaseFIR = async (id) => {
    setLoading(true);
    setError("");
    try {
      const details = await api.getCase(id);
      setOccurrencePlace(details.location || "Jurisdiction CCPS");
      setOccurrenceDate(details.date || new Date().toISOString().split('T')[0]);
      setFirNumber(`CR-FIR-2026-N${1000 + parseInt(id)}`);
      
      try {
        const draft = await api.getFIRDraft(id);
        setNarrativeText(draft.fir_draft_text || details.description);
        setComplainantName(draft.incident_summary ? draft.incident_summary.split(" ")[0] : "State");
        
        const codes = draft.citations.map(c => `${c.act || 'BNS'} ${c.section_reference}`).join(", ");
        setChargeProvisions(codes || "BNS Section 303, BNS Section 329, BSA Section 63");
      } catch (draftErr) {
        setNarrativeText(details.description || "");
        setChargeProvisions("BNS Section 303, BSA Section 63");
      }
    } catch (err) {
      setError("Failed to resolve Case details: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    setError("");
    try {
      await api.updateFIRDraft(selectedCaseId, {
        fir_draft_text: narrativeText,
        incident_summary: `FIR filed for ${complainantName}. Statutory charges: ${chargeProvisions}.`
      });
      setError("FIR Draft saved successfully.");
      setTimeout(() => setError(""), 3000);
    } catch (err) {
      setError("Save failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

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
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-700 block mb-0.5">BNSS Section 173 Compliance</span>
            <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">FIR Document Generator</h1>
            <p className="text-xs text-slate-500">Draft, verify statutory provisions, and export formal First Information Reports.</p>
          </div>
        </div>

        {selectedCaseId && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saving}
              className="btn-secondary text-xs"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{saving ? "Saving..." : "Save Draft"}</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="btn-secondary text-xs"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={() => api.downloadPDF(selectedCaseId)}
              className="btn-primary text-xs"
            >
              <FileDown className="h-3.5 w-3.5" />
              <span>Export PDF</span>
            </button>
          </div>
        )}
      </div>

      <AITrustBanner 
        title="Official FIR Drafting Compliance"
        message="Generated FIR narrative and statutory sections are subject to investigator verification under BNSS Section 173 before signing and registering in official CCTNS."
      />

      {error && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-blue-600 font-bold">✕</button>
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
            <option value="">-- Select active investigation file --</option>
            {cases.map((c) => (
              <option key={c.id} value={c.id}>CASE #{c.id}: {c.title} ({c.status})</option>
            ))}
          </select>
        </div>
      )}

      {/* Multi-Step Progress Wizard Indicator */}
      {selectedCaseId && (
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="grid grid-cols-4 gap-2">
            {wizardSteps.map(st => {
              const isCurrent = activeStep === st.num;
              const isPassed = activeStep > st.num;
              return (
                <button
                  key={st.num}
                  type="button"
                  onClick={() => setActiveStep(st.num)}
                  className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                    isCurrent 
                      ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold shadow-2xs'
                      : isPassed
                      ? 'bg-slate-50 border-slate-200 text-emerald-700 font-medium'
                      : 'bg-white border-slate-200 text-slate-400 font-medium'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono mb-0.5">
                    <span>STEP 0{st.num}</span>
                    {isPassed && <Check className="h-3 w-3 text-emerald-600" />}
                  </div>
                  <span className="text-xs truncate block">{st.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Split View: Guided Wizard Editor vs Live Document Canvas */}
      {selectedCaseId ? (
        <div className="grid lg:grid-cols-2 gap-6 items-start">
          
          {/* Left Panel: Step Editor Forms */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            
            {activeStep === 1 && (
              <div className="space-y-3 text-xs">
                <span className="text-xs font-bold text-slate-900 font-mono uppercase block border-b border-slate-100 pb-2">
                  Step 1: Incident &amp; Station Details
                </span>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Police District &amp; Station</label>
                  <input
                    type="text"
                    value={district}
                    onChange={e => setDistrict(e.target.value)}
                    className="w-full enterprise-input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">FIR Number</label>
                    <input
                      type="text"
                      value={firNumber}
                      onChange={e => setFirNumber(e.target.value)}
                      className="w-full enterprise-input font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">Occurrence Date</label>
                    <input
                      type="date"
                      value={occurrenceDate}
                      onChange={e => setOccurrenceDate(e.target.value)}
                      className="w-full enterprise-input font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Place of Occurrence</label>
                  <input
                    type="text"
                    value={occurrencePlace}
                    onChange={e => setOccurrencePlace(e.target.value)}
                    className="w-full enterprise-input"
                  />
                </div>
              </div>
            )}

            {activeStep === 2 && (
              <div className="space-y-3 text-xs">
                <span className="text-xs font-bold text-slate-900 font-mono uppercase block border-b border-slate-100 pb-2">
                  Step 2: Complainant &amp; Accused Data
                </span>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Complainant / Informant Name</label>
                  <input
                    type="text"
                    value={complainantName}
                    onChange={e => setComplainantName(e.target.value)}
                    className="w-full enterprise-input"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Accused Details &amp; Identifiers</label>
                  <input
                    type="text"
                    value={accusedDetails}
                    onChange={e => setAccusedDetails(e.target.value)}
                    className="w-full enterprise-input"
                  />
                </div>
              </div>
            )}

            {activeStep === 3 && (
              <div className="space-y-3 text-xs">
                <span className="text-xs font-bold text-slate-900 font-mono uppercase block border-b border-slate-100 pb-2">
                  Step 3: Statutory Charges &amp; Narrative
                </span>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Applicable Statutory Sections (BNS 2023 / BSA 2023)</label>
                  <input
                    type="text"
                    value={chargeProvisions}
                    onChange={e => setChargeProvisions(e.target.value)}
                    className="w-full enterprise-input font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">FIR Narrative Draft (Facts of the Offence)</label>
                  <textarea
                    rows={8}
                    value={narrativeText}
                    onChange={e => setNarrativeText(e.target.value)}
                    className="w-full enterprise-input text-xs leading-relaxed"
                  />
                </div>
              </div>
            )}

            {activeStep === 4 && (
              <div className="space-y-3 text-xs">
                <span className="text-xs font-bold text-slate-900 font-mono uppercase block border-b border-slate-100 pb-2">
                  Step 4: Investigator Sign-off &amp; Seal
                </span>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-emerald-900 text-xs">BNSS Section 173 Electronic Signature Active</p>
                    <p className="text-[11px] text-emerald-800 mt-0.5">Dossier marked for CCTNS registration with cryptographic timestamp.</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="digitalSign"
                    checked={isDigitallySigned}
                    onChange={e => setIsDigitallySigned(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <label htmlFor="digitalSign" className="text-xs font-semibold text-slate-800 cursor-pointer">
                    Apply Officer Digital Signature Certificate (DSC)
                  </label>
                </div>
              </div>
            )}

            {/* Wizard Navigation Buttons */}
            <div className="flex items-center justify-between border-t border-slate-200 pt-3">
              <button
                type="button"
                disabled={activeStep === 1}
                onClick={() => setActiveStep(prev => Math.max(prev - 1, 1))}
                className="btn-secondary text-xs disabled:opacity-40"
              >
                &larr; Previous Step
              </button>

              <button
                type="button"
                disabled={activeStep === 4}
                onClick={() => setActiveStep(prev => Math.min(prev + 1, 4))}
                className="btn-primary text-xs disabled:opacity-40"
              >
                <span>Next Step</span>
                &rarr;
              </button>
            </div>

          </div>

          {/* Right Panel: Formal Paper Document Preview Canvas */}
          <div className="bg-white p-8 rounded-xl border border-slate-300 shadow-md space-y-6 text-slate-900 font-sans print:shadow-none print:border-none">
            
            <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-600 block">FORM NO. 5.1 — POLICE DEPARTMENT</span>
              <h2 className="text-lg font-black tracking-tight text-slate-950 uppercase">FIRST INFORMATION REPORT</h2>
              <p className="text-xs font-semibold text-slate-700 uppercase">(Under Section 173 Bharatiya Nagarik Suraksha Sanhita, 2023)</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono border-b border-slate-200 pb-3">
              <div>
                <span className="text-slate-500 block text-[10px]">DISTRICT &amp; STATION:</span>
                <span className="font-bold text-slate-900">{district}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">FIR NUMBER:</span>
                <span className="font-bold text-blue-800">{firNumber || "CR-FIR-2026-N1001"}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">DATE OF OCCURRENCE:</span>
                <span className="font-bold text-slate-900">{occurrenceDate || "N/A"}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">PLACE OF INCIDENT:</span>
                <span className="font-bold text-slate-900">{occurrencePlace || "N/A"}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">ACTS &amp; STATUTORY SECTIONS CITED</span>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded font-mono font-bold text-blue-900 text-xs">
                {chargeProvisions || "BNS Section 303, BSA Section 63"}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">FACTS OF THE OFFENCE (FIR NARRATIVE)</span>
              <div className="p-3 bg-slate-50/60 border border-slate-200 rounded text-xs leading-relaxed font-sans text-slate-900 min-h-[140px] whitespace-pre-wrap">
                {narrativeText || "Narrative text loading..."}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-300 flex items-center justify-between text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-500 block">COMPLAINANT / INFORMANT</span>
                <span className="font-bold text-slate-900">{complainantName}</span>
              </div>

              <div className="text-right space-y-1">
                <span className="text-[10px] text-slate-500 block">INVESTIGATING OFFICER SEAL</span>
                {isDigitallySigned ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-bold border border-emerald-300 bg-emerald-50 px-2 py-0.5 rounded text-[10px]">
                    <CheckCircle2 className="h-3 w-3" /> DSC DIGITALLY SIGNED
                  </span>
                ) : (
                  <span className="text-slate-400 italic">Pending Officer Sign-off</span>
                )}
              </div>
            </div>

          </div>

        </div>
      ) : (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-xs text-slate-400 italic">
          Select an active case dossier from the dropdown to initialize FIR drafting workflow.
        </div>
      )}

    </div>
  );
}
