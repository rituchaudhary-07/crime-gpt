import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, FilePlus, Briefcase, MessageSquareCode, 
  FileText, Search, ClipboardList, BarChart3, History, 
  Settings, LogOut, User, Bell, Calendar, SearchCheck, Globe
} from "lucide-react";
import { api } from "./utils/api";

// Page imports
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NewCase from "./pages/NewCase";
import CaseManagement from "./pages/CaseManagement";
import AIAssistant from "./pages/AIAssistant";
import FIRGenerator from "./pages/FIRGenerator";
import LegalSearch from "./pages/LegalSearch";
import EvidenceManager from "./pages/EvidenceManager";
import Analytics from "./pages/Analytics";
import ChatHistory from "./pages/ChatHistory";
import SettingsPage from "./pages/Settings";
import UserProfile from "./pages/UserProfile";

// Master Layout Wrapper
function Layout({ children }) {
  const isAuthenticated = api.isAuthenticated();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");
  
  useEffect(() => {
    if (isAuthenticated) {
      setUsername(api.getUsername());
      setRole(api.getUserRole());
    }
  }, [isAuthenticated, location.pathname]);

  const handleLogout = () => {
    api.logout();
    navigate("/login");
  };

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard className="h-4.5 w-4.5" /> },
    { name: "New Case", path: "/new-case", icon: <FilePlus className="h-4.5 w-4.5" /> },
    { name: "Case Management", path: "/cases", icon: <Briefcase className="h-4.5 w-4.5" /> },
    { name: "AI Assistant", path: "/assistant", icon: <MessageSquareCode className="h-4.5 w-4.5" /> },
    { name: "FIR Generator", path: "/fir-generator", icon: <FileText className="h-4.5 w-4.5" /> },
    { name: "Legal Search", path: "/legal-search", icon: <SearchCheck className="h-4.5 w-4.5" /> },
    { name: "Evidence", path: "/evidence", icon: <ClipboardList className="h-4.5 w-4.5" /> },
    { name: "Analytics", path: "/analytics", icon: <BarChart3 className="h-4.5 w-4.5" /> },
    { name: "History", path: "/history", icon: <History className="h-4.5 w-4.5" /> },
    { name: "Settings", path: "/settings", icon: <Settings className="h-4.5 w-4.5" /> }
  ];

  if (!isAuthenticated) {
    return <div className="min-h-screen bg-saas-grid">{children}</div>;
  }

  const roleName = (r) => {
    if (r === "admin") return "Superintendent / Admin";
    if (r === "sho") return "Station House Officer";
    return "Investigating Officer";
  };

  const todayDate = new Date().toLocaleDateString("en-US", {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
  });

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans">
      
      {/* Sidebar Panel */}
      <aside className="w-64 bg-white border-r border-[#E2E8F0] flex flex-col justify-between fixed h-screen z-20">
        <div className="flex flex-col">
          {/* Logo Brand Header */}
          <div className="h-16 flex items-center px-6 border-b border-[#F1F5F9] gap-3 cursor-pointer" onClick={() => navigate("/dashboard")}>
            <div className="h-8 w-8 bg-[#2563EB] rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">
              CG
            </div>
            <div>
              <span className="block text-sm font-bold tracking-tight text-[#111827]">
                Crime<span className="text-[#2563EB]">GPT</span>
              </span>
              <span className="block text-[9px] font-medium text-[#6B7280] tracking-widest uppercase">
                POLICE HQ KERNEL
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    isActive 
                      ? "bg-[#EFF6FF] text-[#2563EB] font-bold" 
                      : "text-[#4B5563] hover:text-[#111827] hover:bg-[#F1F5F9]"
                  }`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Profile Card & Logout */}
        <div className="p-4 border-t border-[#F1F5F9] space-y-3">
          <div 
            onClick={() => navigate("/profile")}
            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#F8FAFC] cursor-pointer transition-colors border border-transparent hover:border-[#E2E8F0]"
          >
            <div className="h-9 w-9 bg-[#EFF6FF] text-[#2563EB] rounded-lg flex items-center justify-center font-bold text-xs">
              {username ? username.charAt(0).toUpperCase() : "O"}
            </div>
            <div className="flex-1 overflow-hidden">
              <span className="block text-xs font-bold text-[#111827] truncate leading-none">{username}</span>
              <span className="text-[9px] font-semibold text-[#6B7280] truncate leading-none mt-1 block">
                {roleName(role)}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#EF4444] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
          >
            <LogOut className="h-4.5 w-4.5" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>

      {/* Main Right Content Panel */}
      <div className="flex-1 pl-64 flex flex-col min-h-screen">
        
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-[#E2E8F0] px-8 flex items-center justify-between sticky top-0 z-10">
          
          {/* Header Global Search Input */}
          <div className="relative w-80">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#9CA3AF]">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search sections, FIR numbers, case files..."
              className="w-full saas-input pl-9 pr-4 py-2 text-xs"
            />
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-5">
            {/* Calendar widget */}
            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-[#6B7280] bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-1.5 rounded-xl">
              <Calendar className="h-3.5 w-3.5 text-[#9CA3AF]" />
              <span>{todayDate}</span>
            </div>

            {/* Notification Bell */}
            <button className="p-2 rounded-xl text-[#6B7280] hover:text-[#111827] hover:bg-[#F8FAFC] border border-transparent hover:border-[#E2E8F0] transition-all relative cursor-pointer">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#EF4444] border-2 border-white" />
            </button>

            {/* Global API State Indicator */}
            <div className="flex items-center gap-2 text-xs font-semibold text-[#6B7280]">
              <Globe className="h-4 w-4 text-[#10B981]" />
              <span className="hidden md:inline font-mono text-[10px]">LOCAL ENGINE ACTIVE</span>
            </div>

            {/* Header Sign Out Action */}
            <button 
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3.5 py-1.5 border border-red-100 bg-red-50/40 hover:bg-red-50 text-red-600 rounded-xl text-[11px] font-bold cursor-pointer transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 p-8 bg-saas-grid">
          <div className="animate-slide-up">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}

// Guard for authenticated pages
function PrivateRoute({ children }) {
  const auth = api.isAuthenticated();
  return auth ? (
    <Layout>{children}</Layout>
  ) : (
    <Navigate to="/login" replace />
  );
}

// Guard for guest routes (login, landing)
function GuestRoute({ children }) {
  const auth = api.isAuthenticated();
  return !auth ? (
    <Layout>{children}</Layout>
  ) : (
    <Navigate to="/dashboard" replace />
  );
}

// Admin guard
function AdminRoute({ children }) {
  const role = api.getUserRole();
  return role === "admin" ? children : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing Page */}
        <Route 
          path="/" 
          element={
            api.isAuthenticated() ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Landing />
            )
          } 
        />

        {/* Auth page */}
        <Route 
          path="/login" 
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          } 
        />

        {/* Private Dashboard Portal pages */}
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } 
        />
        
        <Route 
          path="/new-case" 
          element={
            <PrivateRoute>
              <NewCase />
            </PrivateRoute>
          } 
        />

        <Route 
          path="/cases" 
          element={
            <PrivateRoute>
              <CaseManagement />
            </PrivateRoute>
          } 
        />

        <Route 
          path="/assistant" 
          element={
            <PrivateRoute>
              <AIAssistant />
            </PrivateRoute>
          } 
        />

        <Route 
          path="/fir-generator" 
          element={
            <PrivateRoute>
              <FIRGenerator />
            </PrivateRoute>
          } 
        />

        <Route 
          path="/legal-search" 
          element={
            <PrivateRoute>
              <LegalSearch />
            </PrivateRoute>
          } 
        />

        <Route 
          path="/evidence" 
          element={
            <PrivateRoute>
              <EvidenceManager />
            </PrivateRoute>
          } 
        />

        <Route 
          path="/analytics" 
          element={
            <PrivateRoute>
              <Analytics />
            </PrivateRoute>
          } 
        />

        <Route 
          path="/history" 
          element={
            <PrivateRoute>
              <ChatHistory />
            </PrivateRoute>
          } 
        />

        <Route 
          path="/settings" 
          element={
            <PrivateRoute>
              <SettingsPage />
            </PrivateRoute>
          } 
        />

        <Route 
          path="/profile" 
          element={
            <PrivateRoute>
              <UserProfile />
            </PrivateRoute>
          } 
        />

        {/* Fallback redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
