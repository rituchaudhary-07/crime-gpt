import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { Shield, LogOut, Menu, X, Key, ShieldAlert, Cpu } from "lucide-react";
import { api } from "../utils/api";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");
  const [hasApiKey, setHasApiKey] = useState(false);
  
  const isAuthenticated = api.isAuthenticated();

  useEffect(() => {
    if (isAuthenticated) {
      setUsername(api.getUsername());
      setRole(api.getUserRole());
      const key = localStorage.getItem("gemini_api_key");
      setHasApiKey(!!key);
    }
  }, [isAuthenticated, location.pathname]);

  const handleLogout = () => {
    api.logout();
    navigate("/login");
  };

  if (!isAuthenticated) return null;

  const navItems = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Analyze Evidence", path: "/analyze" },
    { name: "FIR Archive", path: "/history" },
    { name: "Settings", path: "/settings" },
  ];

  if (role === "admin") {
    navItems.push({ name: "Admin Audit", path: "/admin" });
  }

  return (
    <nav className="sticky top-4 z-50 mx-auto w-[95%] max-w-7xl rounded-2xl glass-panel px-6 py-3 shadow-glass border-glass-inset">
      <div className="flex items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate("/dashboard")}>
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-police-600 to-cyber-cyan text-white shadow-cyber-glow">
            <Shield className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-cyan opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyber-cyan"></span>
            </span>
          </div>
          <div>
            <span className="block text-base font-extrabold tracking-wider text-slate-100 font-sans">
              CRIME<span className="text-cyber-cyan">GPT</span>
            </span>
            <span className="block text-[10px] tracking-widest text-slate-400 font-mono">
              SECURE LAW INTELLIGENCE
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-police-700/50 text-cyber-cyan border-b-2 border-cyber-cyan/60"
                    : "text-slate-300 hover:text-slate-100 hover:bg-police-800/40"
                }`
              }
            >
              {item.name}
            </NavLink>
          ))}
        </div>

        {/* Profile Card & Controls */}
        <div className="hidden md:flex items-center space-x-4">
          {/* Custom API Key Badge */}
          <div 
            title={hasApiKey ? "Custom API Key Loaded" : "Default Backend Key in use (Fallback)"}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
              hasApiKey 
                ? "bg-emerald-950/80 border border-emerald-500/30 text-emerald-400" 
                : "bg-amber-950/80 border border-amber-500/30 text-amber-400"
            }`}
          >
            <Cpu className="h-3 w-3" />
            <span className="font-mono">{hasApiKey ? "GEMINI_CUSTOM" : "GEMINI_ENV"}</span>
          </div>

          {/* User badge details */}
          <div className="flex flex-col text-right">
            <span className="text-sm font-bold text-slate-200">{username}</span>
            <span className="text-[10px] font-mono text-cyan-400/80 uppercase">
              {role === "admin" ? "Superintendent / Admin" : "Investigating Officer"}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center p-2.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 border border-transparent hover:border-rose-900/30 transition-all duration-200 cursor-pointer"
            title="Log Out Session"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>

        {/* Mobile Navigation Toggle */}
        <div className="flex md:hidden items-center space-x-3">
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 transition-colors"
            title="Log Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg text-slate-300 hover:text-slate-100 hover:bg-police-800/40 transition-colors"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isOpen && (
        <div className="md:hidden mt-3 pt-3 border-t border-police-800/50 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `block px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-police-800 text-cyber-cyan"
                    : "text-slate-300 hover:text-slate-100 hover:bg-police-800/30"
                }`
              }
            >
              {item.name}
            </NavLink>
          ))}
          <div className="flex items-center justify-between px-4 py-3 bg-police-900/40 rounded-xl border border-police-800/40">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-300">{username}</span>
              <span className="text-[9px] font-mono text-cyan-400/80 uppercase">{role}</span>
            </div>
            
            <div className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
              hasApiKey ? "bg-emerald-950 text-emerald-400" : "bg-amber-950 text-amber-400"
            }`}>
              <span>{hasApiKey ? "CUSTOM" : "ENV"}</span>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
