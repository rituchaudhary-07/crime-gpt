import React, { useState, useEffect } from "react";
import { User, ClipboardList, ShieldAlert, Cpu, RefreshCw, AlertCircle, Clock, Database } from "lucide-react";
import { api } from "../utils/api";

export default function UserProfile() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const username = api.getUsername();
  const role = api.getUserRole();

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    setError("");
    try {
      // Admins load all logs, Officers load own logs
      const data = await api.getLogs();
      setLogs(data);
    } catch (err) {
      setError("Failed to load audit timelines: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (r) => {
    if (r === "admin") return "bg-purple-50 border-purple-200 text-purple-750";
    if (r === "sho") return "bg-blue-50 border-blue-200 text-[#2563EB]";
    return "bg-slate-50 border-slate-200 text-slate-700";
  };

  const formatRole = (r) => {
    if (r === "admin") return "Superintendent / Admin";
    if (r === "sho") return "Station House Officer";
    return "Investigating Officer";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-sans select-none">
      
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[#111827]">Officer Account Profile</h1>
        <p className="text-xs text-[#6B7280] mt-1">Review credentials, active precinct stations, and secure audit activities.</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
          <AlertCircle className="h-4.5 w-4.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Account Info Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        
        {/* User Card */}
        <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm flex items-center gap-4 md:col-span-2">
          <div className="h-14 w-14 bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm">
            {username ? username.charAt(0).toUpperCase() : "O"}
          </div>
          <div className="space-y-1.5 text-xs">
            <h3 className="text-base font-bold text-[#111827]">{username}</h3>
            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase ${getRoleBadge(role)}`}>
              {formatRole(role)}
            </span>
            <span className="block text-[10px] text-[#6B7280] font-medium">Precinct Station: Central Cyber Crimes PS</span>
          </div>
        </div>

        {/* Badge Card */}
        <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col justify-between h-32">
          <span className="text-[10px] font-bold text-[#6B7280] font-mono tracking-widest uppercase">OFFICIAL BADGE ID</span>
          <div>
            <span className="text-2xl font-black text-[#111827] font-mono">
              {username === "officer_admin" ? "B1001" : username === "sho_test" ? "B1003" : "B1002"}
            </span>
            <span className="block text-[10px] text-[#6B7280] font-medium mt-1">Verified Duty Stamp</span>
          </div>
        </div>

      </div>

      {/* Audit timeline */}
      <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4.5 w-4.5 text-[#2563EB]" />
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-[#111827]">Officer Audit Timeline</h3>
          </div>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="p-2 hover:bg-[#F8FAFC] border border-transparent hover:border-[#E2E8F0] rounded-lg text-[#6B7280]"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-10 text-xs text-[#6B7280] font-mono animate-pulse">PULLING AUDIT RECORDS...</div>
        ) : logs.length === 0 ? (
          <p className="text-center text-[#6B7280] italic text-xs py-4">No audit logs registered under this clearance.</p>
        ) : (
          <div className="space-y-4 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#F1F5F9] max-h-[350px] overflow-y-auto pr-1">
            {logs.map((log) => (
              <div key={log.id} className="flex gap-4 relative pl-8 text-xs leading-normal">
                {/* Node icon dot */}
                <div className="absolute left-1.5 top-1 h-4 w-4 rounded-full bg-[#2563EB] border-4 border-white shadow-sm ring-1 ring-blue-100 flex items-center justify-center shrink-0 z-10" />
                
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between font-mono text-[9px] text-[#6B7280]">
                    <span className="font-bold text-[#111827]">@{log.user}</span>
                    <span className="flex items-center gap-1 font-semibold">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                    </span>
                  </div>
                  <span className="block font-mono text-[9px] font-bold text-[#2563EB] uppercase">{log.action}</span>
                  <p className="text-[10px] text-[#4B5563] leading-normal">{log.details}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
