import React from "react";
import { Check, X, Shield, ShieldAlert, ShieldCheck } from "lucide-react";

export default function PasswordStrengthMeter({ password = "" }) {
  const checks = [
    { label: "At least 12 characters", valid: password.length >= 12 },
    { label: "At least one uppercase letter (A-Z)", valid: /[A-Z]/.test(password) },
    { label: "At least one lowercase letter (a-z)", valid: /[a-z]/.test(password) },
    { label: "At least one number (0-9)", valid: /[0-9]/.test(password) },
    { label: "At least one special character (!@#$%^&*)", valid: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];

  const passedCount = checks.filter((c) => c.valid).length;

  const getMeterColor = () => {
    if (passedCount === 0) return "w-0 bg-slate-200";
    if (passedCount <= 2) return "w-1/4 bg-rose-500";
    if (passedCount === 3) return "w-2/4 bg-amber-500";
    if (passedCount === 4) return "w-3/4 bg-blue-500";
    return "w-full bg-emerald-500";
  };

  const getMeterText = () => {
    if (passedCount <= 2) return { text: "Weak Password", color: "text-rose-600" };
    if (passedCount <= 4) return { text: "Moderate Password", color: "text-amber-600" };
    return { text: "Strong Enterprise Password", color: "text-emerald-600" };
  };

  if (!password) return null;

  const meterStatus = getMeterText();

  return (
    <div className="space-y-3 p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs">
      <div className="flex items-center justify-between">
        <span className="font-bold text-[#111827] flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5 text-[#2563EB]" />
          <span>Security Compliance Checklist</span>
        </span>
        <span className={`font-mono text-[10px] font-bold uppercase ${meterStatus.color}`}>
          {meterStatus.text}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-[#E2E8F0] rounded-full overflow-hidden">
        <div className={`h-full transition-all duration-300 ${getMeterColor()}`} />
      </div>

      {/* Requirement List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
        {checks.map((item, idx) => (
          <div key={idx} className="flex items-center gap-1.5 text-[10px]">
            {item.valid ? (
              <Check className="h-3 w-3 text-emerald-600 shrink-0" />
            ) : (
              <X className="h-3 w-3 text-slate-400 shrink-0" />
            )}
            <span className={item.valid ? "text-emerald-700 font-medium" : "text-slate-500"}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
