import React, { useState, useEffect } from "react";
import { Search, BookOpen, Shuffle, Copy, Check, ArrowRight, Sparkles, Filter } from "lucide-react";
import { api } from "../utils/api";
import LegalBadge from "../components/ui/LegalBadge";
import AITrustBanner from "../components/ui/AITrustBanner";

export default function LegalSearch() {
  const [activeTab, setActiveTab] = useState("search"); // search, mapping
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [actFilter, setActFilter] = useState("ALL");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Converter state
  const [mappingQuery, setMappingQuery] = useState("");
  const [mappingResults, setMappingResults] = useState([]);
  const [mappingLoading, setMappingLoading] = useState(false);

  const [expandedId, setExpandedId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

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
      const results = await api.searchLaws(searchQuery || "theft fraud cyber evidence");
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

  const handleCopyCitation = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredResults = actFilter === "ALL" 
    ? searchResults 
    : searchResults.filter(r => (r.act || "").toUpperCase().includes(actFilter));

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-700 block mb-0.5">Statutory Intelligence Database</span>
          <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">Legal Search &amp; Code Converter</h1>
          <p className="text-xs text-slate-500">Perform statutory queries across BNS 2023, BNSS 2023, BSA 2023, IT Act 2000, and legacy IPC 1860.</p>
        </div>
      </div>

      <AITrustBanner 
        title="Official Central Legal Code Index"
        message="Statutory provisions and IPC to BNS cross-references are decision-support tools for investigators. Verification against current official law gazettes is recommended."
      />

      {/* Tabs Switcher */}
      <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveTab("search")}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === "search" ? 'bg-blue-50 text-blue-800 border border-blue-200/80 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Search className="h-3.5 w-3.5" />
          <span>Statutory Search Engine</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("mapping")}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === "mapping" ? 'bg-blue-50 text-blue-800 border border-blue-200/80 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Shuffle className="h-3.5 w-3.5" />
          <span>IPC 1860 to BNS 2023 Code Converter</span>
        </button>
      </div>

      {activeTab === "search" && (
        <div className="space-y-4">
          
          {/* Search Bar + Act Filters */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search keywords, e.g. 'petty theft', 'digital evidence', 'e-FIR', 'BNS Section 303'..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full enterprise-input pl-8 py-2 text-xs"
                />
              </div>
              <button type="submit" className="btn-primary text-xs shrink-0">
                <span>Search Provisions</span>
              </button>
            </form>

            {/* Act Filter Pills */}
            <div className="flex items-center gap-1.5 text-xs">
              <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="text-slate-500 font-medium text-[11px]">Filter Act:</span>
              {["ALL", "BNS", "BNSS", "BSA", "IPC", "IT"].map(act => (
                <button
                  key={act}
                  type="button"
                  onClick={() => setActFilter(act)}
                  className={`px-2 py-0.5 rounded text-[10.5px] font-mono font-bold transition-all cursor-pointer ${
                    actFilter === act ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {act}
                </button>
              ))}
            </div>
          </div>

          {/* Results Grid */}
          {searchLoading ? (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-xl font-mono text-xs text-slate-400 animate-pulse">
              QUERYING CENTRAL STATUTORY REGISTER...
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-xl text-xs text-slate-400 italic">
              No matching legal provisions found for selected filters.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {filteredResults.map(law => {
                const isExpanded = expandedId === law.id;
                return (
                  <div
                    key={law.id}
                    className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-3 hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <LegalBadge
                        act={law.act || "BNS"}
                        section={law.section_reference || law.section}
                      />
                      <button
                        type="button"
                        onClick={() => handleCopyCitation(`${law.act} ${law.section_reference || law.section}: ${law.title}`, law.id)}
                        className="text-[10px] font-mono font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedId === law.id ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                        <span>{copiedId === law.id ? 'COPIED' : 'COPY CITE'}</span>
                      </button>
                    </div>

                    <div>
                      <h3 className="text-xs font-bold text-slate-900">{law.title}</h3>
                      <p className={`text-[11.5px] text-slate-600 leading-relaxed mt-1 ${isExpanded ? '' : 'line-clamp-3'}`}>
                        {law.description}
                      </p>
                    </div>

                    {isExpanded && (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 text-xs">
                        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">Investigation Scope &amp; Penalties</span>
                        <p className="text-[11px] text-slate-700 leading-relaxed">
                          Imprisonment or fine as mandated under central law gazette provisions. Officer verification required prior to court filing.
                        </p>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : law.id)}
                      className="text-[10.5px] font-bold text-blue-700 hover:underline block cursor-pointer"
                    >
                      {isExpanded ? 'Hide Details' : 'View Full Provision &amp; Scope &rarr;'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {activeTab === "mapping" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <form onSubmit={e => { e.preventDefault(); loadMappings(); }} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter legacy IPC Section (e.g. 'IPC 378', 'IPC 420', 'CrPC 154')..."
                value={mappingQuery}
                onChange={e => setMappingQuery(e.target.value)}
                className="flex-1 enterprise-input py-2 text-xs"
              />
              <button type="submit" className="btn-primary text-xs shrink-0">
                <span>Convert Code</span>
              </button>
            </form>
          </div>

          {mappingLoading ? (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-xl font-mono text-xs text-slate-400 animate-pulse">
              CONVERTING LEGACY CODES TO BNS 2023...
            </div>
          ) : mappingResults.length === 0 ? (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-xl text-xs text-slate-400 italic">
              No code conversions matched query.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {mappingResults.map(m => (
                <div key={m.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-3">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 font-bold rounded">
                      LEGACY: {m.old_act} {m.old_section}
                    </span>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 font-bold rounded">
                      REFORMED: {m.new_act} {m.new_section}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{m.title}</h3>
                    <p className="text-[11.5px] text-slate-600 mt-1 leading-relaxed">{m.notes}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
