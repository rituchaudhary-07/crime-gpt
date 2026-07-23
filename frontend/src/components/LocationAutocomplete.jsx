import React, { useState, useRef, useEffect } from "react";
import { MapPin, Search } from "lucide-react";

const INDIAN_LOCATIONS = [
  "Ahmedabad Cyber Cell, Gujarat",
  "Ahmednagar Police Station, Maharashtra",
  "Surat Cyber Crimes Branch, Gujarat",
  "Surendranagar Cyber Cell, Gujarat",
  "Vadodara City Cyber PS, Gujarat",
  "Gandhinagar HQ Cyber Division, Gujarat",
  "Rajkot Urban Cyber Cell, Gujarat",
  "Bhavnagar Crime Branch, Gujarat",
  "Mumbai Cyber Police Station, Bandra, Maharashtra",
  "Delhi Special Cell Cyber Unit, New Delhi",
  "Bengaluru City Cyber Crime PS, Karnataka",
  "Hyderabad Cyber Crime Cell, Telangana",
  "Pune Cyber Crime Branch, Shivajinagar, Maharashtra",
  "Kolkata Cyber Police Station, Lalbazar, West Bengal",
  "Chennai Cyber Crime Cell, Egmore, Tamil Nadu",
  "Jaipur Cyber Police Station, Rajasthan",
  "Chandigarh Cyber Crime Investigation Cell, UT",
  "Central Cyber Police Station, Sector 4",
  "HQ Command Centre Cyber Division",
  "Crime Branch Investigation Cell, Zone 1"
];

export default function LocationAutocomplete({ 
  value = "", 
  onChange, 
  placeholder = "e.g. Ahmedabad Cyber Cell, Sector 4",
  className = ""
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [filtered, setFiltered] = useState([]);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (value.trim().length > 0) {
      const matches = INDIAN_LOCATIONS.filter((loc) =>
        loc.toLowerCase().includes(value.toLowerCase())
      );
      setFiltered(matches);
    } else {
      setFiltered(INDIAN_LOCATIONS.slice(0, 6));
    }
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
        <span className="absolute left-3 text-[#9CA3AF] pointer-events-none">
          <MapPin className="h-4 w-4 text-[#2563EB]" />
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

      {isOpen && filtered.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#E2E8F0] rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto text-xs divide-y divide-[#F1F5F9]">
          <div className="px-3 py-1.5 bg-[#F8FAFC] text-[9px] font-mono font-bold text-[#64748B] uppercase">
            Jurisdiction Autocomplete Suggestions ({filtered.length})
          </div>
          {filtered.map((loc, idx) => (
            <div
              key={idx}
              onClick={() => handleSelect(loc)}
              className="px-3.5 py-2 hover:bg-[#EFF6FF] hover:text-[#2563EB] cursor-pointer flex items-center gap-2 font-medium text-[#334155] transition-colors"
            >
              <MapPin className="h-3 w-3 text-[#64748B] shrink-0" />
              <span className="truncate">{loc}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
