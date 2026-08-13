import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Briefcase, Search, FileDown, Eye, Edit3, 
  Trash2, ClipboardList, RefreshCw, Calendar, MapPin, User,
  CheckCircle2, XCircle, UserCheck, ShieldAlert, Archive, RotateCcw, Clock, Plus
} from "lucide-react";
import { api } from "../utils/api";
import DataTable from "../components/ui/DataTable";
import StatusBadge from "../components/ui/StatusBadge";
import AITrustBanner from "../components/ui/AITrustBanner";

export default function CaseManagement() {
  const navigate = useNavigate();
  const role = api.getUserRole();

  const [activeTab, setActiveTab] = useState("active"); // active, archive
  const [cases, setCases] = useState([]);
  const [archivedCases, setArchivedCases] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const loadInProgressRef = useRef(false);

  // Decline Modal State
  const [declineModalCaseId, setDeclineModalCaseId] = useState(null);
  const [declineReason, setDeclineReason] = useState("Already handling maximum cases");
  const [customDeclineReason, setCustomDeclineReason] = useState("");

  // Timeline / Dossier Modal State
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
      const activePromise = api.getCases().catch(err => {
        console.error("[CaseManagement] Failed to fetch active cases", err);
        return [];
      });
      const archivePromise = api.getArchivedCases().catch(err => {
        console.error("[CaseManagement] Failed to fetch archived cases", err);
        return [];
      });

      const [activeData, archiveData] = await Promise.all([activePromise, archivePromise]);
      setCases(activeData.filter(c => c.status !== "archived" && c.status !== "closed"));
      setArchivedCases(archiveData);
    } catch (err) {
      console.error("[CaseManagement] Case directory load failed:", err);
      setError(err.message || "Unable to load case files.");
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

  const rawList = activeTab === "active" ? cases : archivedCases;
  const filteredList = statusFilter === "all" ? rawList : rawList.filter(c => c.status === statusFilter);

  const columns = [
    {
      header: "CASE ID",
      key: "id",
      render: (row) => (
        <span className="font-mono font-bold text-blue-700 text-[11px]">
          #{row.id}
        </span>
      )
    },
    {
      header: "INVESTIGATION TITLE",
      key: "title",
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block truncate max-w-xs">{row.title}</span>
          <span className="text-[10px] text-slate-500 font-medium block truncate max-w-xs">{row.description}</span>
        </div>
      )
    },
    {
      header: "STATION & LOCATION",
      key: "station",
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-800 text-[11px] block">{row.station || "Central Cyber PS"}</span>
          <span className="text-[10px] text-slate-500">{row.location || "Jurisdiction CCPS"}</span>
        </div>
      )
    },
    {
      header: "ASSIGNED OFFICER",
      key: "assigned_officer_name",
      render: (row) => (
        <span className="text-[11px] font-mono text-slate-700 font-medium">
          {row.assigned_officer_name || "Unassigned"}
        </span>
      )
    },
    {
      header: "STAGE / STATUS",
      key: "status",
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: "DATE",
      key: "created_at",
      render: (row) => (
        <span className="font-mono text-[11px] text-slate-500">
          {row.created_at ? new Date(row.created_at).toLocaleDateString() : "N/A"}
        </span>
      )
    },
    {
      header: "ACTIONS",
      key: "actions",
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => navigate(`/fir-generator?caseId=${row.id}`)}
            className="p-1 text-blue-700 hover:bg-blue-50 rounded"
            title="Open FIR Draft Workflow"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          
          {activeTab === "archive" ? (
            <button
              type="button"
              onClick={(e) => handleRestore(e, row.id)}
              className="p-1 text-emerald-700 hover:bg-emerald-50 rounded"
              title="Restore to Active"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => handleStatusChange(e, row.id, "closed")}
              className="p-1 text-slate-600 hover:bg-slate-100 rounded"
              title="Archive Case Dossier"
            >
              <Archive className="h-3.5 w-3.5" />
            </button>
          )}

          {role === "admin" && (
            <button
              type="button"
              onClick={(e) => handleDelete(e, row.id)}
              className="p-1 text-rose-600 hover:bg-rose-50 rounded"
              title="Delete Case Record"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Header Banner & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-700 block mb-0.5">Dossier Directory</span>
          <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">Case Investigation Management</h1>
          <p className="text-xs text-slate-500">Manage active investigation files, officer assignments, and FIR dossiers.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadCases}
            className="btn-secondary text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/new-case")}
            className="btn-primary text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Investigation</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-lg flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess("")} className="text-emerald-600 hover:text-emerald-900 font-bold">✕</button>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-rose-600 hover:text-rose-900 font-bold">✕</button>
        </div>
      )}

      {/* Directory Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        
        {/* Active vs Archive Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={() => { setActiveTab("active"); setStatusFilter("all"); }}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeTab === "active" ? 'bg-white text-blue-700 shadow-2xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Active Files ({cases.length})
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("archive"); setStatusFilter("all"); }}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeTab === "archive" ? 'bg-white text-blue-700 shadow-2xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Case Archive ({archivedCases.length})
          </button>
        </div>

        {/* Status Dropdown Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Filter Stage:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="enterprise-input py-1 text-xs"
          >
            <option value="all">All Stages ({rawList.length})</option>
            <option value="draft">Draft</option>
            <option value="assigned">Assigned</option>
            <option value="under_investigation">Under Investigation</option>
            <option value="fir_draft_ready">FIR Draft Ready</option>
            <option value="closed">Closed / Archived</option>
          </select>
        </div>
      </div>

      {/* High Density Cases Data Table */}
      {loading ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-xl font-mono text-xs text-slate-400 animate-pulse">
          LOADING CASE DOSSIER DIRECTORY...
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredList}
          searchPlaceholder="Search Case ID (#101), Title, Officer Name, Jurisdiction..."
          onRowClick={(row) => setTimelineCase(row)}
          emptyMessage={activeTab === "active" ? "No active investigation files found." : "No archived dossiers recorded."}
        />
      )}

      {/* Case Dossier Preview Modal */}
      {timelineCase && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-blue-700 uppercase">CASE DOSSIER DETAILS</span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">#{timelineCase.id} - {timelineCase.title}</h3>
              </div>
              <button onClick={() => setTimelineCase(null)} className="text-slate-400 hover:text-slate-700 font-bold p-1">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-[10px] font-mono text-slate-500 block">JURISDICTION POLICE STATION</span>
                  <span className="font-bold text-slate-900">{timelineCase.station || "Central Cyber Police Station"}</span>
                </div>
                <StatusBadge status={timelineCase.status} />
              </div>

              <div>
                <span className="font-mono font-bold text-slate-500 text-[10px] uppercase block mb-1">Incident Summary &amp; Description</span>
                <p className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 leading-relaxed">{timelineCase.description}</p>
              </div>

              {timelineCase.evidence && (
                <div>
                  <span className="font-mono font-bold text-slate-500 text-[10px] uppercase block mb-1">Attached Physical Evidence Summary</span>
                  <p className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-slate-800 font-mono text-[11px]">{timelineCase.evidence}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-3">
              <button onClick={() => setTimelineCase(null)} className="btn-secondary text-xs">Close Preview</button>
              <button onClick={() => { setTimelineCase(null); navigate(`/fir-generator?caseId=${timelineCase.id}`); }} className="btn-primary text-xs">Open Legal FIR Workflow &rarr;</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
