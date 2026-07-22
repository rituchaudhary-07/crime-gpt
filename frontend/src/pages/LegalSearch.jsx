import React, { useState, useEffect } from "react";
import { Search, BookOpen, Shuffle, AlertCircle, RefreshCw, ChevronRight, HelpCircle } from "lucide-react";
import { api } from "../utils/api";

export default function LegalSearch() {
  const [activeTab, setActiveTab] = useState("search"); // search, mapping
  
  // Search inputs
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Converter inputs
  const [mappingQuery, setMappingQuery] = useState("");
  const [mappingResults, setMappingResults] = useState([]);
  const [mappingLoading, setMappingLoading] = useState(false);

  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (activeTab === "mapping") {
      loadMappings();
    } else {
      handleSearch();
    }
  }, [activeTab]);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setSearchLoading(true);
    try {
      const results = await api.searchLaws(searchQuery || "theft fraud");
      setSearchResults(results);
    } catch (err) {
      console.log("Search failed:", err);
    } finally {
      setSearchLoading(false);
    }
  };

  const loadMappings = async () => {
    setMappingLoading(true);
    try {
      const data = await api.getLegalMapping(mappingQuery);
      setMappingResults(data);
    } catch (err) {
      console.log("Mappings failed:", err);
    } finally {
      setMappingLoading(false);
    }
  };

  const handleMappingSearch = (e) => {
    if (e) e.preventDefault();
    loadMappings();
  };

  // Helper to extract mock related punishments
  const getMockPunishment = (section) => {
    const s = section.toLowerCase();
    if (s.includes("303")) return "Imprisonment up to 3 years, or fine, or both. Community service for first-time petty theft.";
    if (s.includes("305")) return "Rigorous imprisonment up to 7 years and liability to fine.";
    if (s.includes("318")) return "Imprisonment up to 7 years, or fine, or both.";
    if (s.includes("329") || s.includes("331")) return "Rigorous imprisonment up to 10 years and liability to fine.";
    if (s.includes("115")) return "Imprisonment up to 1 year, or fine up to 10,000 INR, or both.";
    if (s.includes("117")) return "Imprisonment up to 7 years, or fine, or both.";
    return "Imprisonment or fine as detailed under central court provisions.";
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-sans select-none">
      
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[#111827]">Reformed Law Database Search</h1>
        <p className="text-xs text-[#6B7280] mt-1">
          Perform queries across BNS (Bharatiya Nyaya Sanhita), BNSS (Bharatiya Nagarik Suraksha Sanhita), and BSA (Bharatiya Sakshya Adhiniyam).
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E2E8F0] shrink-0 bg-white rounded-2xl p-1 border shadow-sm">
        <button
          onClick={() => setActiveTab("search")}
          className={`flex-1 py-3 text-xs font-bold transition-all rounded-xl cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === "search" 
              ? "bg-[#EFF6FF] text-[#2563EB]" 
              : "text-[#6B7280] hover:text-[#111827]"
          }`}
        >
          <Search className="h-4 w-4" />
          <span>Semantic Law Finder</span>
        </button>
        <button
          onClick={() => setActiveTab("mapping")}
          className={`flex-1 py-3 text-xs font-bold transition-all rounded-xl cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === "mapping" 
              ? "bg-[#EFF6FF] text-[#2563EB]" 
              : "text-[#6B7280] hover:text-[#111827]"
          }`}
        >
          <Shuffle className="h-4 w-4" />
          <span>IPC / CrPC Code Converter</span>
        </button>
      </div>

      {/* Search Content */}
      {activeTab === "search" && (
        <div className="space-y-6 animate-slide-up">
          <form onSubmit={handleSearch} className="flex gap-3 bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-sm">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#9CA3AF]">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Search by keywords, e.g. 'petty theft' or 'digital evidence'..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full saas-input pl-9 pr-4 py-2.5"
              />
            </div>
            <button
              type="submit"
              className="btn-primary px-6 text-xs font-bold cursor-pointer"
            >
              Search Index
            </button>
          </form>

          {searchLoading ? (
            <div className="text-center py-16 text-xs text-[#6B7280] font-mono animate-pulse">QUERYING CENTRAL REGISTER...</div>
          ) : searchResults.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-[#E2E8F0] text-center text-xs text-[#6B7280] italic">
              No matching legal provisions found.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {searchResults.map((law) => {
                const isExpanded = expandedId === law.id;
                return (
                  <div 
                    key={law.id}
                    className={`bg-white p-6 rounded-2xl border transition-all duration-200 flex flex-col justify-between shadow-sm hover:shadow-md ${
                      isExpanded ? "border-[#2563EB] ring-2 ring-blue-50" : "border-[#E2E8F0]"
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2">
                        <span className="px-2 py-0.5 rounded bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] font-bold font-mono text-[10px]">
                          {law.act} {law.section}
                        </span>
                        <span className="text-[10px] text-[#6B7280] font-mono uppercase">CRIMINAL CODE</span>
                      </div>
                      
                      <h3 className="text-sm font-bold text-[#111827]">{law.title}</h3>
                      
                      <p className={`text-xs text-[#4B5563] leading-relaxed font-sans ${isExpanded ? "" : "line-clamp-3"}`}>
                        {law.description}
                      </p>

                      {isExpanded && (
                        <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-2 mt-2 animate-slide-up">
                          <div>
                            <span className="text-[9px] font-bold text-[#6B7280] font-mono uppercase block">Recommended Punishment:</span>
                            <span className="text-[11px] font-semibold text-[#111827]">{getMockPunishment(law.section)}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-[#6B7280] font-mono uppercase block">Jurisdiction Scope:</span>
                            <span className="text-[11px] text-[#4B5563] font-medium leading-normal block">
                              Applicable for investigations within precinct boundaries. Checked under secure compliance guides.
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : law.id)}
                      className="mt-4 text-[10px] text-[#2563EB] hover:underline font-bold font-mono text-left cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      <span>{isExpanded ? "COLLAPSE EXPLANATION" : "EXPAND PUNISHMENTS & DETAILS"}</span>
                      <ChevronRight className={`h-3 w-3 transform transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Converter Content */}
      {activeTab === "mapping" && (
        <div className="space-y-6 animate-slide-up">
          <form onSubmit={handleMappingSearch} className="flex gap-3 bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-sm">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#9CA3AF]">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Enter old section (e.g. 'IPC 378' or 'IPC 420' or 'IEA 65B')..."
                value={mappingQuery}
                onChange={(e) => setMappingQuery(e.target.value)}
                className="w-full saas-input pl-9 pr-4 py-2.5"
              />
            </div>
            <button
              type="submit"
              className="btn-primary px-6 text-xs font-bold cursor-pointer"
            >
              Lookup Converter
            </button>
          </form>

          {mappingLoading ? (
            <div className="text-center py-16 text-xs text-[#6B7280] font-mono animate-pulse">QUERYING CONVERSION DATABASE...</div>
          ) : mappingResults.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-[#E2E8F0] text-center text-xs text-[#6B7280] italic">
              No matching conversions recorded in local index.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] font-mono text-[9px] text-[#6B7280] tracking-widest uppercase">
                    <th className="p-4 w-32">OLD PROVISION</th>
                    <th className="p-4 w-44">LEGACY PROVISION TITLE</th>
                    <th className="p-4 w-36">REFORMED CODE</th>
                    <th className="p-4 w-48">REFORMED CODE TITLE</th>
                    <th className="p-4">LEGAL BRIEF SUMMARY</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9] text-[#374151] font-sans">
                  {mappingResults.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="p-4 font-mono font-bold text-[#6B7280]">{item.old_act} {item.old_section}</td>
                      <td className="p-4 font-semibold text-[#111827]">{item.old_title}</td>
                      <td className="p-4 font-mono font-bold text-[#2563EB]">{item.new_act} {item.new_section}</td>
                      <td className="p-4 font-bold text-[#111827]">{item.new_title}</td>
                      <td className="p-4 text-[11px] text-[#6B7280] leading-normal">{item.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
