import React, { useState, useEffect } from "react";
import { Key, Shield, User, HardDrive, CheckCircle2, AlertTriangle, Activity, Trash, Cpu } from "lucide-react";
import { api } from "../utils/api";

export default function Settings() {
  const [apiKey, setApiKey] = useState("");
  const [isKeySaved, setIsKeySaved] = useState(false);
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");
  const [badge, setBadge] = useState("");
  
  // Status states
  const [validating, setValidating] = useState(false);
  const [backendStatus, setBackendStatus] = useState("checking");
  const [dbStats, setDbStats] = useState({ total_cases: 0, total_users: 0 });
  const [msg, setMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    // Load local details
    setUsername(api.getUsername());
    setRole(api.getUserRole());
    
    // Check local storage for api key
    const savedKey = localStorage.getItem("gemini_api_key");
    if (savedKey) {
      setApiKey(savedKey);
      setIsKeySaved(true);
    }
    
    checkSystemStatus();
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const profile = await api.getMe();
      setBadge(profile.badge_number || "N/A");
    } catch (e) {
      setBadge("N/A");
    }
  };

  const checkSystemStatus = async () => {
    try {
      const stats = await api.getStats();
      setDbStats(stats);
      setBackendStatus("online");
    } catch (e) {
      setBackendStatus("offline");
    }
  };

  const handleSaveKey = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });
    setValidating(true);

    if (!apiKey) {
      setMsg({ type: "error", text: "Please enter a valid API key string." });
      setValidating(false);
      return;
    }

    try {
      await api.validateAPIKey(apiKey);
      localStorage.setItem("gemini_api_key", apiKey);
      setIsKeySaved(true);
      setMsg({ type: "success", text: "Gemini API key validated and saved locally." });
    } catch (err) {
      setMsg({ type: "error", text: "API Key validation failed: " + err.message });
    } finally {
      setValidating(false);
    }
  };

  const handleClearKey = () => {
    localStorage.removeItem("gemini_api_key");
    setApiKey("");
    setIsKeySaved(false);
    setMsg({ type: "success", text: "Custom API key removed. Reverted to default settings." });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-sans select-none">
      
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[#111827]">System Configurations & API Keys</h1>
        <p className="text-xs text-[#6B7280] mt-1">Configure your AI Provider settings, view badge credentials, and review database states.</p>
      </div>

      {msg.text && (
        <div className={`p-4 rounded-xl flex items-start gap-2 text-xs border ${
          msg.type === "error" ? "bg-red-50 border-red-200 text-red-600" : "bg-emerald-50 border-emerald-200 text-emerald-600"
        }`}>
          <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
          <span>{msg.text}</span>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8 items-start">
        
        {/* Left Side: API Key configuration */}
        <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-5">
          <div className="flex items-center gap-3 border-b border-[#F1F5F9] pb-4">
            <Key className="h-5 w-5 text-[#2563EB]" />
            <h2 className="text-sm font-bold text-[#111827] tracking-tight">Custom AI Key Configuration</h2>
          </div>

          <p className="text-xs text-[#6B7280] leading-relaxed">
            CrimeGPT utilizes advanced LLM models (DeepSeek, Llama, GPT) to draft offense sheets and citations. Provide your own key (OpenRouter, Groq, or OpenAI) to override backend environment defaults.
          </p>

          <form onSubmit={handleSaveKey} className="space-y-4 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-[#4B5563] mb-1.5 font-mono uppercase tracking-wider">CUSTOM PROVIDER API KEY</label>
              <input
                type="password"
                required
                disabled={isKeySaved}
                placeholder="sk-... or gsk_..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full saas-input px-4 py-3 text-xs font-mono disabled:opacity-60"
              />
            </div>

            <div className="flex gap-4">
              {!isKeySaved ? (
                <button
                  type="submit"
                  disabled={validating}
                  className="flex-1 btn-primary py-3 cursor-pointer"
                >
                  <span>{validating ? "Validating API Key..." : "Verify & Save API Key"}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleClearKey}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold text-xs uppercase transition-all cursor-pointer"
                >
                  <Trash className="h-4 w-4" />
                  <span>Remove Custom Key</span>
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right Side: Diagnostics & Profile Info */}
        <div className="space-y-6">
          
          {/* Profile Card */}
          <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-[#F1F5F9] pb-4">
              <User className="h-5 w-5 text-[#06B6D4]" />
              <h2 className="text-sm font-bold text-[#111827] tracking-tight">Officer Profile Credentials</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-xs font-mono text-[#374151]">
              <div>
                <span className="block text-[10px] text-[#6B7280] font-semibold tracking-wider">OFFICER ALIAS:</span>
                <span className="block text-[#111827] font-bold font-sans text-sm mt-0.5">{username}</span>
              </div>
              <div>
                <span className="block text-[10px] text-[#6B7280] font-semibold tracking-wider">BADGE ID:</span>
                <span className="block text-[#111827] font-bold mt-0.5">{badge}</span>
              </div>
              <div className="col-span-2">
                <span className="block text-[10px] text-[#6B7280] font-semibold tracking-wider">SYSTEM CLEARANCE:</span>
                <span className="block text-[#2563EB] font-bold tracking-wider uppercase mt-0.5 font-sans">
                  {role === "admin" ? "Superintendent / Admin Access" : "Investigating Officer"}
                </span>
              </div>
            </div>
          </div>

          {/* Diagnostic Stats */}
          <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-[#F1F5F9] pb-4">
              <Activity className="h-5 w-5 text-[#10B981] animate-pulse" />
              <h2 className="text-sm font-bold text-[#111827] tracking-tight">System Diagnostics</h2>
            </div>

            <div className="space-y-3.5 text-xs text-[#374151]">
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2.5">
                <span>FastAPI Backend Connection:</span>
                {backendStatus === "online" ? (
                  <span className="flex items-center gap-1 text-[#047857] font-bold">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>ONLINE</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[#EF4444] font-bold animate-pulse">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>OFFLINE</span>
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2.5">
                <span>Database Engine:</span>
                <span className="flex items-center gap-1.5 text-[#6B7280] font-mono font-bold">
                  <HardDrive className="h-4 w-4 text-[#9CA3AF] shrink-0" />
                  <span>SQLite 3 (Local)</span>
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2.5">
                <span>Database Records:</span>
                <span className="text-[#6B7280] font-bold font-mono">
                  {dbStats.total_cases} CASES / {dbStats.total_users} USERS
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span>Embedding Core Matcher:</span>
                <span className="text-[#2563EB] font-bold font-mono">
                  NumPy Cosine Vector / Offline Core
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
