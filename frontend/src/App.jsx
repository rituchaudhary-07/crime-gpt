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
  
  // Notification State
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Global Search State
  const [globalQuery, setGlobalQuery] = useState("");
  const [globalResults, setGlobalResults] = useState(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      setUsername(api.getUsername());
      setRole(api.getUserRole());
      loadNotifications();
    }
  }, [isAuthenticated, location.pathname]);

  // Session Inactivity Timeout (15 minutes = 900,000 ms)
  useEffect(() => {
    if (!isAuthenticated) return;
    let timeoutId;
    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        alert("Session expired due to 15 minutes of inactivity. Please sign in again.");
        handleLogout();
      }, 15 * 60 * 1000);
    };

    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);
    window.addEventListener("click", resetTimer);
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      window.removeEventListener("click", resetTimer);
    };
  }, [isAuthenticated]);

  const loadNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.log("Failed loading notifications:", err);
    }
  };

  const handleLogout = () => {
    api.logout();
    navigate("/login");
  };

  const handleGlobalSearch = async (e) => {
    if (e) e.preventDefault();
    if (!globalQuery.trim()) return;
    setShowSearchModal(true);
    setSearchLoading(true);
    try {
      const res = await api.globalSearch(globalQuery);
      setGlobalResults(res);
    } catch (err) {
      console.log("Global search failed:", err);
    } finally {
      setSearchLoading(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

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
          <form onSubmit={handleGlobalSearch} className="relative w-80">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#9CA3AF]">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search Cases, FIRs, Officers, Sections... (Press Enter)"
              value={globalQuery}
              onChange={(e) => setGlobalQuery(e.target.value)}
              className="w-full saas-input pl-9 pr-4 py-2 text-xs"
            />
          </form>

          {/* Header Actions */}
          <div className="flex items-center gap-5">
            {/* Calendar widget */}
            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-[#6B7280] bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-1.5 rounded-xl">
              <Calendar className="h-3.5 w-3.5 text-[#9CA3AF]" />
              <span>{todayDate}</span>
            </div>

            {/* Notification Bell & Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-xl text-[#6B7280] hover:text-[#111827] hover:bg-[#F8FAFC] border border-transparent hover:border-[#E2E8F0] transition-all relative cursor-pointer"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-4 min-w-4 px-1 rounded-full bg-[#EF4444] text-white text-[9px] font-mono font-bold flex items-center justify-center border-2 border-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden animate-slide-down">
                  <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 font-mono uppercase">System Alert Notifications</span>
                    <button
                      onClick={async () => {
                        await api.markAllNotificationsRead();
                        loadNotifications();
                      }}
                      className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      Mark All Read
                    </button>
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 text-xs">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-[11px] italic">No notifications</div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={async () => {
                            await api.markNotificationRead(n.id);
                            loadNotifications();
                          }}
                          className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors ${!n.read ? 'bg-blue-50/50' : ''}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-slate-900 text-[11px]">{n.title}</span>
                            <span className="text-[9px] font-mono text-slate-400">{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-snug">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

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

      {/* Global Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white p-6 rounded-2xl max-w-2xl w-full space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-blue-600 uppercase">ADVANCED GLOBAL POLICE SYSTEM SEARCH</span>
                <h3 className="text-sm font-bold text-slate-900">Search Results for "{globalQuery}"</h3>
              </div>
              <button onClick={() => setShowSearchModal(false)} className="text-slate-400 hover:text-slate-700 font-bold p-1">✕</button>
            </div>

            {searchLoading ? (
              <div className="text-center py-12 text-xs font-mono text-slate-400 animate-pulse">SEARCHING POLICE DATABASE...</div>
            ) : !globalResults ? (
              <div className="text-center py-8 text-xs text-slate-500">No results returned.</div>
            ) : (
              <div className="space-y-4 text-xs max-h-96 overflow-y-auto pr-1">
                {/* Cases Match */}
                {globalResults.cases && globalResults.cases.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">Matching Case Dossiers ({globalResults.cases.length})</span>
                    <div className="grid gap-2">
                      {globalResults.cases.map(c => (
                        <div key={c.id} onClick={() => { setShowSearchModal(false); navigate(`/fir-generator?caseId=${c.id}`); }} className="p-3 bg-slate-50 rounded-xl border border-slate-200 hover:bg-blue-50/50 cursor-pointer flex justify-between items-center">
                          <div>
                            <span className="font-bold text-slate-900 block">#{c.id} - {c.title}</span>
                            <span className="text-[10px] text-slate-500">{c.location} • Status: {c.status}</span>
                          </div>
                          <span className="text-[10px] font-bold text-blue-600">View Dossier &rarr;</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Officers Match */}
                {globalResults.officers && globalResults.officers.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">Matching Officers ({globalResults.officers.length})</span>
                    <div className="grid gap-2">
                      {globalResults.officers.map(o => (
                        <div key={o.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="font-bold text-slate-900 block">@{o.username} ({o.badge_number || 'Officer'})</span>
                          <span className="text-[10px] text-slate-500">{o.station} • Role: {o.role}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Legal Sections Match */}
                {globalResults.sections && globalResults.sections.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">Matching Legal Code Provisions ({globalResults.sections.length})</span>
                    <div className="grid gap-2">
                      {globalResults.sections.map(s => (
                        <div key={s.id} onClick={() => { setShowSearchModal(false); navigate("/legal-search"); }} className="p-3 bg-slate-50 rounded-xl border border-slate-200 hover:bg-blue-50/50 cursor-pointer">
                          <span className="font-bold text-blue-600 block">{s.act} Section {s.section_number}: {s.title}</span>
                          <span className="text-[10px] text-slate-600 block mt-1">{s.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(!globalResults.cases?.length && !globalResults.officers?.length && !globalResults.sections?.length) && (
                  <div className="text-center py-8 text-xs text-slate-500 italic">No records matched search term '{globalQuery}'.</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

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
