import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Briefcase, Search, FileDown, Eye, Edit3, 
  Trash2, ClipboardList, RefreshCw, AlertCircle, Calendar, MapPin, User,
  CheckCircle2, XCircle, UserCheck, ShieldAlert, Archive, RotateCcw, Clock, Layers
} from "lucide-react";
import { api } from "../utils/api";

export default function CaseManagement() {
  const navigate = useNavigate();
  const role = api.getUserRole();
  const currentUsername = api.getUsername();

  const [activeTab, setActiveTab] = useState("active"); // active, archive
  const [cases, setCases] = useState([]);
  const [archivedCases, setArchivedCases] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const loadInProgressRef = useRef(false);

  // Decline Modal State
  const [declineModalCaseId, setDeclineModalCaseId] = useState(null);
  const [declineReason, setDeclineReason] = useState("Already handling maximum cases");
  const [customDeclineReason, setCustomDeclineReason] = useState("");

  // Timeline Modal State
  const [timelineCase, setTimelineCase] = useState(null);

  useEffect(() => {
    loadCases();
    if (role === "admin") {
      api.getUsers().then(setUsers).catch(() => {});
    }
  }, []);

  const loadCases = async () => {
    if (loadInProgressRef.current) return;
    loadInProgressRef.current = true;
    setLoading(true);
    setError("");
    try {
      const [activeData, archiveData] = await Promise.all([
        api.getCases(),
        api.getArchivedCases()
      ]);
      setCases(activeData.filter(c => c.status !== "archived" && c.status !== "closed"));
      setArchivedCases(archiveData);
    } catch (err) {
      console.error("Case directory load failed:", err);
      if (err.status === 401) {
        setError("Your session has expired. Please sign in again.");
      } else if (err.status === 403) {
        setError("You do not have permission to view these case files.");
      } else if (err.code === "network_or_cors" || err.code === "timeout") {
        setError("Unable to connect to the case management service.");
      } else {
        setError(err.message || "Unable to load case files.");
      }
    } finally {
      setLoading(false);
      loadInProgressRef.current = false;
    }
  };

  const handleAccept = async (e, caseId) => {
    e.stopPropagation();
    setActionSuccess("");
    setError("");
    try {
      await api.respondCaseAssignment(caseId, "accept");
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
      await api.respondCaseAssignment(declineModalCaseId, "reject", finalReason);
      setActionSuccess(`Case ID #${declineModalCaseId} investigation REJECTED.`);
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

  const handleStatusChange = async (e, caseId, newStatus) => {
    e.stopPropagation();
    setActionSuccess("");
    setError("");
    try {
      await api.updateCaseStatus(caseId, newStatus);
      setActionSuccess(`Case ID #${caseId} status updated to ${newStatus.toUpperCase()}.`);
      loadCases();
    } catch (err) {
      setError("Status update failed: " + err.message);
    }
  };

  const handleRestore = async (e, caseId) => {
    e.stopPropagation();
    setActionSuccess("");
    setError("");
    try {
      await api.restoreCase(caseId);
      setActionSuccess(`Case ID #${caseId} restored from archive to active investigation.`);
      loadCases();
    } catch (err) {
      setError("Restore failed: " + err.message);
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
      case "draft": return "bg-slate-100 text-slate-700 border-slate-300";
      case "pending_approval": return "bg-amber-50 text-amber-800 border-amber-200";
      case "assigned": return "bg-amber-100 text-amber-900 border-amber-300";
      case "accepted": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "rejected_by_officer": return "bg-rose-50 text-rose-700 border-rose-200";
      case "under_investigation": return "bg-blue-50 text-blue-700 border-blue-200";
      case "evidence_collection": return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "fir_draft_ready": return "bg-purple-50 text-purple-700 border-purple-200";
      case "submitted": return "bg-teal-50 text-teal-700 border-teal-200";
      case "closed": return "bg-slate-200 text-slate-800 border-slate-400";
      case "archived": return "bg-slate-900 text-slate-200 border-slate-700";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const formatStatus = (status = "") => {
    return status.replace(/_/g, " ").toUpperCase();
  };

  const currentList = activeTab === "active" ? cases : archivedCases;
  const availableStatuses = [...new Set(currentList.map(c => c.status).filter(Boolean))].sort();

  const filteredCases = currentList.filter(c => {
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Case Investigation Dossier Directory</h1>
          <p className="text-xs text-slate-500 mt-1">Manage active investigation files, accept/decline case assignments, and track legal evidence timelines.</p>
        </div>
        
        <button
          onClick={loadCases}
          disabled={loading}
          className="p-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl hover:text-slate-900 transition-all cursor-pointer shadow-xs self-start"
        >
          <RefreshCw className={`h-4.5 w-4.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("active")}
          className={`pb-3 flex items-center gap-2 cursor-pointer transition-all ${
            activeTab === "active" ? "border-b-2 border-blue-600 text-blue-600 font-bold" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <Briefcase className="h-4 w-4" />
          <span>Active Investigation Files ({cases.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("archive")}
          className={`pb-3 flex items-center gap-2 cursor-pointer transition-all ${
            activeTab === "archive" ? "border-b-2 border-blue-600 text-blue-600 font-bold" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <Archive className="h-4 w-4 text-slate-600" />
          <span>Case Archive ({archivedCases.length})</span>
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
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
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
          <option value="all">All Case Statuses ({currentList.length})</option>
          {availableStatuses.map(status => <option key={status} value={status}>{formatStatus(status)}</option>)}
        </select>

      </div>

      {/* Cases List Grid */}
      {loading ? (
        <div className="text-center py-16 text-xs font-semibold text-slate-500 animate-pulse">QUERYING CASE DIRECTORY...</div>
      ) : filteredCases.length === 0 ? (
        <div className="bg-white p-16 rounded-2xl border border-slate-200 text-center text-xs text-slate-500 italic">
          {searchQuery || statusFilter !== "all"
            ? "No investigation dossier matches the current search or status filter."
            : activeTab === "archive" ? "No archived investigation files." : "No investigation files found."}
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
                className={`bg-white rounded-2xl border shadow-xs p-6 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between min-h-[300px] ${
                  needsAction ? 'border-amber-400 ring-2 ring-amber-200' : 'border-slate-200'
                }`}
              >
                <div className="space-y-3">
                  
                  {/* ID & Status */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-[10px] font-mono font-bold text-slate-500">CASE ID: #{c.id}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase ${getStatusStyle(c.status)}`}>
                      {formatStatus(c.status)}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{c.title}</h3>

                  {/* Metadata */}
                  <div className="space-y-1.5 text-[10px] text-slate-500 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>Occurred: {c.date || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span className="truncate">Area: {c.location || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-800">
                      <User className="h-3.5 w-3.5 text-blue-600" />
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
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                      <span className="text-[10px] font-bold text-amber-900 flex items-center gap-1">
                        <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                        <span>Action Required: Case Assigned to You</span>
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => handleAccept(e, c.id)}
                          className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] cursor-pointer shadow-xs flex items-center justify-center gap-1"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Accept Case</span>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeclineModalCaseId(c.id); }}
                          className="flex-1 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] cursor-pointer shadow-xs flex items-center justify-center gap-1"
                        >
                          <XCircle className="h-3 w-3" />
                          <span>Decline</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Official Workflow Status Change Selector */}
                  <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                    <label className="block text-[9px] font-mono font-bold uppercase text-slate-500 mb-1">
                      Update Case Status Stage
                    </label>
                    <select
                      value={c.status}
                      onChange={(e) => handleStatusChange(e, c.id, e.target.value)}
                      className="w-full saas-input px-2 py-1 text-[10px] font-semibold cursor-pointer bg-slate-50 border-slate-200"
                    >
                      <option value="draft">Draft</option>
                      <option value="pending_approval">Pending Approval</option>
                      <option value="assigned">Assigned</option>
                      <option value="accepted">Accepted</option>
                      <option value="rejected_by_officer">Rejected by Officer</option>
                      <option value="under_investigation">Under Investigation</option>
                      <option value="evidence_collection">Evidence Collection</option>
                      <option value="fir_draft_ready">FIR Draft Ready</option>
                      <option value="submitted">Submitted</option>
                      <option value="closed">Closed (Move to Archive)</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>

                  {/* Admin Re-assign Dropdown */}
                  {role === "admin" && (
                    <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                      <label className="block text-[9px] font-mono font-bold uppercase text-slate-500 mb-1">Re-assign Officer</label>
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

                {/* Footer Actions */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-4">
                  <div className="flex items-center gap-1.5">
                    {activeTab === "archive" ? (
                      <button
                        onClick={(e) => handleRestore(e, c.id)}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>Restore Case</span>
                      </button>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); api.downloadPDF(c.id); }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <FileDown className="h-3 w-3" />
                        <span>PDF Report</span>
                      </button>
                    )}

                    <button
                      onClick={(e) => { e.stopPropagation(); setTimelineCase(c); }}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Clock className="h-3 w-3" />
                      <span>Timeline</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/fir-generator?caseId=${c.id}`); }}
                      className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg cursor-pointer"
                      title="Open FIR Generator"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    {role === "admin" && (
                      <button
                        onClick={(e) => handleDelete(e, c.id)}
                        className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg cursor-pointer"
                        title="Delete Case"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Decline Reason Modal */}
      {declineModalCaseId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Decline Case Investigation</h3>
            <p className="text-xs text-slate-500">Please select your official reason for declining case assignment #{declineModalCaseId}.</p>
            
            <form onSubmit={handleDeclineSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-600 mb-1">REASON CATEGORY</label>
                <select
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  className="w-full saas-input px-3.5 py-2.5 cursor-pointer font-medium"
                >
                  <option value="Already handling maximum cases">Already handling maximum cases</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Conflict of Interest">Conflict of Interest</option>
                  <option value="Wrong Jurisdiction">Wrong Jurisdiction</option>
                  <option value="Other">Other...</option>
                </select>
              </div>

              {declineReason === "Other" && (
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-600 mb-1">SPECIFY REASON</label>
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
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-semibold cursor-pointer hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl font-bold cursor-pointer">
                  Submit Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Case Investigation Timeline Modal */}
      {timelineCase && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white p-6 rounded-2xl max-w-lg w-full space-y-5 shadow-2xl border border-slate-200">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-blue-600 uppercase">OFFICIAL INVESTIGATION AUDIT TIMELINE</span>
                <h3 className="text-sm font-extrabold text-slate-900">{timelineCase.title} (Case #{timelineCase.id})</h3>
              </div>
              <button
                onClick={() => setTimelineCase(null)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="relative border-l-2 border-blue-600 pl-4 space-y-4">
                <div className="relative">
                  <div className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-blue-600" />
                  <span className="text-[10px] font-mono font-bold text-slate-400 block">{new Date(timelineCase.created_at).toLocaleString()}</span>
                  <span className="font-bold text-slate-900 block">Case Intaken & Drafted</span>
                  <p className="text-slate-500 text-[11px]">Registered by Officer ID: {timelineCase.created_by}</p>
                </div>

                <div className="relative">
                  <div className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-mono font-bold text-slate-400 block">Assignment Stage</span>
                  <span className="font-bold text-slate-900 block">Officer Assigned: {timelineCase.assigned_officer_name || "Unassigned"}</span>
                  <p className="text-slate-500 text-[11px]">Assignment Status: {timelineCase.assignment_status.toUpperCase()}</p>
                </div>

                <div className="relative">
                  <div className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-purple-500" />
                  <span className="text-[10px] font-mono font-bold text-slate-400 block">Current Workflow Phase</span>
                  <span className="font-bold text-slate-900 block">Status: {formatStatus(timelineCase.status)}</span>
                  <p className="text-slate-500 text-[11px]">Station: {timelineCase.station}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setTimelineCase(null)}
                className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 cursor-pointer"
              >
                Close Timeline
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
