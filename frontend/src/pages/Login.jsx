import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Key, User, Award, ArrowRight, AlertCircle } from "lucide-react";
import { api } from "../utils/api";

import PasswordStrengthMeter from "../components/PasswordStrengthMeter";

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
        setSuccess("Officer account registered! Your account status is PENDING administrator approval. An admin must approve your account before you can sign in.");
        setIsRegister(false);
        setPassword("");
      } else {
        await api.login(username, password);
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.message || "Authentication credentials verification failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] bg-saas-grid flex items-center justify-center p-6 font-sans select-none">
      
      <div className="w-full max-w-sm bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-8 space-y-6">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2563EB] text-white shadow-sm font-bold">
            CG
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight text-[#111827]">
              {isRegister ? "Register Officer Account" : "Officer Session Sign In"}
            </h2>
            <p className="text-xs text-[#6B7280]">
              {isRegister ? "Register official credentials (Requires Admin Approval)" : "Enter badge details to access court files"}
            </p>
          </div>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
            <div className="leading-snug">
              <span className="font-bold block">Access Denied</span>
              <span>{error}</span>
            </div>
          </div>
        )}
        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2.5">
            <Shield className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
            <div className="leading-snug">
              <span className="font-bold block">Registration Submitted</span>
              <span>{success}</span>
            </div>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-[#4B5563] mb-1 font-mono uppercase">OFFICER USERNAME</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#9CA3AF]">
                <User className="h-4 w-4" />
              </span>
              <input
                type="text"
                required
                placeholder="e.g. officer_test"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full saas-input pl-9 pr-4 py-2.5"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#4B5563] mb-1 font-mono uppercase">PASSWORD</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#9CA3AF]">
                <Key className="h-4 w-4" />
              </span>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full saas-input pl-9 pr-4 py-2.5"
              />
            </div>
          </div>

          {/* Password Strength Meter */}
          {isRegister && <PasswordStrengthMeter password={password} />}

          {isRegister && (
            <>
              <div>
                <label className="block text-[11px] font-semibold text-[#4B5563] mb-1 font-mono uppercase">OFFICIAL BADGE ID</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#9CA3AF]">
                    <Award className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. B1002"
                    value={badgeNumber}
                    onChange={(e) => setBadgeNumber(e.target.value)}
                    className="w-full saas-input pl-9 pr-4 py-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#4B5563] mb-1 font-mono uppercase">PRECINCT ROLE</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full saas-input px-3.5 py-2.5 cursor-pointer"
                >
                  <option value="officer">Investigating Officer</option>
                  <option value="sho">Station House Officer (SHO)</option>
                </select>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 flex items-center justify-center gap-2 cursor-pointer mt-4"
          >
            <span>{loading ? "Validating details..." : isRegister ? "Create Account" : "Access Terminal"}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError("");
              setSuccess("");
            }}
            className="text-xs text-[#2563EB] hover:underline cursor-pointer font-semibold"
          >
            {isRegister ? "Already registered? Sign in here" : "Register a new Officer log"}
          </button>
        </div>

      </div>

    </div>
  );
}
