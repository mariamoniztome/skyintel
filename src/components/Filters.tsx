import React from "react";
import { Input, Select } from "./ui/ui-components";
import { Search, Filter, SlidersHorizontal } from "lucide-react";
import { useStore } from "@/src/store/useStore";

const Filters: React.FC = () => {
  const { searchQuery, setSearchQuery, riskFilter, setRiskFilter } = useStore();

  return (
    <div className="flex flex-col md:flex-row gap-4 items-center bg-[var(--card)] backdrop-blur-md p-4 rounded-xl border border-[var(--border)] shadow-sm">
      <div className="flex items-center gap-3 w-full md:w-auto">
        <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] whitespace-nowrap">
          <Filter className="h-3 w-3" /> Risk Level:
        </div>
        <Select 
          className="w-full md:w-40 bg-[var(--background)] border-[var(--border)] text-[var(--foreground)]"
          value={riskFilter}
          onChange={(e: any) => setRiskFilter(e.target.value)}
        >
          <option value="all">All Risks</option>
          <option value="low">Low Risk</option>
          <option value="medium">Medium Risk</option>
          <option value="high">High Risk</option>
        </Select>
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto">
        <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] whitespace-nowrap">
          <SlidersHorizontal className="h-3 w-3" /> Altitude:
        </div>
        <Select className="w-full md:w-40 bg-[var(--background)] border-[var(--border)] text-[var(--foreground)]">
          <option value="all">All Altitudes</option>
          <option value="low">Below 10k ft</option>
          <option value="mid">10k - 30k ft</option>
          <option value="high">Above 30k ft</option>
        </Select>
      </div>
      
      <div className="ml-auto hidden lg:block">
        <div className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-widest font-bold">
          SkyIntel v1.0.4
        </div>
      </div>
    </div>
  );
};

export default Filters;
