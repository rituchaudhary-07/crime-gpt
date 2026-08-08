import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Shield, Key, User, Award, ArrowRight, AlertCircle, 
  Eye, EyeOff, Mail, Phone, Calendar, Building2, UserCheck, 
  HelpCircle, CheckCircle2, RefreshCw, Lock
} from "lucide-react";
import { api } from "../utils/api";
import PasswordStrengthMeter from "../components/PasswordStrengthMeter";
import LocationAutocomplete from "../components/LocationAutocomplete";
import AdminContactModal from "../components/AdminContactModal";
import heroIllustration from "../assets/hero.png";

export default function Login() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("login"); // "login", "register", "forgot"
  
  // Login Form State
  const [loginInput, setLoginInput] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [captchaInput, setCaptchaInput] = useState("");
  const [numCaptchaVal, setNumCaptchaVal] = useState({ a: 4, b: 7 });
  const [failedAttemptsCount, setFailedAttemptsCount] = useState(0);

  // Registration Form State
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regGender, setRegGender] = useState("Male");
  const [regDob, setRegDob] = useState("");
  const [regBadge, setRegBadge] = useState("");
  const [regStation, setRegStation] = useState("Central Cyber Police Station");
  const [regDesignation, setRegDesignation] = useState("Investigating Officer");
  const [regRole, setRegRole] = useState("officer");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  // Forgot Password State
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [simulatedOtp, setSimulatedOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Modal State
  const [isAdminContactOpen, setIsAdminContactOpen] = useState(false);

  // Status State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const refreshCaptcha = () => {
    setNumCaptchaVal({
      a: Math.floor(Math.random() * 9) + 1,
      b: Math.floor(Math.random() * 9) + 1
    });
    setCaptchaInput("");
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (failedAttemptsCount >= 3) {
      if (parseInt(captchaInput.trim()) !== numCaptchaVal.a + numCaptchaVal.b) {
        setError("Security Verification Failed: CAPTCHA code is incorrect.");
        refreshCaptcha();
        return;
      }
    }

    setLoading(true);
    try {
      await api.login(loginInput, loginPassword);
      navigate("/dashboard");
    } catch (err) {
      const newAttempts = failedAttemptsCount + 1;
      setFailedAttemptsCount(newAttempts);
      setError(err.message || "Authentication credentials verification failed.");
      if (newAttempts >= 3) {
        refreshCaptcha();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Phone validation
    const cleanPhone = regPhone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      setError("Phone Number must contain exactly 10 digits without spaces or characters.");
      return;
    }

    // Password Match validation
    if (regPassword !== regConfirmPassword) {
      setError("Passwords do not match. Please ensure both password fields match.");
      return;
    }

    setLoading(true);
    try {
      await api.register({
        username: regUsername,
        email: regEmail,
        phone: cleanPhone,
        gender: regGender,
        dob: regDob,
        badge_number: regBadge,
        police_station: regStation,
        designation: regDesignation,
        password: regPassword,
        role: regRole
      });
      setSuccess("Account Registered! Your officer account is awaiting Administrator approval. You will be able to log in once Admin approves your request.");
      setActiveTab("login");
      setRegPassword("");
      setRegConfirmPassword("");
    } catch (err) {
      setError(err.message || "Registration failed. Please review your details.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotEmailSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await api.forgotPassword(forgotEmail);
      if (res.otp) {
        setSimulatedOtp(res.otp);
      }
      setSuccess(res.message || "OTP code sent to email.");
      setForgotStep(2);
    } catch (err) {
      setError(err.message || "Failed to process forgot password request.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await api.verifyOTP(forgotEmail, forgotOtp);
      setSuccess("OTP verified! Create your new account password.");
      setForgotStep(3);
    } catch (err) {
      setError(err.message || "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await api.resetPassword(forgotEmail, forgotOtp, newPassword);
      setSuccess("Password reset successfully! You can now log in with your new credentials.");
      setActiveTab("login");
      setForgotStep(1);
      setForgotEmail("");
      setForgotOtp("");
      setNewPassword("");
    } catch (err) {
      setError(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 lg:grid lg:grid-cols-2">
      <section className="flex min-h-screen items-center justify-center overflow-y-auto px-4 py-8 sm:px-8 lg:px-12">
        <div className="w-full max-w-lg">
      
      {/* Top Banner Header */}
      <div className="mb-7 space-y-2 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-700">
          <Shield className="h-3.5 w-3.5" />
          <span>Government Law Enforcement Portal</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">
          Crime<span className="text-blue-500">GPT</span> Police Terminal
        </h1>
        <p className="text-sm font-medium text-slate-500">
          Digital Legal Intelligence & Crime Investigation System • Directorate of Cyber Crime
        </p>
      </div>

      {/* Main Authentication Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,.08)]">
        
        {/* Navigation Tabs Header */}
        <div className="flex border-b border-slate-200 bg-slate-50 p-1.5 gap-1.5">
          <button
            onClick={() => { setActiveTab("login"); setError(""); setSuccess(""); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "login"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            Officer Sign In
          </button>
          <button
            onClick={() => { setActiveTab("register"); setError(""); setSuccess(""); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "register"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            New Registration
          </button>
          <button
            onClick={() => { setActiveTab("forgot"); setError(""); setSuccess(""); setForgotStep(1); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "forgot"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            Forgot Password
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Status Messages */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 animate-shake">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
              <div className="leading-snug">
                <span className="font-bold block">Access Restricted</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 animate-fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              <div className="leading-snug">
                <span className="font-bold block">Action Successful</span>
                <span>{success}</span>
              </div>
            </div>
          )}

          {/* ================= TAB 1: LOGIN ================= */}
          {activeTab === "login" && (
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  USERNAME, EMAIL OR PHONE NUMBER
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <User className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Enter Username, Email or 10-digit Phone"
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    className="w-full saas-input pl-9 pr-4 py-2.5"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    PASSWORD
                  </label>
                  <button
                    type="button"
                    onClick={() => { setActiveTab("forgot"); setError(""); setSuccess(""); }}
                    className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Key className="h-4 w-4" />
                  </span>
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    required
                    placeholder="••••••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full saas-input pl-9 pr-10 py-2.5"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* CAPTCHA Widget (Appears after 3 failed login attempts) */}
              {failedAttemptsCount >= 3 && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-amber-600" />
                      <span>CAPTCHA Security Challenge</span>
                    </span>
                    <button
                      type="button"
                      onClick={refreshCaptcha}
                      className="text-blue-600 hover:underline flex items-center gap-1 cursor-pointer text-[10px]"
                    >
                      <RefreshCw className="h-3 w-3" />
                      <span>Refresh</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-slate-900 text-amber-400 font-mono font-bold text-sm rounded-lg tracking-widest">
                      {numCaptchaVal.a} + {numCaptchaVal.b} = ?
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Answer"
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value)}
                      className="flex-1 saas-input px-3 py-2 text-xs"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 flex items-center justify-center gap-2 cursor-pointer font-bold text-sm mt-2"
              >
                <span>{loading ? "Authenticating Session..." : "Access Police Terminal"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}

          {/* ================= TAB 2: REGISTER ================= */}
          {activeTab === "register" && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
              
              {/* Username */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  USERNAME <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <User className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. officer_sharma"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    className="w-full saas-input pl-9 pr-4 py-2"
                  />
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    EMAIL ADDRESS <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Mail className="h-4 w-4" />
                    </span>
                    <input
                      type="email"
                      required
                      placeholder="officer@police.gov.in"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full saas-input pl-9 pr-3 py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    PHONE NUMBER <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Phone className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      required
                      maxLength={10}
                      placeholder="10-digit number"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, ""))}
                      className="w-full saas-input pl-9 pr-3 py-2"
                    />
                  </div>
                </div>
              </div>

              {/* Gender & Date of Birth */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    GENDER
                  </label>
                  <select
                    value={regGender}
                    onChange={(e) => setRegGender(e.target.value)}
                    className="w-full saas-input px-3 py-2 cursor-pointer"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    DATE OF BIRTH
                  </label>
                  <input
                    type="date"
                    value={regDob}
                    onChange={(e) => setRegDob(e.target.value)}
                    className="w-full saas-input px-3 py-2 cursor-pointer"
                  />
                </div>
              </div>

              {/* Badge & Designation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    BADGE NUMBER <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Award className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. B1045"
                      value={regBadge}
                      onChange={(e) => setRegBadge(e.target.value)}
                      className="w-full saas-input pl-9 pr-3 py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    DESIGNATION
                  </label>
                  <select
                    value={regDesignation}
                    onChange={(e) => setRegDesignation(e.target.value)}
                    className="w-full saas-input px-3 py-2 cursor-pointer"
                  >
                    <option value="Investigating Officer">Investigating Officer</option>
                    <option value="Sub-Inspector">Sub-Inspector (SI)</option>
                    <option value="Inspector">Inspector</option>
                    <option value="Station House Officer">Station House Officer (SHO)</option>
                    <option value="Deputy Superintendent of Police">Deputy Superintendent (DySP)</option>
                    <option value="Superintendent of Police">Superintendent of Police (SP)</option>
                  </select>
                </div>
              </div>

              {/* Police Station Autocomplete */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  POLICE STATION / PRECINCT <span className="text-red-500">*</span>
                </label>
                <LocationAutocomplete
                  value={regStation}
                  onChange={(val) => setRegStation(val)}
                  placeholder="Select or type police station name"
                />
              </div>

              {/* Role Select */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  SYSTEM PERMISSION ROLE
                </label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value)}
                  className="w-full saas-input px-3 py-2 cursor-pointer"
                >
                  <option value="officer">Investigating Officer (Standard Access)</option>
                  <option value="sho">Station House Officer (Station Supervisory Access)</option>
                </select>
              </div>

              {/* Passwords */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    PASSWORD <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? "text" : "password"}
                      required
                      placeholder="••••••••••••"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full saas-input pl-3 pr-9 py-2"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showRegPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    CONFIRM PASSWORD <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showRegConfirmPassword ? "text" : "password"}
                      required
                      placeholder="••••••••••••"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      className="w-full saas-input pl-3 pr-9 py-2"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showRegConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Realtime Password Strength Meter */}
              <PasswordStrengthMeter password={regPassword} />

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 flex items-center justify-center gap-2 cursor-pointer font-bold text-sm mt-3"
              >
                <span>{loading ? "Submitting Registration..." : "Submit Registration for Approval"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}

          {/* ================= TAB 3: FORGOT PASSWORD ================= */}
          {activeTab === "forgot" && (
            <div className="space-y-4 text-xs">
              
              {/* Step indicator */}
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 bg-slate-100 p-2 rounded-lg">
                <span className={forgotStep === 1 ? "text-blue-600" : ""}>1. Enter Email</span>
                <span>→</span>
                <span className={forgotStep === 2 ? "text-blue-600" : ""}>2. Verify OTP</span>
                <span>→</span>
                <span className={forgotStep === 3 ? "text-blue-600" : ""}>3. Reset Password</span>
              </div>

              {/* Step 1: Enter Registered Email */}
              {forgotStep === 1 && (
                <form onSubmit={handleForgotEmailSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                      REGISTERED EMAIL ADDRESS
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                        <Mail className="h-4 w-4" />
                      </span>
                      <input
                        type="email"
                        required
                        placeholder="e.g. officer.sharma@police.gov.in"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="w-full saas-input pl-9 pr-4 py-2.5"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-primary py-3 flex items-center justify-center gap-2 cursor-pointer font-bold"
                  >
                    <span>{loading ? "Sending Security Code..." : "Send Verification OTP"}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              )}

              {/* Step 2: Verify OTP Code */}
              {forgotStep === 2 && (
                <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
                  
                  {simulatedOtp && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                        <span>SIMULATED SECURITY OTP CODE</span>
                        <button
                          type="button"
                          onClick={() => setForgotOtp(simulatedOtp)}
                          className="text-blue-600 hover:underline font-bold"
                        >
                          Auto-fill Code
                        </button>
                      </div>
                      <div className="font-mono text-xl font-extrabold tracking-widest text-slate-900">
                        {simulatedOtp}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                      ENTER 6-DIGIT OTP CODE
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="123456"
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value.trim())}
                      className="w-full saas-input font-mono text-center text-lg tracking-widest py-2.5"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-primary py-3 flex items-center justify-center gap-2 cursor-pointer font-bold"
                  >
                    <span>{loading ? "Verifying..." : "Verify OTP Code"}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              )}

              {/* Step 3: Create New Password */}
              {forgotStep === 3 && (
                <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                      NEW PASSWORD
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        required
                        placeholder="••••••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full saas-input pl-3 pr-9 py-2.5"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                      CONFIRM NEW PASSWORD
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••••••"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="w-full saas-input px-3 py-2.5"
                    />
                  </div>

                  <PasswordStrengthMeter password={newPassword} />

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-primary py-3 flex items-center justify-center gap-2 cursor-pointer font-bold"
                  >
                    <span>{loading ? "Updating Password..." : "Update Password & Sign In"}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              )}

            </div>
          )}

        </div>

        {/* Card Footer with Admin Contact trigger */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-600">
          <span>Need Assistance?</span>
          <button
            type="button"
            onClick={() => setIsAdminContactOpen(true)}
            className="text-blue-600 hover:underline flex items-center gap-1.5 cursor-pointer font-bold"
          >
            <HelpCircle className="h-4 w-4 text-amber-500" />
            <span>Contact Administrator</span>
          </button>
        </div>

      </div>
        <p className="mt-5 text-center text-xs text-slate-400">Protected access for authorized law-enforcement personnel.</p>
        </div>
      </section>

      <aside className="relative hidden overflow-hidden bg-slate-950 p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(37,99,235,.42),transparent_30%),radial-gradient(circle_at_82%_86%,rgba(6,182,212,.2),transparent_28%)]" />
        <div className="absolute inset-0 bg-saas-grid opacity-20" />
        <div className="relative z-10 flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-blue-200"><Shield className="h-4 w-4" />Law-enforcement intelligence</div>
        <div className="relative z-10 max-w-md">
          <div className="mb-8 flex h-64 items-center justify-center rounded-[2rem] border border-white/10 bg-white/[.04] backdrop-blur-sm">
            <img src={heroIllustration} alt="CrimeGPT intelligence platform" className="h-52 w-auto drop-shadow-[0_20px_30px_rgba(0,0,0,.35)]" />
          </div>
          <h2 className="text-4xl font-bold leading-tight tracking-tight text-white">Intelligence that keeps every case moving.</h2>
          <p className="mt-5 max-w-sm text-base leading-relaxed text-slate-300">A protected workspace for case records, legal research, evidence, and compliant reporting.</p>
        </div>
        <blockquote className="relative z-10 max-w-md border-l-2 border-blue-400 pl-4 text-sm leading-relaxed text-slate-300">“Designed for accountable investigations and faster, better-informed decisions.”</blockquote>
      </aside>

      {/* Reusable Admin Contact Modal */}
      <AdminContactModal
        isOpen={isAdminContactOpen}
        onClose={() => setIsAdminContactOpen(false)}
      />

    </div>
  );
}
