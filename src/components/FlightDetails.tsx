import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { X, Wind, Thermometer, Droplets, Cloud, Gauge, Navigation, ArrowUp, Activity, PlaneTakeoff, PlaneLanding, Clock3, MapPin } from "lucide-react";
import { useStore } from "@/src/store/useStore";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type AirportRef = {
  iata: string;
  icao: string;
  city: string;
  name: string;
  lat: number;
  lon: number;
};

const AIRPORT_REFERENCES: AirportRef[] = [
  { iata: "OPO", icao: "LPPR", city: "Porto", name: "Francisco Sa Carneiro", lat: 41.2481, lon: -8.6814 },
  { iata: "LIS", icao: "LPPT", city: "Lisbon", name: "Humberto Delgado", lat: 38.7742, lon: -9.1342 },
  { iata: "FAO", icao: "LPFR", city: "Faro", name: "Faro Airport", lat: 37.0144, lon: -7.9659 },
  { iata: "MAD", icao: "LEMD", city: "Madrid", name: "Adolfo Suarez Madrid-Barajas", lat: 40.4722, lon: -3.5609 },
  { iata: "BCN", icao: "LEBL", city: "Barcelona", name: "Barcelona El Prat", lat: 41.2974, lon: 2.0833 },
  { iata: "LUX", icao: "ELLX", city: "Luxembourg", name: "Luxembourg Airport", lat: 49.6233, lon: 6.2044 },
  { iata: "CDG", icao: "LFPG", city: "Paris", name: "Charles de Gaulle", lat: 49.0097, lon: 2.5479 },
  { iata: "LHR", icao: "EGLL", city: "London", name: "Heathrow", lat: 51.47, lon: -0.4543 },
  { iata: "AMS", icao: "EHAM", city: "Amsterdam", name: "Schiphol", lat: 52.31, lon: 4.7683 },
  { iata: "FRA", icao: "EDDF", city: "Frankfurt", name: "Frankfurt Airport", lat: 50.0379, lon: 8.5622 },
  { iata: "MXP", icao: "LIMC", city: "Milan", name: "Malpensa", lat: 45.6306, lon: 8.7281 },
  { iata: "FCO", icao: "LIRF", city: "Rome", name: "Fiumicino", lat: 41.8003, lon: 12.2389 },
  { iata: "BRU", icao: "EBBR", city: "Brussels", name: "Brussels Airport", lat: 50.9014, lon: 4.4844 },
  { iata: "VIE", icao: "LOWW", city: "Vienna", name: "Vienna Airport", lat: 48.1103, lon: 16.5697 },
  { iata: "ZRH", icao: "LSZH", city: "Zurich", name: "Zurich Airport", lat: 47.4647, lon: 8.5492 },
  { iata: "DUB", icao: "EIDW", city: "Dublin", name: "Dublin Airport", lat: 53.4213, lon: -6.2701 },
  { iata: "GRU", icao: "SBGR", city: "São Paulo", name: "Guarulhos", lat: -23.4356, lon: -46.4731 },
  { iata: "JFK", icao: "KJFK", city: "New York", name: "John F. Kennedy", lat: 40.6413, lon: -73.7781 },
  { iata: "EZE", icao: "SAEZ", city: "Buenos Aires", name: "Ezeiza", lat: -34.8222, lon: -58.5358 },
  { iata: "CMN", icao: "GMMN", city: "Casablanca", name: "Mohammed V", lat: 33.3675, lon: -7.5897 },
  // Açores
  { iata: "PDL", icao: "LPPD", city: "Ponta Delgada", name: "João Paulo II", lat: 37.7412, lon: -25.6979 },
  { iata: "TER", icao: "LPLA", city: "Lajes (Terceira)", name: "Lajes Field", lat: 38.7617, lon: -27.0908 },
  { iata: "HOR", icao: "LPHR", city: "Horta (Faial)", name: "Horta Airport", lat: 38.5199, lon: -28.7159 },
  { iata: "FLW", icao: "LPFL", city: "Flores Island", name: "Flores Airport", lat: 39.4553, lon: -31.1314 },
  { iata: "SMA", icao: "LPAZ", city: "Santa Maria", name: "Santa Maria Airport", lat: 36.9714, lon: -25.1707 },
  { iata: "PIX", icao: "LPPI", city: "Pico Island", name: "Pico Airport", lat: 38.5543, lon: -28.4413 },
  { iata: "SJZ", icao: "LPSJ", city: "São Jorge", name: "São Jorge Airport", lat: 38.6655, lon: -28.1758 },
  { iata: "GRW", icao: "LPGR", city: "Graciosa", name: "Graciosa Airport", lat: 39.0922, lon: -28.0298 },
  // Madeira
  { iata: "FNC", icao: "LPMA", city: "Funchal", name: "Madeira Airport", lat: 32.6979, lon: -16.7745 },
  { iata: "PXO", icao: "LPPS", city: "Porto Santo", name: "Porto Santo Airport", lat: 33.0734, lon: -16.3500 },
];

