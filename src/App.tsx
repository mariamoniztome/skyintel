import React, { useEffect, useState } from "react";
import { useStore } from "./store/useStore";
import FlightMap from "./components/FlightMap";
import FlightDetails from "./components/FlightDetails";
import Filters from "./components/Filters";
import AnalyticsTab from "./components/AnalyticsTab";
import AlertsPage from "./components/AlertsPage";
import { Plane, Activity, Bell, Map as MapIcon, Settings, User, Moon, Sun } from "lucide-react";

export default function App() {
  const { fetchData, theme, setTheme } = useStore();
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

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans selection:bg-blue-500/30 transition-colors duration-300 flex flex-col">
      {/* Top Navbar */}
      <header className="h-16 border-b border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-xl sticky top-0 z-50 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)]">
            <Plane className="h-6 w-6 text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-black tracking-tighter uppercase leading-none">SkyIntel</h1>
            <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">Aviation Intelligence</span>
          </div>
        </div>

        <nav className="flex items-center gap-4 md:gap-8 text-sm font-medium text-[var(--muted-foreground)]">
          <button 
            onClick={() => setCurrentTab("map")}
            className={`flex items-center gap-2 transition-all ${currentTab === "map" ? "text-blue-500 font-bold scale-105" : "hover:text-[var(--foreground)]"}`}
          >
            <MapIcon className="h-4 w-4" /> <span className="hidden xs:inline">Live Map</span>
          </button>
          <button 
            onClick={() => setCurrentTab("analytics")}
            className={`flex items-center gap-2 transition-all ${currentTab === "analytics" ? "text-blue-500 font-bold scale-105" : "hover:text-[var(--foreground)]"}`}
          >
            <Activity className="h-4 w-4" /> <span className="hidden xs:inline">Analytics</span>
          </button>
          <button 
            onClick={() => setCurrentTab("alerts")}
            className={`flex items-center gap-2 transition-all ${currentTab === "alerts" ? "text-blue-500 font-bold scale-105" : "hover:text-[var(--foreground)]"}`}
          >
            <Bell className="h-4 w-4" /> <span className="hidden xs:inline">Alerts</span>
          </button>
        </nav>

        <div className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={toggleTheme}
            className="p-2 hover:bg-[var(--muted)] rounded-full transition-colors border border-[var(--border)]"
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {currentTab === "map" ? (
          <div className="flex-1 relative overflow-hidden">
            <div className="absolute inset-0">
              <FlightMap />
            </div>
            
            {/* Floating Filters Overlay */}
            <div className="absolute top-6 left-6 right-6 z-10 pointer-events-none">
              <div className="max-w-4xl pointer-events-auto">
                <Filters />
              </div>
            </div>

            {/* Floating Details Panel is handled by FlightDetails component */}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-[1600px] mx-auto">
              {currentTab === "analytics" ? <AnalyticsTab /> : <AlertsPage />}
            </div>
          </div>
        )}
      </main>

      {/* Side Panel for Details */}
      <FlightDetails />

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
