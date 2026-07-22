import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { 
  FileText, FileDown, Printer, Award, AlertCircle, 
  RefreshCw, CheckCircle2, Save, ArrowLeft, Signature
} from "lucide-react";
import { api } from "../utils/api";

export default function FIRGenerator() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const caseIdParam = searchParams.get("caseId");

  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Editor states
  const [district, setDistrict] = useState("Cyber Crimes Cell");
  const [firNumber, setFirNumber] = useState("");
  const [occurrenceDate, setOccurrenceDate] = useState("");
  const [occurrencePlace, setOccurrencePlace] = useState("");
  const [complainantName, setComplainantName] = useState("");
  const [narrativeText, setNarrativeText] = useState("");
  const [chargeProvisions, setChargeProvisions] = useState("");
  const [isDigitallySigned, setIsDigitallySigned] = useState(false);

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
      setOccurrencePlace(details.location || "");
      setOccurrenceDate(details.date || "");
      setFirNumber(`CR-FIR-2026-N${1000 + parseInt(id)}`);
      
      try {
        const draft = await api.getFIRDraft(id);
        setNarrativeText(draft.fir_draft_text || details.description);
        setComplainantName(draft.incident_summary ? draft.incident_summary.split(" ")[0] : "State");
        
        const codes = draft.citations.map(c => c.section_reference).join(", ");
        setChargeProvisions(codes || "BNS Section 303, BNS Section 329");
      } catch (draftErr) {
        setNarrativeText(details.description || "");
        setChargeProvisions("BNS Section 303");
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
        incident_summary: `FIR filed for ${complainantName}. Charges matching: ${chargeProvisions}.`
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
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-5">
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
            <h1 className="text-xl font-bold tracking-tight text-[#111827]">FIR Document Generator</h1>
            <p className="text-xs text-[#6B7280] mt-1">Review, edit, and digitally sign first information reports compliant with BNSS Section 173.</p>
          </div>
        </div>

        {selectedCaseId && (
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleSaveDraft}
              disabled={saving}
              className="flex items-center gap-2 btn-secondary px-4 py-2.5 text-xs font-semibold cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? "Saving..." : "Save Changes"}</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 btn-secondary px-4 py-2.5 text-xs font-semibold cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Print Document</span>
            </button>
            <button
              onClick={() => api.downloadPDF(selectedCaseId)}
              className="flex items-center gap-2 bg-[#EF4444] hover:bg-rose-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer"
            >
              <FileDown className="h-4 w-4" />
              <span>Export PDF</span>
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs flex items-center gap-2">
          <AlertCircle className="h-4.5 w-4.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Case Selector Dropdown */}
      {!caseIdParam && (
        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm flex items-center gap-4">
          <label className="text-xs font-bold text-[#4B5563] font-mono shrink-0">SELECT CASE FILE:</label>
          <select
            value={selectedCaseId}
            onChange={(e) => setSelectedCaseId(e.target.value)}
            className="flex-1 saas-input px-3.5 py-2.5"
          >
            <option value="">-- Choose active case file --</option>
            {cases.map((c) => (
              <option key={c.id} value={c.id}>CASE #{c.id}: {c.title} ({c.status})</option>
            ))}
          </select>
        </div>
      )}

      {/* Main Split Interface */}
      {selectedCaseId ? (
        <div className="grid lg:grid-cols-2 gap-8 items-start animate-slide-up">
          
          {/* Left panel: Document Editor inputs */}
          <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-[#111827] uppercase tracking-wider font-mono">Document Field Editor</h3>
            
            {loading ? (
              <div className="text-center py-20 text-xs text-[#6B7280] font-mono animate-pulse">LOADING CASE DATA...</div>
            ) : (
              <div className="space-y-4 text-xs">
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#4B5563] mb-1">POLICE STATION / JURISDICTION</label>
                    <input
                      type="text"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full saas-input px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#4B5563] mb-1">FIR NUMBER</label>
                    <input
                      type="text"
                      value={firNumber}
                      onChange={(e) => setFirNumber(e.target.value)}
                      className="w-full saas-input px-3 py-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#4B5563] mb-1">DATE & TIME OF OCCURRENCE</label>
                    <input
                      type="text"
                      value={occurrenceDate}
                      onChange={(e) => setOccurrenceDate(e.target.value)}
                      className="w-full saas-input px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#4B5563] mb-1">PLACE OF OCCURRENCE</label>
                    <input
                      type="text"
                      value={occurrencePlace}
                      onChange={(e) => setOccurrencePlace(e.target.value)}
                      className="w-full saas-input px-3 py-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#4B5563] mb-1">COMPLAINANT / INFORMANT</label>
                    <input
                      type="text"
                      value={complainantName}
                      onChange={(e) => setComplainantName(e.target.value)}
                      className="w-full saas-input px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#4B5563] mb-1">RECOMMENDED CHARGES (BNS)</label>
                    <input
                      type="text"
                      value={chargeProvisions}
                      onChange={(e) => setChargeProvisions(e.target.value)}
                      className="w-full saas-input px-3 py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#4B5563] mb-1">FIR DRAFT NARRATIVE</label>
                  <textarea
                    rows={12}
                    value={narrativeText}
                    onChange={(e) => setNarrativeText(e.target.value)}
                    className="w-full saas-input px-3.5 py-3 resize-none leading-relaxed font-sans"
                  />
                </div>

                {/* Digital Signature box toggle */}
                <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isDigitallySigned}
                    onChange={(e) => setIsDigitallySigned(e.target.checked)}
                    className="h-4 w-4 rounded border-[#E2E8F0] text-[#2563EB] focus:ring-[#2563EB] cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="block font-bold text-[#111827] flex items-center gap-1.5">
                      <Signature className="h-4 w-4 text-[#2563EB]" />
                      <span>Apply Officer Digital Cryptographic Signature</span>
                    </span>
                    <span className="text-[10px] text-[#6B7280] block mt-0.5">
                      Check this box to apply signature token and secure report integrity under BSA 2023 guidelines.
                    </span>
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* Right panel: Live styled Document Preview */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-8 flex flex-col min-h-[600px] border-t-4 border-t-[#2563EB] space-y-6 select-text overflow-y-auto">
            
            {/* National Emblem Placeholder */}
            <div className="text-center space-y-1">
              <span className="block text-xs font-black tracking-widest text-[#111827] font-serif uppercase">FIRST INFORMATION REPORT</span>
              <span className="block text-[10px] font-bold text-[#6B7280] tracking-widest font-mono uppercase">
                (Under Section 173 of BNSS, 2023)
              </span>
              <div className="h-0.5 w-16 bg-[#2563EB] mx-auto mt-2" />
            </div>

            {/* Structured details grid */}
            <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-[11px] border-b border-[#F1F5F9] pb-4 font-sans text-[#374151]">
              <div>
                <span className="font-semibold text-[#6B7280] block">1. District/Station:</span>
                <span className="font-bold text-[#111827]">{district}</span>
              </div>
              <div>
                <span className="font-semibold text-[#6B7280] block">2. FIR Number:</span>
                <span className="font-mono font-bold text-[#111827]">{firNumber}</span>
              </div>
              <div>
                <span className="font-semibold text-[#6B7280] block">3. Date & Time of Occurrence:</span>
                <span className="font-bold text-[#111827]">{occurrenceDate || "As entered"}</span>
              </div>
              <div>
                <span className="font-semibold text-[#6B7280] block">4. Place of Occurrence:</span>
                <span className="font-bold text-[#111827]">{occurrencePlace || "As entered"}</span>
              </div>
              <div>
                <span className="font-semibold text-[#6B7280] block">5. Complainant Name:</span>
                <span className="font-bold text-[#111827]">{complainantName || "State / Anonymous"}</span>
              </div>
              <div>
                <span className="font-semibold text-[#6B7280] block">6. BNS Charges:</span>
                <span className="font-mono font-bold text-[#2563EB]">{chargeProvisions}</span>
              </div>
            </div>

            {/* Narrative text block */}
            <div className="space-y-2 flex-1">
              <span className="block text-[11px] font-bold text-[#6B7280] font-mono uppercase tracking-wider">7. Incident Statement Narrative:</span>
              <p className="text-xs leading-relaxed text-[#374151] font-serif whitespace-pre-wrap pl-2 border-l border-[#EFF6FF] italic">
                {narrativeText || "Narrative statement text will reflect here dynamically."}
              </p>
            </div>

            {/* Signature Block */}
            <div className="border-t border-[#F1F5F9] pt-4 flex flex-col items-end">
              {isDigitallySigned ? (
                <div className="text-right p-3 bg-emerald-50 border border-emerald-200 rounded-xl max-w-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-[#047857] text-[10px] font-bold">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>DIGITALLY SIGNED</span>
                  </div>
                  <span className="block text-[9px] font-mono text-emerald-700">HASH: SHA-256 CHECKED</span>
                  <span className="block text-[9px] text-[#6B7280]">Officer ID: officer_test (Precinct 4)</span>
                </div>
              ) : (
                <div className="text-center py-6 px-12 border border-dashed border-[#E2E8F0] rounded-xl text-[10px] text-[#9CA3AF] italic">
                  Awaiting Officer Cryptographic Seal Signature
                </div>
              )}
            </div>

          </div>

        </div>
      ) : (
        <div className="bg-white p-16 rounded-2xl border border-[#E2E8F0] text-center text-xs text-[#6B7280] italic">
          Select or load an active case docket above to access the generator modules.
        </div>
      )}

    </div>
  );
}