type Region = { name: string; latMin: number; latMax: number; lonMin: number; lonMax: number };

const REGIONS: Region[] = [
  { name: "Over the Azores", latMin: 36.9, latMax: 39.8, lonMin: -31.5, lonMax: -24.9 },
  { name: "Over Madeira", latMin: 32.4, latMax: 33.2, lonMin: -17.3, lonMax: -16.2 },
  { name: "Over Portugal", latMin: 36.9, latMax: 42.2, lonMin: -9.6, lonMax: -6.1 },
  { name: "Over Morocco", latMin: 27.7, latMax: 35.9, lonMin: -13.2, lonMax: -0.9 },
  { name: "Over the Bay of Biscay", latMin: 43.5, latMax: 48.0, lonMin: -9.5, lonMax: -1.0 },
  { name: "Over Spain", latMin: 35.9, latMax: 43.8, lonMin: -9.3, lonMax: 3.3 },
  { name: "Over France", latMin: 42.3, latMax: 51.1, lonMin: -4.8, lonMax: 8.2 },
  { name: "Over Germany", latMin: 47.3, latMax: 55.0, lonMin: 6.0, lonMax: 15.0 },
  { name: "Over the UK", latMin: 49.9, latMax: 60.8, lonMin: -8.0, lonMax: 1.8 },
  { name: "Over the Atlantic Ocean", latMin: 27.0, latMax: 50.0, lonMin: -37.0, lonMax: -9.6 },
];

const EARTH_RADIUS_KM = 6371;

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * EARTH_RADIUS_KM * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function resolveNearestAirport(lat: number, lon: number) {
  let nearest: { airport: AirportRef; distanceKm: number } | null = null;

  for (const airport of AIRPORT_REFERENCES) {
    const distanceKm = getDistanceKm(lat, lon, airport.lat, airport.lon);
    if (!nearest || distanceKm < nearest.distanceKm) {
      nearest = { airport, distanceKm };
    }
  }

  if (!nearest || nearest.distanceKm > 120) return null;
  return nearest;
}

function resolveAirportByIcao(icao: string | null): string | null {
  if (!icao) return null;
  const found = AIRPORT_REFERENCES.find(a => a.icao === icao.toUpperCase());
  return found ? `${found.city} (${found.iata})` : icao;
}

