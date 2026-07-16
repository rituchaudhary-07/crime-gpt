import React, { useState, useEffect } from "react";
import { Key, Shield, User, HardDrive, CheckCircle2, AlertTriangle, Activity, Trash } from "lucide-react";
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
      // Fallback
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
      // Send API key to validation endpoint
      await api.validateAPIKey(apiKey);
      
      // Save locally
      localStorage.setItem("gemini_api_key", apiKey);
      setIsKeySaved(true);
      setMsg({ type: "success", text: "Gemini API key validated and saved to browser cache successfully." });
    } catch (err) {
      setMsg({ type: "error", text: "API Key validation check failed: " + err.message });
    } finally {
      setValidating(false);
    }
  };

  const handleClearKey = () => {
    localStorage.removeItem("gemini_api_key");
    setApiKey("");
    setIsKeySaved(false);
    setMsg({ type: "success", text: "Dynamic API key cleared. Reverted to backend default configurations." });
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8 font-sans">
      <div className="border-b border-police-800 pb-4">
        <h1 className="text-2xl font-extrabold text-slate-100 font-sans">System Configurations & Keys</h1>
        <p className="text-xs text-slate-400 mt-1">Configure your Gemini API settings, view badge information, and review database states.</p>
      </div>

      {msg.text && (
        <div className={`p-4 rounded-xl flex items-start space-x-3 text-xs border ${
          msg.type === "error" 
            ? "bg-rose-950/30 border-rose-500/30 text-rose-400" 
            : "bg-emerald-950/30 border-emerald-500/30 text-emerald-400"
        }`}>
          <span>{msg.text}</span>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8 items-start">
        
        {/* Left Side: API Key configuration */}
        <div className="rounded-2xl glass-panel p-6 border-glass-inset shadow-glass space-y-5">
          <div className="flex items-center space-x-3 border-b border-police-800 pb-3">
            <Key className="h-5 w-5 text-cyber-cyan" />
            <h2 className="text-lg font-bold text-white">Gemini API Configuration</h2>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            CrimeGPT utilizes Gemini AI models (`gemini-1.5-flash` / `text-embedding-004`) to draft cognizable offense sheets and citations. Provide your own key to override backend environment defaults.
          </p>

          <form onSubmit={handleSaveKey} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 font-mono">GEMINI API KEY</label>
              <input
                type="password"
                required
                disabled={isKeySaved}
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full glass-input px-3.5 py-2.5 text-xs font-mono disabled:opacity-60"
              />
            </div>

            <div className="flex gap-4">
              {!isKeySaved ? (
                <button
                  type="submit"
                  disabled={validating}
                  className="flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl bg-gradient-to-r from-police-600 to-cyber-cyan text-white font-extrabold text-xs hover:shadow-cyber-glow transition-all disabled:opacity-50 cursor-pointer"
                >
                  <span>{validating ? "Running validation query..." : "Verify & Save API Key"}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleClearKey}
                  className="flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/30 border border-rose-500/30 text-rose-400 font-bold text-xs transition-all cursor-pointer"
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
          <div className="rounded-2xl glass-panel p-6 border-glass-inset shadow-glass space-y-4">
            <div className="flex items-center space-x-3 border-b border-police-800 pb-3">
              <User className="h-5 w-5 text-blue-400" />
              <h2 className="text-lg font-bold text-white">Officer ID Card</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <span className="block text-slate-500">OFFICER NAME:</span>
                <span className="block text-slate-100 font-bold font-sans text-sm mt-0.5">{username}</span>
              </div>
              <div>
                <span className="block text-slate-500">BADGE NUMBER:</span>
                <span className="block text-slate-100 font-bold mt-0.5">{badge}</span>
              </div>
              <div className="col-span-2">
                <span className="block text-slate-500">CREDENTIALS ROLE:</span>
                <span className="block text-cyan-400/80 uppercase font-bold mt-0.5">
                  {role === "admin" ? "Superintendent / Admin Access" : "Investigating Officer"}
                </span>
              </div>
            </div>
          </div>

          {/* Diagnostic Stats */}
          <div className="rounded-2xl glass-panel p-6 border-glass-inset shadow-glass space-y-4">
            <div className="flex items-center space-x-3 border-b border-police-800 pb-3">
              <Activity className="h-5 w-5 text-purple-400" />
              <h2 className="text-lg font-bold text-white">System Diagnostics</h2>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between border-b border-police-900 pb-2">
                <span className="text-slate-400">FastAPI Connection:</span>
                {backendStatus === "online" ? (
                  <span className="flex items-center space-x-1.5 text-emerald-400 font-bold font-mono">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>ONLINE</span>
                  </span>
                ) : backendStatus === "offline" ? (
                  <span className="flex items-center space-x-1.5 text-rose-400 font-bold font-mono">
                    <AlertTriangle className="h-4 w-4 shrink-0 animate-pulse" />
                    <span>OFFLINE</span>
                  </span>
                ) : (
                  <span className="text-slate-500 animate-pulse font-mono">CHECKING STATUS...</span>
                )}
              </div>

              <div className="flex items-center justify-between border-b border-police-900 pb-2">
                <span className="text-slate-400">Database Engine:</span>
                <span className="flex items-center space-x-1.5 text-slate-300 font-bold font-mono">
                  <HardDrive className="h-4 w-4 text-slate-500 shrink-0" />
                  <span>SQLite 3 (Local)</span>
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-police-900 pb-2">
                <span className="text-slate-400">Database Records:</span>
                <span className="text-slate-300 font-bold font-mono">
                  {dbStats.total_cases} CASES / {dbStats.total_users} USERS
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Embedding Matcher:</span>
                <span className="text-cyber-cyan font-bold font-mono">
                  NumPy Cosine / Gemini
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
