import { create } from "zustand";
import axios from "axios";

export interface Flight {
  id: string;
  callsign: string;
  lat: number;
  lon: number;
  altitude: number;
  speed: number;
  heading: number;
  wind_speed: number;
  gust: number;
  temperature: number;
  pressure: number;
  humidity: number;
  clouds: number;
  precipitation: number;
  condition: string;
  turbulenceScore: number;
  riskLevel: "low" | "medium" | "high";
  last_updated: string;
  history?: {
    lat: number;
    lon: number;
    altitude: number;
    score: number;
    timestamp: string;
  }[];
}

export interface Alert {
  id: number;
  flight_id: string;
  message: string;
  score: number;
  timestamp: string;
}

interface SkyIntelState {
  flights: Flight[];
  alerts: Alert[];
  selectedFlightId: string | null;
  selectedFlight: Flight | null;
  searchQuery: string;
  riskFilter: string;
  altitudeFilter: [number, number];
  theme: "light" | "dark";
  
  setFlights: (flights: Flight[]) => void;
  setAlerts: (alerts: Alert[]) => void;
  setSelectedFlightId: (id: string | null) => void;
  fetchFlightDetails: (id: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setRiskFilter: (filter: string) => void;
  setAltitudeFilter: (range: [number, number]) => void;
  setTheme: (theme: "light" | "dark") => void;
  
  fetchData: () => Promise<void>;
}

export const useStore = create<SkyIntelState>((set, get) => ({
  flights: [],
  alerts: [],
  selectedFlightId: null,
  selectedFlight: null,
  searchQuery: "",
  riskFilter: "all",
  altitudeFilter: [0, 50000],
  theme: "light",

  setFlights: (flights) => set({ flights }),
  setAlerts: (alerts) => set({ alerts }),
  setSelectedFlightId: (id) => {
    set({ selectedFlightId: id });
    if (id) {
      get().fetchFlightDetails(id);
    } else {
      set({ selectedFlight: null });
    }
  },
  fetchFlightDetails: async (id) => {
    try {
      const res = await axios.get(`/api/flights/${id}`);
      set({ selectedFlight: res.data });
    } catch (error) {
      console.error("Error fetching flight details:", error);
    }
  },
  setSearchQuery: (query) => set({ searchQuery: query }),
  setRiskFilter: (filter) => set({ riskFilter: filter }),
  setAltitudeFilter: (range) => set({ altitudeFilter: range }),
  setTheme: (theme) => set({ theme }),

  fetchData: async () => {
    try {
      const { selectedFlightId, fetchFlightDetails } = get();
      const [flightsRes, alertsRes] = await Promise.all([
        axios.get("/api/flights"),
        axios.get("/api/alerts")
      ]);
      set({ flights: flightsRes.data, alerts: alertsRes.data });
      
      // Keep selected flight details updated
      if (selectedFlightId) {
        fetchFlightDetails(selectedFlightId);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }
}));
