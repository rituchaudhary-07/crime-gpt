import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Key, User, Award, ArrowRight } from "lucide-react";
import { api } from "../utils/api";

export default function Login() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  
  // Form State
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [badgeNumber, setBadgeNumber] = useState("");
  const [role, setRole] = useState("officer");
  
  // Status State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (isRegister) {
        await api.register(username, password, badgeNumber, role);
        setSuccess("Officer registered successfully! You can now log in.");
        setIsRegister(false);
        setPassword("");
      } else {
        await api.login(username, password);
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.message || "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-cyber-grid flex items-center justify-center p-6">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/3 w-[300px] h-[300px] rounded-full bg-police-600/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-[300px] h-[300px] rounded-full bg-cyber-cyan/10 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md rounded-2xl glass-panel p-8 border-glass-inset shadow-glass z-10 flex flex-col items-center">
        
        {/* Logo and Brand Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-police-600 to-cyber-cyan text-white shadow-cyber-glow">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold tracking-wider text-white">CRIME<span className="text-cyber-cyan">GPT</span></h2>
            <p className="text-[9px] tracking-widest font-mono text-slate-400">STATE SECURE TERMINAL</p>
          </div>
        </div>

        <h2 className="text-xl font-bold text-white text-center mb-1">
          {isRegister ? "Register Officer Account" : "Officer Sign In"}
        </h2>
        <p className="text-xs text-slate-400 text-center mb-6">
          {isRegister ? "Create credentials for legal database access" : "Verify badge credentials to establish session"}
        </p>

        {/* Messages */}
        {error && (
          <div className="w-full mb-4 p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}
        {success && (
          <div className="w-full mb-4 p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 mb-1.5 font-mono">OFFICER USERNAME</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <User className="h-4 w-4" />
              </span>
              <input
                type="text"
                required
                placeholder="e.g. officer_amit"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full glass-input pl-10 pr-4 py-2.5 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-400 mb-1.5 font-mono">PASSWORD</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <Key className="h-4 w-4" />
              </span>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full glass-input pl-10 pr-4 py-2.5 text-xs"
              />
            </div>
          </div>

          {isRegister && (
            <>
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1.5 font-mono">BADGE ID / ID NUMBER</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Award className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. B-9921"
                    value={badgeNumber}
                    onChange={(e) => setBadgeNumber(e.target.value)}
                    className="w-full glass-input pl-10 pr-4 py-2.5 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1.5 font-mono font-sans">SYSTEM ROLE</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full glass-input px-3 py-2.5 text-xs cursor-pointer focus:border-cyan-400"
                >
                  <option value="officer" className="bg-police-900 text-slate-200">Investigating Officer</option>
                  <option value="admin" className="bg-police-900 text-slate-200">Superintendent / Admin</option>
                </select>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-gradient-to-r from-police-600 to-cyber-cyan text-white font-bold hover:shadow-cyber-glow transition-all duration-300 transform hover:scale-[1.01] disabled:opacity-50 cursor-pointer"
          >
            <span>{loading ? "Establishing connection..." : isRegister ? "Register Account" : "Access Terminal"}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError("");
              setSuccess("");
            }}
            className="text-xs text-cyber-cyan hover:underline cursor-pointer"
          >
            {isRegister ? "Already registered? Sign in here" : "Need to register a new Officer? Click here"}
          </button>
        </div>
      </div>
    </div>
  );
}
