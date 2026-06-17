import React, { useEffect, useState } from "react";
import { useStore } from "./store/useStore";
import FlightMap from "./components/FlightMap";
import FlightDetails from "./components/FlightDetails";
import AnalyticsTab from "./components/AnalyticsTab";
import AlertsPage from "./components/AlertsPage";
import { Activity, Bell, Map as MapIcon } from "lucide-react";

export default function App() {
  const { fetchData, theme, setSelectedFlightId } = useStore();
  const [currentTab, setCurrentTab] = useState<"map" | "analytics" | "alerts">("map");

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  useEffect(() => {
    if (currentTab !== "map") {
      setSelectedFlightId(null);
    }
  }, [currentTab, setSelectedFlightId]);

  return (
    <div className="relative min-h-screen text-[var(--foreground)] font-sans selection:bg-sky-500/30 transition-colors duration-300 flex flex-col">
      {/* Top Navbar */}
      <header className={`absolute top-0 inset-x-0 h-16 z-50 px-6 flex items-center justify-end ${currentTab === "map" ? "bg-linear-to-b from-white/92 via-white/55 to-transparent backdrop-blur-md text-slate-900" : "bg-(--card)/92 border-b border-(--border) text-(--foreground)"}`}>
        {/* <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <h1 className="text-lg text-white font-black tracking-tighter uppercase leading-none">SkyIntel</h1>
            <span className="text-[10px] text-sky-500 font-bold uppercase tracking-widest">Aviation Intelligence</span>
          </div>
        </div> */}

        <nav className="flex items-center gap-2 md:gap-4 text-sm font-semibold">
          <button 
            onClick={() => setCurrentTab("map")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${currentTab === "map" ? "bg-sky-500 text-white shadow-md " : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)"}`}
          >
            <MapIcon className="h-4 w-4" /> <span className="hidden xs:inline">Live Map</span>
          </button>
          <button 
            onClick={() => setCurrentTab("analytics")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${currentTab === "analytics" ? "bg-sky-500 text-white shadow-md " : currentTab === "map" ? "text-slate-700 hover:text-slate-900 hover:bg-white/45" : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)"}`}
          >
            <Activity className="h-4 w-4" /> <span className="hidden xs:inline">Analytics</span>
          </button>
          <button 
            onClick={() => setCurrentTab("alerts")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${currentTab === "alerts" ? "bg-sky-500 text-white shadow-md " : currentTab === "map" ? "text-slate-700 hover:text-slate-900 hover:bg-white/45" : "text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted)"}`}
          >
            <Bell className="h-4 w-4" /> <span className="hidden xs:inline">Alerts</span>
          </button>
        </nav>

      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {currentTab === "map" ? (
          <div className="flex-1 relative overflow-hidden">
            <div className="absolute inset-0">
              <FlightMap />
            </div>

            {/* Floating Details Panel is handled by FlightDetails component */}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 pt-24">
            <div className="max-w-[1600px] mx-auto">
              {currentTab === "analytics" ? <AnalyticsTab /> : <AlertsPage onLocateFlight={(flightId) => { setSelectedFlightId(flightId); setCurrentTab("map"); }}/>}
            </div>
          </div>
        )}
      </main>

      {/* Side Panel for Details */}
      {currentTab === "map" && <FlightDetails />}

      {/* Footer - Only show on non-map pages for better UX */}
      {currentTab !== "map" && (
        <footer className="border-t border-[var(--border)] p-6 text-center shrink-0">
          <div className="text-[var(--muted-foreground)] text-[10px] font-medium tracking-widest uppercase">
            &copy; 2026 SkyIntel Operations Control. All rights reserved.
          </div>
        </footer>
      )}
    </div>
  );
}
