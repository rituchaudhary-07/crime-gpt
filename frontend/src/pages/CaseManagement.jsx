import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Briefcase, Search, FileDown, Eye, Edit3, 
  Trash2, ClipboardList, RefreshCw, AlertCircle, Calendar, MapPin, User,
  CheckCircle2, XCircle, UserCheck, ShieldAlert
} from "lucide-react";
import { api } from "../utils/api";

export default function CaseManagement() {
  const navigate = useNavigate();
  const role = api.getUserRole();
  const currentUsername = api.getUsername();

  const [cases, setCases] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Decline Modal State
  const [declineModalCaseId, setDeclineModalCaseId] = useState(null);
  const [declineReason, setDeclineReason] = useState("Already handling maximum cases");
  const [customDeclineReason, setCustomDeclineReason] = useState("");

  useEffect(() => {
    loadCases();
    if (role === "admin") {
      api.getUsers().then(setUsers).catch(() => {});
    }
  }, []);

  const loadCases = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.getCases();
      setCases(data);
    } catch (err) {
      setError("Failed to load case files: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (e, caseId) => {
    e.stopPropagation();
    setActionSuccess("");
    setError("");
    try {
      await api.acceptCase(caseId);
      setActionSuccess(`Case ID #${caseId} investigation ACCEPTED.`);
      loadCases();
    } catch (err) {
      setError("Accept failed: " + err.message);
    }
  };

  const handleDeclineSubmit = async (e) => {
    e.preventDefault();
    if (!declineModalCaseId) return;
    const finalReason = declineReason === "Other" ? customDeclineReason : declineReason;
    setActionSuccess("");
    setError("");
    try {
      await api.declineCase(declineModalCaseId, finalReason);
      setActionSuccess(`Case ID #${declineModalCaseId} investigation DECLINED.`);
      setDeclineModalCaseId(null);
      loadCases();
    } catch (err) {
      setError("Decline failed: " + err.message);
    }
  };

  const handleAssign = async (e, caseId, officerId) => {
    e.stopPropagation();
    if (!officerId) return;
    setActionSuccess("");
    setError("");
    try {
      await api.assignCase(caseId, parseInt(officerId));
      setActionSuccess(`Case #${caseId} assigned to officer.`);
      loadCases();
    } catch (err) {
      setError("Assign failed: " + err.message);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Permanently delete case files from database?")) return;
    try {
      await api.deleteCase(id);
      loadCases();
    } catch (err) {
      setError("Delete failed: " + err.message);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "draft": return "bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]";
      case "assigned": return "bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]";
      case "accepted": return "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]";
      case "rejected_by_officer": return "bg-rose-50 text-rose-700 border-rose-200";
      case "under_investigation": return "bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]";
      case "fir_generated": return "bg-[#F3E8FF] text-[#7E22CE] border-[#E9D5FF]";
      case "closed": return "bg-slate-100 text-slate-700 border-slate-300";
      default: return "bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]";
    }
  };

  const formatStatus = (status = "") => {
    return status.replace(/_/g, " ").toUpperCase();
  };

  // Multi-attribute search filter across Case ID, Title, Location, Officer, Description
  const filteredCases = cases.filter(c => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      !query ||
      c.id.toString().includes(query) ||
      (c.title && c.title.toLowerCase().includes(query)) ||
      (c.location && c.location.toLowerCase().includes(query)) ||
      (c.assigned_officer_name && c.assigned_officer_name.toLowerCase().includes(query)) ||
      (c.description && c.description.toLowerCase().includes(query));

    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 font-sans select-none pb-12">
      
      {/* Header Panel */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#111827]">Case Investigation Dossier Directory</h1>
          <p className="text-xs text-[#6B7280] mt-1">Manage active investigation files, accept/decline case assignments, and track legal evidence timelines.</p>
        </div>
        
        <button
          onClick={loadCases}
          disabled={loading}
          className="p-3 bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] text-[#4B5563] rounded-xl hover:text-[#111827] transition-all cursor-pointer shadow-sm"
        >
          <RefreshCw className={`h-4.5 w-4.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Filters & Search Control Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-sm">
        
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#9CA3AF]">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search by Case ID (#101), Title, Officer Name, Jurisdiction..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full saas-input pl-9 pr-4 py-2 text-xs"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="saas-input px-3.5 py-2 text-xs font-semibold cursor-pointer"
        >
          <option value="all">All Case Statuses ({cases.length})</option>
          <option value="draft">Drafts Only</option>
          <option value="assigned">Pending Officer Acceptance</option>
          <option value="accepted">Accepted / In Progress</option>
          <option value="rejected_by_officer">Declined by Officer</option>
          <option value="under_investigation">Under Active Investigation</option>
          <option value="fir_generated">FIR Generated</option>
          <option value="closed">Closed Files</option>
        </select>

      </div>

      {/* Cases List Grid */}
      {loading ? (
        <div className="text-center py-16 text-xs font-semibold text-[#6B7280] animate-pulse">QUERYING CASE DIRECTORY...</div>
      ) : filteredCases.length === 0 ? (
        <div className="bg-white p-16 rounded-2xl border border-[#E2E8F0] text-center text-xs text-[#6B7280] italic">
          No investigation dossier matching search filter criteria.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCases.map((c) => {
            const isAssignedToMe = c.assigned_officer_name && c.assigned_officer_name.toLowerCase().includes(currentUsername.toLowerCase());
            const needsAction = isAssignedToMe && (c.status === "assigned" || c.assignment_status === "pending");

            return (
              <div 
                key={c.id}
                onClick={() => navigate(`/fir-generator?caseId=${c.id}`)}
                className={`bg-white rounded-2xl border shadow-sm p-6 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between min-h-[260px] ${
                  needsAction ? 'border-[#F59E0B] ring-2 ring-[#FDE68A]' : 'border-[#E2E8F0]'
                }`}
              >
                <div className="space-y-3">
                  
                  {/* ID & Status */}
                  <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2">
                    <span className="text-[10px] font-mono font-bold text-[#6B7280]">CASE ID: #{c.id}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase ${getStatusStyle(c.status)}`}>
                      {formatStatus(c.status)}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-bold text-[#111827] line-clamp-1">{c.title}</h3>

                  {/* Metadata */}
                  <div className="space-y-1.5 text-[10px] text-[#6B7280] font-medium">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-[#9CA3AF]" />
                      <span>Occurred: {c.date || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-[#9CA3AF]" />
                      <span className="truncate">Area: {c.location || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#1E293B]">
                      <User className="h-3.5 w-3.5 text-[#2563EB]" />
                      <span>Officer: {c.assigned_officer_name || "Unassigned"}</span>
                    </div>
                  </div>

                  {/* Decline Reason Banner if rejected */}
                  {c.status === "rejected_by_officer" && c.decline_reason && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[10px]">
                      <span className="font-bold block">Declined Reason:</span>
                      <span>{c.decline_reason}</span>
                    </div>
                  )}

                  {/* Accept / Decline Action Banner for assigned officer */}
                  {needsAction && (
                    <div className="p-3 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] space-y-2">
                      <span className="text-[10px] font-bold text-[#92400E] flex items-center gap-1">
                        <ShieldAlert className="h-3.5 w-3.5 text-[#D97706]" />
                        <span>Action Required: Case Assigned to You</span>
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => handleAccept(e, c.id)}
                          className="flex-1 py-1.5 rounded-lg bg-[#10B981] hover:bg-[#059669] text-white font-bold text-[10px] cursor-pointer shadow-xs flex items-center justify-center gap-1"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Accept Case</span>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeclineModalCaseId(c.id); }}
                          className="flex-1 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] cursor-pointer shadow-xs flex items-center justify-center gap-1"
                        >
                          <XCircle className="h-3 w-3" />
                          <span>Decline Case</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Admin Re-assign Dropdown */}
                  {role === "admin" && (
                    <div className="pt-2" onClick={(e) => e.stopPropagation()}>
                      <label className="block text-[9px] font-mono font-bold uppercase text-[#64748B] mb-1">Re-assign Officer</label>
                      <select
                        onChange={(e) => handleAssign(e, c.id, e.target.value)}
                        defaultValue={c.assigned_to || ""}
                        className="w-full saas-input px-2 py-1 text-[10px] font-semibold cursor-pointer"
                      >
                        <option value="" disabled>Select Officer...</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>@{u.username} ({u.badge_number || 'Officer'})</option>
                        ))}
                      </select>
                    </div>
                  )}

                </div>

                {/* Footer Action buttons */}
                <div className="flex justify-between items-center border-t border-[#F1F5F9] pt-4 mt-4">
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/evidence?caseId=${c.id}`); }}
                      className="p-2 bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#4B5563] rounded-lg border border-[#E2E8F0] hover:text-[#111827]"
                      title="Evidence Files checklist"
                    >
                      <ClipboardList className="h-3.5 w-3.5" />
                    </button>
                    {c.analysis_output && (
                      <button
                        onClick={(e) => { e.stopPropagation(); api.downloadPDF(c.id); }}
                        className="p-2 bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#EF4444] rounded-lg border border-red-100"
                        title="Download PDF report"
                      >
                        <FileDown className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/fir-generator?caseId=${c.id}`); }}
                      className="flex items-center gap-1 text-[11px] font-bold text-[#2563EB] hover:underline px-2 py-1"
                    >
                      <Edit3 className="h-3 w-3" />
                      <span>Open Dossier</span>
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, c.id)}
                      className="p-2 text-[#EF4444] hover:bg-[#FEF2F2] rounded-lg"
                      title="Delete case log"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Decline Reason Modal */}
      {declineModalCaseId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full space-y-4 shadow-xl border border-[#E2E8F0]">
            <h3 className="text-sm font-bold text-[#111827]">Decline Case Investigation</h3>
            <p className="text-xs text-[#6B7280]">Please state your official reason for declining case assignment #{declineModalCaseId}.</p>
            
            <form onSubmit={handleDeclineSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-[#475569] mb-1">REASON CATEGORY</label>
                <select
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  className="w-full saas-input px-3.5 py-2.5 cursor-pointer"
                >
                  <option value="Already handling maximum cases">Already handling maximum active cases</option>
                  <option value="On approved official leave">On approved official leave</option>
                  <option value="Conflict of interest">Conflict of interest</option>
                  <option value="Outside precinct jurisdiction">Outside precinct jurisdiction</option>
                  <option value="Other">Other Reason...</option>
                </select>
              </div>

              {declineReason === "Other" && (
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-[#475569] mb-1">SPECIFY REASON</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Enter specific justification..."
                    value={customDeclineReason}
                    onChange={(e) => setCustomDeclineReason(e.target.value)}
                    className="w-full saas-input px-3.5 py-2.5 resize-none"
                  />
                </div>
              )}

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setDeclineModalCaseId(null)}
                  className="px-4 py-2 rounded-xl border border-[#CBD5E1] text-[#475569] font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl font-semibold cursor-pointer">
                  Submit Decline Notification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
