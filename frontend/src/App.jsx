import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, FilePlus, Briefcase, MessageSquareCode, 
  FileText, Search, ClipboardList, BarChart3, History, 
  Settings, LogOut, User, Bell, Calendar, SearchCheck, Globe, Menu, X, Loader2
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
import SettingsPage from "./pages/Settings";
import UserProfile from "./pages/UserProfile";

import Sidebar from "./components/layout/Sidebar";
import TopNav from "./components/layout/TopNav";

// Master Layout Wrapper
function Layout({ children }) {
  const isAuthenticated = api.isAuthenticated();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");
  
  // Notification State
  const [notifications, setNotifications] = useState([]);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [dismissingIds, setDismissingIds] = useState(new Set());
  const [toastError, setToastError] = useState("");

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

  useEffect(() => { setShowMobileNav(false); }, [location.pathname]);

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
      const notifArray = Array.isArray(data) ? data : (data?.notifications || []);
      setNotifications(notifArray);
    } catch (err) {
      console.log("Failed loading notifications:", err);
      setNotifications([]);
    }
  };

  const handleDismissNotification = async (e, id) => {
    e.stopPropagation();
    if (dismissingIds.has(id)) return;

    setDismissingIds(prev => new Set(prev).add(id));
    setToastError("");

    try {
      await api.dismissNotification(id);
      setNotifications(prev => (Array.isArray(prev) ? prev.filter(n => n.id !== id) : []));
    } catch (err) {
      console.error("Failed to dismiss notification:", err);
      setToastError(err.message || "Failed to dismiss notification. Please try again.");
    } finally {
      setDismissingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
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

  if (!isAuthenticated) {
    return <div className="min-h-screen bg-saas-grid">{children}</div>;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* Sidebar Navigation */}
      <Sidebar
        mobileOpen={showMobileNav}
        onCloseMobile={() => setShowMobileNav(false)}
      />

      {/* Main Content Area */}
      <div className="flex min-h-screen flex-1 flex-col lg:pl-60">
        
        {/* Top Operational Header */}
        <TopNav
          onOpenMobileNav={() => setShowMobileNav(true)}
          globalQuery={globalQuery}
          setGlobalQuery={setGlobalQuery}
          onGlobalSearch={handleGlobalSearch}
          notifications={notifications}
          loadNotifications={loadNotifications}
          dismissingIds={dismissingIds}
          handleDismissNotification={handleDismissNotification}
        />

        {/* Page Content Container */}
        <main className="flex-1 bg-saas-grid p-4 sm:p-6 lg:p-8">
          <div className="animate-fade-in">
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

// React Error Boundary to catch render failures gracefully
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("NyayaIQ UI Boundary Error:", error, errorInfo);
  }

  handleReset = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 text-sans">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full text-center space-y-5">
            <div className="h-14 w-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto text-xl font-bold border border-red-100">
              ⚠️
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Session Interface Reset Required</h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                An unexpected UI rendering error occurred or stale authentication data was found in your browser cache.
              </p>
            </div>
            <button
              onClick={this.handleReset}
              className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs py-3 rounded-xl shadow-md transition-all cursor-pointer"
            >
              Clear Session Cache & Sign In Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
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
  </ErrorBoundary>
  );
}