const FlightDetails: React.FC = () => {
  const { selectedFlightId, flights, setSelectedFlightId, theme, selectedFlight } = useStore();
  const [realRoute, setRealRoute] = React.useState<{ departure: string | null; arrival: string | null } | null>(null);

  React.useEffect(() => {
    if (!selectedFlightId) { setRealRoute(null); return; }
    setRealRoute(null);
    fetch(`/api/flights/${selectedFlightId}/route`)
      .then(r => r.json())
      .then(data => setRealRoute({
        departure: resolveAirportByIcao(data.departure),
        arrival: resolveAirportByIcao(data.arrival),
      }))
      .catch(() => setRealRoute(null));
  }, [selectedFlightId]);

  const flight = flights.find(f => f.id === selectedFlightId);

  if (!selectedFlightId || !flight) return null;

  const history = selectedFlight?.history ? [...selectedFlight.history].reverse() : [];
  const riskVariant = flight.riskLevel === "high" ? "danger" : flight.riskLevel === "medium" ? "warning" : "success";
  const firstTrackedPoint = history[0] ?? null;
  const latestTrackedPoint = history[history.length - 1] ?? null;
  const trackingStartedAt = firstTrackedPoint?.timestamp ?? null;
  const lastSeenAt = latestTrackedPoint?.timestamp ?? selectedFlight?.last_updated ?? flight.last_updated ?? null;
  const formatDateTime = (value: string | null) => {
    if (!value) return "Not available";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "Not available";
    return parsed.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const resolveLocation = (lat: number, lon: number): string => {
    const nearest = resolveNearestAirport(lat, lon);
    if (nearest) return `${nearest.airport.city} (${nearest.airport.iata})`;
    for (const region of REGIONS) {
      if (lat >= region.latMin && lat <= region.latMax && lon >= region.lonMin && lon <= region.lonMax) {
        return region.name;
      }
    }
    return lon < -10 ? "Over the Atlantic Ocean" : "Unknown area";
  };

  const getCompassDir = (deg: number) => {
    const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    return dirs[Math.round(deg / 45) % 8];
  };

  const routeLabel =
    realRoute === null
      ? null
      : realRoute.departure || realRoute.arrival
      ? `${realRoute.departure ?? "?"} → ${realRoute.arrival ?? "In flight"}`
      : null;

  return (
    <Card className="fixed right-6 top-24 bottom-6 w-[400px] z-50 overflow-y-auto border-none bg-[var(--card)]/95 backdrop-blur-2xl rounded-[32px] animate-in slide-in-from-right duration-500">
      <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-white z-10 p-8 pb-4">
        <div>
          <CardTitle className="text-3xl font-black tracking-tighter text-[var(--foreground)]">{flight.callsign || flight.id}</CardTitle>
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)] mt-1 opacity-60">Flight ID: {flight.id}</div>
        </div>
        <button 
          onClick={() => setSelectedFlightId(null)}
          className="p-3 hover:bg-[var(--muted)] rounded-full transition-all hover:rotate-90"
        >
          <X className="h-6 w-6 text-[var(--foreground)]" />
        </button>
      </CardHeader>
      
      <CardContent className="p-8 pt-2 space-y-8">
        {/* Trip Summary */}
        <div className="space-y-4 rounded-2xl bg-[var(--muted)]/30 p-4 border border-[var(--border)]/50">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
            Trip Summary
          </h4>
          <div className="grid grid-cols-1 gap-3 text-sm text-[var(--foreground)]">
            <div className="flex items-start gap-3">
              <PlaneTakeoff className="h-4 w-4 mt-0.5 text-sky-500" />
              <div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Route</div>
                <div className="font-semibold">
                  {realRoute === null ? (
                    <span className="opacity-40 italic text-xs">Fetching…</span>
                  ) : routeLabel ? (
                    routeLabel
                  ) : (
                    <span className="opacity-40 italic text-xs">Not available</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 mt-0.5 text-rose-500" />
              <div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Current Position</div>
                <div className="font-semibold">{resolveLocation(flight.lat, flight.lon)}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock3 className="h-4 w-4 mt-0.5 text-amber-500" />
              <div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Tracking Since</div>
                <div className="font-semibold">{formatDateTime(trackingStartedAt)}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <PlaneLanding className="h-4 w-4 mt-0.5 text-emerald-500" />
              <div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Last Seen</div>
                <div className="font-semibold">{formatDateTime(lastSeenAt)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Score */}
        <div className="flex items-end justify-between py-6 border-b border-[var(--border)]/50">
          <div className="space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Turbulence Risk</div>
            <div className="text-6xl font-light tracking-tighter text-[var(--foreground)] leading-none">
              {Math.round(flight.turbulenceScore)}<span className="text-2xl opacity-30">%</span>
            </div>
          </div>
          <Badge variant={riskVariant} className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
            {flight.riskLevel}
          </Badge>
        </div>

        {/* Flight Stats Grid */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
              <ArrowUp className="h-3 w-3" /> Altitude
            </div>
            <div className="text-xl font-medium text-[var(--foreground)]">{Math.round(flight.altitude).toLocaleString()} <span className="text-xs opacity-40">ft</span></div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
              <Activity className="h-3 w-3" /> Speed
            </div>
            <div className="text-xl font-medium text-[var(--foreground)]">{Math.round(flight.speed)} <span className="text-xs opacity-40">kts</span></div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
              <Navigation className="h-3 w-3" /> Heading
            </div>
            <div className="text-xl font-medium text-[var(--foreground)]">{getCompassDir(flight.heading)} <span className="text-xs opacity-40">{Math.round(flight.heading)}°</span></div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
              <MapPin className="h-3 w-3" /> Position
            </div>
            <div className="text-sm font-medium text-[var(--foreground)]">{resolveLocation(flight.lat, flight.lon)}</div>
          </div>
        </div>

        {/* Weather Data */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)] flex items-center gap-2">
            <Cloud className="h-3 w-3" /> Atmospheric Conditions
          </h4>
          <div className="grid grid-cols-2 gap-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500">
                <Wind className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Wind</div>
                <div className="text-sm font-semibold text-[var(--foreground)]">{Math.round(flight.wind_speed)} kts</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                <Thermometer className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Temp</div>
                <div className="text-sm font-semibold text-[var(--foreground)]">{Math.round(flight.temperature)}°C</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                <Gauge className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Pressure</div>
                <div className="text-sm font-semibold text-[var(--foreground)]">{Math.round(flight.pressure)} hPa</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                <Droplets className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Humidity</div>
                <div className="text-sm font-semibold text-[var(--foreground)]">{Math.round(flight.humidity)}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="space-y-8 pt-8 border-t border-[var(--border)]/50">
          <div className="space-y-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Turbulence Trend</div>
            <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <XAxis dataKey="timestamp" hide />
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '10px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Line type="monotone" dataKey="score" stroke="#fbbf24" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Altitude Profile</div>
            <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <XAxis dataKey="timestamp" hide />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '10px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Line type="monotone" dataKey="altitude" stroke="#3b82f6" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FlightDetails;
