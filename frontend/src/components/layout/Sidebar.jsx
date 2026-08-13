import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, FilePlus, Briefcase, MessageSquareCode, 
  FileText, SearchCheck, ClipboardList, BarChart3, 
  Settings, LogOut, Shield, ChevronRight, UserCheck
} from "lucide-react";
import { api } from "../../utils/api";

export default function Sidebar({ mobileOpen = false, onCloseMobile = () => {} }) {
  const location = useLocation();
  const navigate = useNavigate();
  const username = api.getUsername() || "Officer";
  const role = api.getUserRole();

  const getRoleTitle = (r) => {
    if (r === "admin") return "Superintendent / Admin";
    if (r === "sho") return "Station House Officer";
    return "Investigating Officer";
  };

  const navGroups = [
    {
      group: "Core Workflow",
      items: [
        { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
        { name: "New Investigation", path: "/new-case", icon: <FilePlus className="h-4 w-4" /> },
        { name: "Case Management", path: "/cases", icon: <Briefcase className="h-4 w-4" /> },
      ]
    },
    {
      group: "Intelligence & RAG",
      items: [
        { name: "AI Assistant", path: "/assistant", icon: <MessageSquareCode className="h-4 w-4" />, badge: "AI" },
        { name: "FIR Generator", path: "/fir-generator", icon: <FileText className="h-4 w-4" /> },
        { name: "Legal Search", path: "/legal-search", icon: <SearchCheck className="h-4 w-4" /> },
      ]
    },
    {
      group: "Vault & Audit",
      items: [
        { name: "Evidence Vault", path: "/evidence", icon: <ClipboardList className="h-4 w-4" /> },
        { name: "Analytics & Metrics", path: "/analytics", icon: <BarChart3 className="h-4 w-4" /> },
      ]
    },
    {
      group: "System",
      items: [
        { name: "Settings", path: "/settings", icon: <Settings className="h-4 w-4" /> },
      ]
    }
  ];

  const handleLogout = () => {
    api.logout();
    navigate("/login");
  };

  return (
    <>
      {mobileOpen && (
        <button
          aria-label="Close Mobile Overlay"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden backdrop-blur-xs"
        />
      )}
      <aside className={`fixed z-50 flex h-screen w-60 flex-col justify-between border-r border-slate-800 bg-slate-950 text-slate-100 transition-transform duration-200 lg:translate-x-0 ${mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}`}>
        <div className="flex flex-col flex-1 overflow-y-auto">
          
          {/* Platform Brand Header */}
          <div 
            onClick={() => navigate("/dashboard")}
            className="h-16 flex items-center px-4 border-b border-slate-800/80 gap-3 cursor-pointer hover:bg-slate-900/60 transition-colors"
          >
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold font-mono text-xs shadow-md border border-blue-400/30">
              NQ
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black tracking-tight text-white">Nyaya<span className="text-blue-500">IQ</span></span>
                <span className="px-1 py-0.2 bg-blue-500/20 text-blue-300 text-[8px] font-mono font-bold rounded border border-blue-500/30 uppercase">PRO</span>
              </div>
              <span className="block text-[8.5px] font-mono font-bold text-slate-400 tracking-wider uppercase">
                Legal Intelligence Platform
              </span>
            </div>
          </div>

          {/* Nav Groups */}
          <nav className="p-3 space-y-4 flex-1">
            {navGroups.map((grp) => (
              <div key={grp.group} className="space-y-1">
                <span className="px-2 text-[9.5px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  {grp.group}
                </span>
                {grp.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={onCloseMobile}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                        isActive
                          ? "bg-blue-600 text-white shadow-sm font-bold"
                          : "text-slate-300 hover:text-white hover:bg-slate-900"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={isActive ? "text-white" : "text-slate-400"}>{item.icon}</span>
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className="px-1.5 py-0.2 bg-teal-500/20 text-teal-300 text-[9px] font-mono font-bold rounded border border-teal-500/30">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Footer Profile & Logout */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/40 space-y-2">
          <div 
            onClick={() => navigate("/profile")}
            className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-800/60 cursor-pointer transition-colors border border-transparent hover:border-slate-700/60"
          >
            <div className="h-7 w-7 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-md flex items-center justify-center font-mono font-bold text-xs">
              {username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <span className="block text-xs font-bold text-slate-200 truncate leading-none">{username}</span>
              <span className="text-[9.5px] font-mono text-slate-400 truncate leading-none mt-0.5 block">
                {getRoleTitle(role)}
              </span>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-slate-500 shrink-0" />
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-colors cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>
    </>
  );
}
