import React from "react";
import { useNavigate } from "react-router-dom";
import { Shield, BookOpen, FileText, Lock, ArrowRight, ChevronRight, Cpu } from "lucide-react";
import { api } from "../utils/api";

export default function Landing() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <FileText className="h-5 w-5 text-[#2563EB]" />,
      title: "Automated FIR Drafting",
      description: "Draft legally structured First Information Reports compliant with BNSS Section 173 guidelines."
    },
    {
      icon: <BookOpen className="h-5 w-5 text-[#06B6D4]" />,
      title: "Legal Intelligence RAG",
      description: "Perform queries across BNS, BNSS, and BSA databases with traceable citation matching."
    },
    {
      icon: <Shield className="h-5 w-5 text-[#7E22CE]" />,
      title: "Evidence Compliance check",
      description: "Prepare digital checklists for video record seizure under BNSS Section 105 mandates."
    },
    {
      icon: <Lock className="h-5 w-5 text-[#374151]" />,
      title: "Chain of Custody Logs",
      description: "Document file upload timestamps and metadata hash checks securely for courtroom hearings."
    }
  ];

  const handlePortalAccess = () => {
    if (api.isAuthenticated()) {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="relative min-h-screen bg-[#F8FAFC] bg-saas-grid pb-20 font-sans select-none flex flex-col justify-between">
      
      {/* Navbar header */}
      <header className="sticky top-4 z-50 mx-auto w-[90%] max-w-7xl rounded-2xl bg-white/80 border border-[#E2E8F0] px-6 py-4 shadow-sm flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2563EB] text-white shadow-sm font-bold">
            NQ
          </div>
          <div>
            <span className="block text-sm font-bold tracking-tight text-[#111827]">
              Nyaya<span className="text-[#2563EB]">IQ</span>
            </span>
            <span className="block text-[9px] font-semibold text-[#6B7280] tracking-widest uppercase">
              INVESTIGATION &amp; LEGAL INTELLIGENCE
            </span>
          </div>
        </div>

        <button
          onClick={handlePortalAccess}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#E2E8F0] hover:border-[#CBD5E1] text-[#374151] hover:text-[#111827] transition-all text-xs font-semibold bg-white cursor-pointer"
        >
          <span>Officer Sign In</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </header>

      {/* Hero section container */}
      <div className="max-w-4xl mx-auto px-6 pt-20 text-center space-y-6">
        
        {/* Version Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] text-[10px] font-mono tracking-wider font-semibold mx-auto">
          <span className="h-1.5 w-1.5 rounded-full bg-[#2563EB] animate-pulse"></span>
          <span>NYAYAIQ • INVESTIGATION &amp; LEGAL INTELLIGENCE</span>
        </div>

        {/* Hero Title */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-[#111827] leading-none uppercase">
            AI-Powered Legal Intelligence <br />
            <span className="text-[#2563EB]">For Modern Police Forces</span>
          </h1>
          <p className="text-xs md:text-sm text-[#6B7280] max-w-xl mx-auto leading-relaxed">
            Automating incident documentation, digital checklist validations, and legal code retrieval (BNS, BNSS, BSA) for airtight courtroom trials.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center w-full max-w-xs mx-auto pt-4">
          <button
            onClick={handlePortalAccess}
            className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Access Terminal</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              const el = document.getElementById("capabilities");
              el?.scrollIntoView({ behavior: "smooth" });
            }}
            className="btn-secondary w-full py-3.5 flex items-center justify-center gap-1.5 cursor-pointer bg-white"
          >
            <span>Capabilities</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

      </div>

      {/* Capability grids */}
      <div id="capabilities" className="max-w-6xl mx-auto px-6 pt-24 space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-[#111827]">Built for Speed and Compliance</h2>
          <p className="text-xs text-[#6B7280]">Secure digital tools mapping state police requirements under reformed directives.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat) => (
            <div 
              key={feat.title} 
              className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col justify-between h-48 hover:shadow-md transition-shadow"
            >
              <div>
                <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl w-fit mb-4">
                  {feat.icon}
                </div>
                <h3 className="text-xs font-bold text-[#111827] mb-1.5">{feat.title}</h3>
                <p className="text-[11px] text-[#6B7280] leading-relaxed">{feat.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
