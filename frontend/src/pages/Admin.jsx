import React, { useState, useEffect } from "react";
import { Shield, ShieldAlert, Users, ClipboardList, Plus, Key, User, Award, AlertCircle } from "lucide-react";
import { api } from "../utils/api";

export default function Admin() {
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // New User Form State
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newBadge, setNewBadge] = useState("");
  const [newRole, setNewRole] = useState("officer");
  const [actionMsg, setActionMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    setError("");
    try {
      const logsData = await api.getLogs();
      const usersData = await api.getUsers();
      setLogs(logsData);
      setUsers(usersData);
    } catch (err) {
      setError("Authorization denied or API failure: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setActionMsg({ type: "", text: "" });
    try {
      await api.register(newUsername, newPassword, newBadge, newRole);
      setActionMsg({ type: "success", text: `Officer account '${newUsername}' registered successfully.` });
      // Reset form
      setNewUsername("");
      setNewPassword("");
      setNewBadge("");
      setNewRole("officer");
      // Reload lists
      const usersData = await api.getUsers();
      setUsers(usersData);
    } catch (err) {
      setActionMsg({ type: "error", text: "Failed to create officer account: " + err.message });
    }
  };

  const getLogColor = (action) => {
    if (action.includes("DELETE")) return "text-rose-400";
    if (action.includes("CREATE")) return "text-emerald-400";
    if (action.includes("LOGIN")) return "text-cyan-400";
    return "text-slate-300";
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8 font-sans">
      <div className="border-b border-police-800 pb-4">
        <h1 className="text-2xl font-extrabold text-slate-100">Superintendent Admin Controls</h1>
        <p className="text-xs text-slate-400 mt-1">Review chronological compliance audit logs, control officer accounts, and verify database integrity.</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        
        {/* Left 2 Cols: Chronological System Logs */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center space-x-3">
            <ClipboardList className="h-5 w-5 text-cyber-cyan" />
            <h2 className="text-lg font-bold text-white">Security Compliance Logs</h2>
          </div>

          <div className="rounded-2xl glass-panel border-glass-inset shadow-glass p-5 max-h-[580px] overflow-y-auto space-y-3 scroll-smooth">
            {loading ? (
              <div className="text-center text-slate-500 py-8 font-mono text-xs">QUERYING AUDIT TRAIL DATA...</div>
            ) : logs.length === 0 ? (
              <div className="text-center text-slate-500 py-8 font-mono text-xs">NO AUDIT LOGS RECORDED.</div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="p-3 bg-police-950/50 border border-police-900/60 rounded-xl space-y-1.5 font-mono text-[11px] leading-relaxed">
                  <div className="flex justify-between items-center text-slate-400 border-b border-police-900 pb-1">
                    <span className="font-bold">ID: #{log.id}</span>
                    <span>{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-300">USER: <span className="text-cyan-400 font-sans">{log.user}</span></span>
                    <span className={`font-extrabold uppercase ${getLogColor(log.action)}`}>{log.action}</span>
                  </div>
                  <div className="text-slate-400 mt-1 font-sans">
                    <span className="font-semibold text-slate-500 font-mono text-[10px]">DETAILS: </span>
                    {log.details}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right 1 Col: User accounts control */}
        <div className="space-y-6">
          
          {/* User Registration Form inside panel */}
          <div className="rounded-2xl glass-panel p-6 border-glass-inset shadow-glass space-y-4">
            <div className="flex items-center space-x-3 border-b border-police-800 pb-3">
              <Plus className="h-5 w-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white">Add Officer Account</h2>
            </div>

            {actionMsg.text && (
              <div className={`p-3 rounded-lg text-xs border ${
                actionMsg.type === "error" 
                  ? "bg-rose-950/30 border-rose-500/30 text-rose-400" 
                  : "bg-emerald-950/30 border-emerald-500/30 text-emerald-400"
              }`}>
                <span>{actionMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1 font-mono">USERNAME</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-500">
                    <User className="h-3.5 w-3.5" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. inspector_vijay"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full glass-input pl-9 pr-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1 font-mono">PASSWORD</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-500">
                    <Key className="h-3.5 w-3.5" />
                  </span>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full glass-input pl-9 pr-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1 font-mono">BADGE ID</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-500">
                    <Award className="h-3.5 w-3.5" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. B-1052"
                    value={newBadge}
                    onChange={(e) => setNewBadge(e.target.value)}
                    className="w-full glass-input pl-9 pr-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1 font-mono">SECURITY ROLE</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full glass-input px-2.5 py-2 text-xs cursor-pointer focus:border-cyan-400"
                >
                  <option value="officer" className="bg-police-900 text-slate-200">Investigating Officer</option>
                  <option value="admin" className="bg-police-900 text-slate-200">Superintendent / Admin</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-police-600 to-cyber-cyan text-white font-bold text-xs hover:shadow-cyber-glow transition-all cursor-pointer"
              >
                Create Account
              </button>
            </form>
          </div>

          {/* User List Panel */}
          <div className="rounded-2xl glass-panel p-6 border-glass-inset shadow-glass space-y-4">
            <div className="flex items-center space-x-3 border-b border-police-800 pb-3">
              <Users className="h-5 w-5 text-purple-400" />
              <h2 className="text-base font-bold text-white font-sans">Active Officer Logs ({users.length})</h2>
            </div>
            
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {loading ? (
                <div className="text-center text-slate-500 py-3 text-xs">Loading accounts...</div>
              ) : (
                users.map((userItem) => (
                  <div key={userItem.id} className="flex justify-between items-center p-2.5 bg-police-950/30 border border-police-900/50 rounded-xl text-xs">
                    <div>
                      <span className="block font-bold text-slate-200">{userItem.username}</span>
                      <span className="block text-[10px] text-slate-400 font-mono">Badge: {userItem.badge_number || "None"}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold font-mono uppercase ${
                      userItem.role === "admin" ? "bg-purple-950 border border-purple-500/30 text-purple-400" : "bg-blue-950 border border-blue-500/30 text-blue-400"
                    }`}>
                      {userItem.role}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
