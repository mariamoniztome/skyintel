import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { X, Wind, Thermometer, Droplets, Cloud, Gauge, Navigation, ArrowUp, Activity, PlaneTakeoff, PlaneLanding, Clock3, MapPin } from "lucide-react";
import { useStore } from "@/src/store/useStore";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const FlightDetails: React.FC = () => {
  const { selectedFlightId, flights, setSelectedFlightId, theme, selectedFlight } = useStore();
  
  const flight = flights.find(f => f.id === selectedFlightId);

  if (!selectedFlightId || !flight) return null;

  const history = selectedFlight?.history ? [...selectedFlight.history].reverse() : [];
  const riskVariant = flight.riskLevel === "high" ? "danger" : flight.riskLevel === "medium" ? "warning" : "success";
  const firstTrackedPoint = history[0] ?? null;
  const latestTrackedPoint = history[history.length - 1] ?? null;
  const trackingStartedAt = firstTrackedPoint?.timestamp ?? null;
  const lastSeenAt = latestTrackedPoint?.timestamp ?? selectedFlight?.last_updated ?? flight.last_updated ?? null;
  const isLikelyLanded = flight.altitude < 2000 && flight.speed < 80;

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

  const formatPosition = (lat: number, lon: number) => {
    const latLabel = `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? "N" : "S"}`;
    const lonLabel = `${Math.abs(lon).toFixed(2)}°${lon >= 0 ? "E" : "W"}`;
    return `${latLabel}, ${lonLabel}`;
  };

  const departurePosition = firstTrackedPoint
    ? formatPosition(firstTrackedPoint.lat, firstTrackedPoint.lon)
    : "Not available from live feed";

  const arrivalStatus = isLikelyLanded
    ? `Likely landed near ${formatPosition(flight.lat, flight.lon)}`
    : "In flight (arrival location/time not available yet)";

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
                <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Departure (Approx.)</div>
                <div className="font-semibold">{departurePosition}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock3 className="h-4 w-4 mt-0.5 text-amber-500" />
              <div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Tracking Started</div>
                <div className="font-semibold">{formatDateTime(trackingStartedAt)}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <PlaneLanding className="h-4 w-4 mt-0.5 text-emerald-500" />
              <div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Arrival Status</div>
                <div className="font-semibold">{arrivalStatus}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 mt-0.5 text-rose-500" />
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
            <div className="text-xl font-medium text-[var(--foreground)]">{Math.round(flight.heading)}<span className="text-xs opacity-40">°</span></div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
              <Activity className="h-3 w-3" /> Position
            </div>
            <div className="text-xs font-mono text-[var(--foreground)] opacity-80">{flight.lat.toFixed(2)}°, {flight.lon.toFixed(2)}°</div>
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
