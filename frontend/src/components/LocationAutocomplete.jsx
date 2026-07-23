import React, { useState, useRef, useEffect } from "react";
import { MapPin, Building2, Search } from "lucide-react";
import { api } from "../utils/api";

const FALLBACK_INDIAN_LOCATIONS = [
  "Cyber Crime Police Station Bandra-Kurla Complex, Mumbai, Maharashtra",
  "Andheri West Police Station, Mumbai Suburban, Maharashtra",
  "Special Cell Cyber Crime Unit Dwarka, New Delhi, Delhi",
  "Connaught Place Police Station, Central Delhi, Delhi",
  "Cyber Crime Police Station CID HQ, Bengaluru Urban, Karnataka",
  "Whitefield Police Station, Bengaluru Urban, Karnataka",
  "Cyber Crime Police Station Cyberabad, Hyderabad, Telangana",
  "Cyber Crime Police Station Mithakhali, Ahmedabad, Gujarat",
  "Cyber Crime Police Station Surat HQ, Surat, Gujarat",
  "Cyber Crime Police Station Vepery HQ, Chennai, Tamil Nadu",
  "Cyber Crime Police Station Lalbazar HQ, Kolkata, West Bengal",
  "Cyber Crime Police Station Shivajinagar, Pune, Maharashtra",
  "Central Cyber Police Station, Sector 4, HQ"
];

export default function LocationAutocomplete({ 
  value = "", 
  onChange, 
  placeholder = "e.g. Cyber Crime Police Station BKC, Mumbai",
  className = ""
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const res = await api.locationAutocomplete(value);
        if (res && res.suggestions && res.suggestions.length > 0) {
          const formatted = res.suggestions.map(s => 
            typeof s === 'string' ? s : `${s.station}, ${s.city}, ${s.state}`
          );
          setSuggestions(formatted);
        } else {
          setSuggestions(FALLBACK_INDIAN_LOCATIONS.filter(l => l.toLowerCase().includes(value.toLowerCase())));
        }
      } catch (err) {
        setSuggestions(FALLBACK_INDIAN_LOCATIONS.filter(l => l.toLowerCase().includes(value.toLowerCase())));
      }
    };

    fetchSuggestions();
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (selectedLoc) => {
    onChange(selectedLoc);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative flex items-center">
        <span className="absolute left-3 text-slate-400 pointer-events-none">
          <MapPin className="h-4 w-4 text-blue-600" />
        </span>
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={`w-full saas-input pl-9 pr-4 py-2.5 ${className}`}
        />
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto text-xs divide-y divide-slate-100 animate-fade-in">
          <div className="px-3 py-1.5 bg-slate-50 text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Jurisdiction Suggestions ({suggestions.length})</span>
            <span className="text-blue-600 font-sans">Official Police Network</span>
          </div>
          {suggestions.map((loc, idx) => (
            <div
              key={idx}
              onClick={() => handleSelect(loc)}
              className="px-3.5 py-2.5 hover:bg-blue-50 hover:text-blue-600 cursor-pointer flex items-center gap-2.5 font-medium text-slate-700 transition-colors"
            >
              <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{loc}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

