import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Briefcase, Search, FileDown, Eye, Edit3, 
  Trash2, ClipboardList, RefreshCw, AlertCircle, Calendar, MapPin, User
} from "lucide-react";
import { api } from "../utils/api";

export default function CaseManagement() {
  const navigate = useNavigate();
  const role = api.getUserRole();

  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadCases();
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
      case "under_review": return "bg-[#F3E8FF] text-[#7E22CE] border-[#E9D5FF]";
      case "filed": return "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]";
      case "investigating": return "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]";
      default: return "bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]";
    }
  };

  const formatStatus = (status) => {
    return status.replace("_", " ").toUpperCase();
  };

  // Filter logic
  const filteredCases = cases.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header Panel */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#111827]">Case Dossier Database</h1>
          <p className="text-xs text-[#6B7280] mt-1">Review active investigation files, print reports, and track compliance checklists.</p>
        </div>
        
        <button
          onClick={loadCases}
          disabled={loading}
          className="p-3 bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] text-[#4B5563] rounded-xl hover:text-[#111827] transition-all cursor-pointer shadow-sm"
        >
          <RefreshCw className={`h-4.5 w-4.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
          <AlertCircle className="h-4.5 w-4.5" />
          <span>{error}</span>
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
            placeholder="Search by case name, keywords or jurisdiction..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full saas-input pl-9 pr-4 py-2"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="saas-input px-3.5 py-2 text-xs font-semibold cursor-pointer"
        >
          <option value="all">All Case Statuses</option>
          <option value="draft">DRAFTS ONLY</option>
          <option value="under_review">UNDER REVIEW</option>
          <option value="filed">FILED / FINALIZED</option>
          <option value="investigating">ACTIVE INVESTIGATIONS</option>
          <option value="closed">CLOSED FILES</option>
        </select>

      </div>

      {/* Cases List */}
      {loading ? (
        <div className="text-center py-16 text-xs font-semibold text-[#6B7280] animate-pulse">QUERYING CASE DIRECTORY...</div>
      ) : filteredCases.length === 0 ? (
        <div className="bg-white p-16 rounded-2xl border border-[#E2E8F0] text-center text-xs text-[#6B7280] italic">
          No case logs match the filters. Try registering a new case wizard above.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCases.map((c) => (
            <div 
              key={c.id}
              onClick={() => navigate(`/fir-generator?caseId=${c.id}`)}
              className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6 hover:shadow-md hover:border-[#CBD5E1] transition-all cursor-pointer flex flex-col justify-between min-h-[220px]"
            >
              <div className="space-y-3">
                
                {/* ID & Status */}
                <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2">
                  <span className="text-[10px] font-mono font-bold text-[#6B7280]">CASE ID: #{c.id}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${getStatusStyle(c.status)}`}>
                    {formatStatus(c.status)}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-sm font-bold text-[#111827] line-clamp-1">{c.title}</h3>

                {/* Metadata */}
                <div className="space-y-1.5 text-[10px] text-[#6B7280] font-medium font-sans">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-[#9CA3AF]" />
                    <span>Occurred: {c.date || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-[#9CA3AF]" />
                    <span className="truncate">Precinct: {c.location || "N/A"}</span>
                  </div>
                </div>

              </div>

              {/* Action items */}
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
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); api.downloadPDF(c.id); }}
                        className="p-2 bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#EF4444] rounded-lg border border-red-100"
                        title="Download PDF report"
                      >
                        <FileDown className="h-3.5 w-3.5" />
                      </button>
                    </>
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
          ))}
        </div>
      )}

    </div>
  );
}
