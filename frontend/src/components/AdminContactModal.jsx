import React, { useState } from "react";
import { Phone, Mail, Copy, Check, ShieldCheck, User, X } from "lucide-react";

export default function AdminContactModal({ isOpen, onClose }) {
  const [copiedText, setCopiedText] = useState("");

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(""), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white border border-slate-200 shadow-2xl rounded-2xl max-w-md w-full overflow-hidden">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-5 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight text-white">Contact Administrator</h3>
              <p className="text-xs text-slate-300">Police HQ Cyber Intelligence Division</p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          
          {/* Admin Profile Details */}
          <div className="flex items-center gap-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="h-12 w-12 rounded-xl bg-indigo-600 text-white font-bold text-lg flex items-center justify-center shadow-sm">
              RC
            </div>
            <div>
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block">Chief Administrator</span>
              <h4 className="text-sm font-extrabold text-slate-900">Ritu Chaudhary</h4>
              <p className="text-xs text-slate-500 font-medium">Superintendent of Police (Cyber HQ)</p>
            </div>
          </div>

          {/* Primary & Secondary Phone */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Phone Contacts</label>
            
            <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-2xs hover:border-indigo-300 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block">Primary Contact</span>
                  <span className="text-xs font-bold text-slate-900 font-mono">8849591402</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <a
                  href="tel:8849591402"
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                >
                  <Phone className="h-3 w-3" />
                  <span>Call</span>
                </a>
                <button
                  onClick={() => handleCopy("8849591402", "Primary Phone")}
                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Copy Phone"
                >
                  {copiedText === "Primary Phone" ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-2xs hover:border-indigo-300 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block">Secondary Contact</span>
                  <span className="text-xs font-bold text-slate-900 font-mono">8898855515</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <a
                  href="tel:8898855515"
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                >
                  <Phone className="h-3 w-3" />
                  <span>Call</span>
                </a>
                <button
                  onClick={() => handleCopy("8898855515", "Secondary Phone")}
                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Copy Phone"
                >
                  {copiedText === "Secondary Phone" ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Email Contacts */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Official Email Addresses</label>
            
            <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-2xs hover:border-indigo-300 transition-colors">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="truncate">
                  <span className="text-[10px] font-semibold text-slate-400 block">Primary Email</span>
                  <span className="text-xs font-bold text-slate-900 truncate block">rituchaudhary15077@gmail.com</span>
                </div>
              </div>
              <button
                onClick={() => handleCopy("rituchaudhary15077@gmail.com", "Primary Email")}
                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
                title="Copy Email"
              >
                {copiedText === "Primary Email" ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-2xs hover:border-indigo-300 transition-colors">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg shrink-0">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="truncate">
                  <span className="text-[10px] font-semibold text-slate-400 block">Secondary Email</span>
                  <span className="text-xs font-bold text-slate-900 truncate block">masurakrupa@gmail.com</span>
                </div>
              </div>
              <button
                onClick={() => handleCopy("masurakrupa@gmail.com", "Secondary Email")}
                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
                title="Copy Email"
              >
                {copiedText === "Secondary Email" ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {copiedText && (
            <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs font-semibold text-center animate-fade-in">
              ✓ Copied {copiedText} to clipboard!
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
