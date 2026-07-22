import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FilePlus, User, ShieldAlert, ClipboardList, 
  Users, CheckCircle2, ChevronRight, ChevronLeft, Sparkles, AlertCircle
} from "lucide-react";
import { api } from "../utils/api";

export default function NewCase() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    // Step 1: Incident Details
    title: "",
    description: "",
    date: "",
    location: "",
    // Step 2: Victim Details
    victim_name: "",
    victim_age: "",
    victim_gender: "male",
    victim_phone: "",
    // Step 3: Suspect Details
    suspect_name: "",
    suspect_description: "",
    suspect_status: "unknown", // identified, absconding, unknown
    // Step 4: Evidence
    evidence: "",
    evidence_notes: "",
    // Step 5: Witnesses
    witness_details: "",
    witness_contact: ""
  });

  const steps = [
    { number: 1, label: "Incident Details", icon: <FilePlus className="h-4 w-4" /> },
    { number: 2, label: "Victim Details", icon: <User className="h-4 w-4" /> },
    { number: 3, label: "Suspect Details", icon: <ShieldAlert className="h-4 w-4" /> },
    { number: 4, label: "Evidence", icon: <ClipboardList className="h-4 w-4" /> },
    { number: 5, label: "Witnesses", icon: <Users className="h-4 w-4" /> },
    { number: 6, label: "Generate FIR", icon: <CheckCircle2 className="h-4 w-4" /> }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep === 1 && (!formData.title || !formData.description)) {
      setError("Please fill in the Case Title and Incident Description.");
      return;
    }
    setError("");
    setCurrentStep(prev => Math.min(prev + 1, steps.length));
  };

  const prevStep = () => {
    setError("");
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleFinish = async () => {
    setLoading(true);
    setError("");
    
    // Construct consolidated case description to feed the backend
    const consolidatedDesc = `${formData.description}
    
=== VICTIM DETAILS ===
Name: ${formData.victim_name || "N/A"} (Age: ${formData.victim_age || "N/A"}, Gender: ${formData.victim_gender || "N/A"})
Phone: ${formData.victim_phone || "N/A"}

=== SUSPECT DETAILS ===
Name: ${formData.suspect_name || "N/A"} (${formData.suspect_description || "N/A"})
Status: ${formData.suspect_status}

=== EVIDENCE INVENTORY ===
Items: ${formData.evidence || "N/A"}
Notes: ${formData.evidence_notes || "N/A"}

=== WITNESSES ===
Statements: ${formData.witness_details || "N/A"}
Contacts: ${formData.witness_contact || "N/A"}`;

    const payload = {
      title: formData.title,
      description: consolidatedDesc,
      location: formData.location || "N/A",
      date: formData.date || "N/A",
      evidence: formData.evidence || "N/A",
      witness_details: formData.witness_details || "N/A",
      status: "draft"
    };

    try {
      // 1. Create case in DB
      const newCase = await api.createCase(payload);
      
      // 2. Automatically trigger AI RAG parsing and drafting
      await api.analyzeCase(newCase.id);
      
      // 3. Redirect to the editor page to finalize the draft
      navigate(`/fir-generator?caseId=${newCase.id}`);
    } catch (err) {
      setError("Failed to create and compile case: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-sans">
      
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[#111827]">Register New Case File</h1>
        <p className="text-xs text-[#6B7280] mt-1">
          Complete the step-by-step incident documentation. The AI will cross-reference legal codes and generate the draft automatically.
        </p>
      </div>

      {/* Steps Progress Header Grid */}
      <div className="grid grid-cols-6 gap-2 bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-sm">
        {steps.map((step) => {
          const isActive = currentStep === step.number;
          const isCompleted = currentStep > step.number;
          return (
            <div 
              key={step.number} 
              className={`flex flex-col items-center text-center p-2 rounded-xl transition-all ${
                isActive 
                  ? "bg-[#EFF6FF] text-[#2563EB]" 
                  : isCompleted 
                    ? "text-[#10B981]" 
                    : "text-[#6B7280]"
              }`}
            >
              <div className={`h-8 w-8 rounded-full flex items-center justify-center border font-bold text-xs ${
                isActive 
                  ? "border-[#2563EB] bg-[#2563EB] text-white" 
                  : isCompleted 
                    ? "border-[#10B981] bg-[#10B981] text-white" 
                    : "border-[#E2E8F0] bg-[#F8FAFC]"
              }`}>
                {isCompleted ? "✓" : step.number}
              </div>
              <span className="text-[10px] font-semibold mt-2 hidden md:inline truncate w-full">
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
          <AlertCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Card Content */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-8 min-h-[380px] flex flex-col justify-between">
        
        <div className="space-y-5">
          {/* STEP 1: Incident Description */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider font-mono">Incident Details</h3>
              
              <div>
                <label className="block text-[11px] font-semibold text-[#4B5563] mb-1">CASE SUBJECT / BRIEF ALIAS *</label>
                <input
                  type="text"
                  placeholder="e.g. Unauthorized Database Extraction from Local Server"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className="w-full saas-input px-3.5 py-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-[#4B5563] mb-1">INCIDENT DATE/TIME</label>
                  <input
                    type="text"
                    placeholder="e.g. 2026-07-22 03:00 AM"
                    value={formData.date}
                    onChange={(e) => handleInputChange("date", e.target.value)}
                    className="w-full saas-input px-3.5 py-2.5"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#4B5563] mb-1">JURISDICTION PLACE / AREA</label>
                  <input
                    type="text"
                    placeholder="e.g. Cyber Crimes Police Cell, Sector 4"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    className="w-full saas-input px-3.5 py-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#4B5563] mb-1">NARRATIVE INCIDENT DESCRIPTION *</label>
                <textarea
                  rows={5}
                  placeholder="Describe facts, theft details, break-in details, and overall sequence of events in detail..."
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className="w-full saas-input px-3.5 py-2.5 resize-none leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Victim Details */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider font-mono">Victim details</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-[#4B5563] mb-1">FULL NAME</label>
                  <input
                    type="text"
                    placeholder="e.g. Rajesh Kumar"
                    value={formData.victim_name}
                    onChange={(e) => handleInputChange("victim_name", e.target.value)}
                    className="w-full saas-input px-3.5 py-2.5"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#4B5563] mb-1">PHONE NUMBER</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 98765 43210"
                    value={formData.victim_phone}
                    onChange={(e) => handleInputChange("victim_phone", e.target.value)}
                    className="w-full saas-input px-3.5 py-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-[#4B5563] mb-1">AGE</label>
                  <input
                    type="number"
                    placeholder="e.g. 34"
                    value={formData.victim_age}
                    onChange={(e) => handleInputChange("victim_age", e.target.value)}
                    className="w-full saas-input px-3.5 py-2.5"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#4B5563] mb-1">GENDER</label>
                  <select
                    value={formData.victim_gender}
                    onChange={(e) => handleInputChange("victim_gender", e.target.value)}
                    className="w-full saas-input px-3.5 py-2.5"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Suspect Details */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider font-mono">Suspect details</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-[#4B5563] mb-1">SUSPECT ALIAS / NAME</label>
                  <input
                    type="text"
                    placeholder="e.g. Unidentified hacker / 'Phantom'"
                    value={formData.suspect_name}
                    onChange={(e) => handleInputChange("suspect_name", e.target.value)}
                    className="w-full saas-input px-3.5 py-2.5"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#4B5563] mb-1">CASE STATUS</label>
                  <select
                    value={formData.suspect_status}
                    onChange={(e) => handleInputChange("suspect_status", e.target.value)}
                    className="w-full saas-input px-3.5 py-2.5"
                  >
                    <option value="unknown">Unidentified / Unknown</option>
                    <option value="identified">Identified Suspect</option>
                    <option value="absconding">Absconding suspect</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#4B5563] mb-1">PHYSICAL DESCRIPTION / IP LOG METADATA</label>
                <textarea
                  rows={4}
                  placeholder="Enter details on suspect's appearance, IP addresses used, vehicle type, or specific hallmarks..."
                  value={formData.suspect_description}
                  onChange={(e) => handleInputChange("suspect_description", e.target.value)}
                  className="w-full saas-input px-3.5 py-2.5 resize-none leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* STEP 4: Evidence */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider font-mono">Evidence Inventory</h3>
              
              <div>
                <label className="block text-[11px] font-semibold text-[#4B5563] mb-1">PHYSICAL OR DIGITAL EVIDENCE LIST</label>
                <input
                  type="text"
                  placeholder="e.g. CCTV recording of server gateway, digital log checksum logs"
                  value={formData.evidence}
                  onChange={(e) => handleInputChange("evidence", e.target.value)}
                  className="w-full saas-input px-3.5 py-2.5"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#4B5563] mb-1">CUSTODY / TAGGING DETAILS</label>
                <textarea
                  rows={4}
                  placeholder="Describe where items were secured, checksum values, or technical details..."
                  value={formData.evidence_notes}
                  onChange={(e) => handleInputChange("evidence_notes", e.target.value)}
                  className="w-full saas-input px-3.5 py-2.5 resize-none leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* STEP 5: Witnesses */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider font-mono">Witnesses</h3>
              
              <div>
                <label className="block text-[11px] font-semibold text-[#4B5563] mb-1">WITNESS NAMES & GENERAL STATEMENTS</label>
                <textarea
                  rows={4}
                  placeholder="e.g. Security guard Ramesh reported seeing lights in server room at 02:00 AM."
                  value={formData.witness_details}
                  onChange={(e) => handleInputChange("witness_details", e.target.value)}
                  className="w-full saas-input px-3.5 py-2.5 resize-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#4B5563] mb-1">WITNESS CONTACT INFO</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Singh, Phone: +91 99887 76655"
                  value={formData.witness_contact}
                  onChange={(e) => handleInputChange("witness_contact", e.target.value)}
                  className="w-full saas-input px-3.5 py-2.5"
                />
              </div>
            </div>
          )}

          {/* STEP 6: Final Review & Generation */}
          {currentStep === 6 && (
            <div className="space-y-5 text-center py-6">
              <div className="h-14 w-14 bg-blue-50 border border-blue-200 text-[#2563EB] rounded-full flex items-center justify-center mx-auto shadow-sm">
                <Sparkles className="h-6 w-6 animate-pulse" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-base font-bold text-[#111827]">Case Details Compiled</h3>
                <p className="text-xs text-[#6B7280] max-w-md mx-auto leading-relaxed">
                  Click below to create the official database entry. CrimeGPT will automatically analyze the details, retrieve matching legal code sections, and build your draft FIR.
                </p>
              </div>

              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl max-w-md mx-auto text-left space-y-2 text-xs">
                <span className="block font-bold text-[#111827]">Docket Summary:</span>
                <span className="block text-[#4B5563]">**Case Title**: {formData.title}</span>
                <span className="block text-[#4B5563]">**Location**: {formData.location || "N/A"}</span>
                <span className="block text-[#4B5563]">**Victim**: {formData.victim_name || "Anonymous"}</span>
              </div>
            </div>
          )}
        </div>

        {/* Buttons Action Bar */}
        <div className="flex justify-between border-t border-[#F1F5F9] pt-6 mt-8">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1 || loading}
            className="flex items-center gap-2 btn-secondary px-5 py-2 text-xs font-semibold disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back</span>
          </button>

          {currentStep < 6 ? (
            <button
              type="button"
              onClick={nextStep}
              className="flex items-center gap-2 btn-primary px-5 py-2 text-xs font-semibold cursor-pointer"
            >
              <span>Continue</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              disabled={loading}
              className="flex items-center gap-2 bg-[#10B981] hover:bg-[#0D9488] text-white font-bold text-xs px-6 py-2.5 rounded-xl cursor-pointer hover:shadow-lg transition-all"
            >
              <Sparkles className="h-4 w-4" />
              <span>{loading ? "Analyzing..." : "Generate FIR & Case File"}</span>
            </button>
          )}
        </div>

      </div>

    </div>
  );
}
