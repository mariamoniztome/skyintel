import React from "react";
import { useStore } from "@/src/store/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Bell, AlertCircle, Clock, Plane, MapPin, Activity, ShieldAlert } from "lucide-react";
import { format } from "date-fns";

const AlertsPage: React.FC = () => {
  const { alerts, flights } = useStore();

  const getFlightDetails = (flightId: string) => {
    return flights.find(f => f.id === flightId);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tighter uppercase text-[var(--foreground)]">Security & Safety Alerts</h2>
          <p className="text-sm text-[var(--muted-foreground)]">Real-time monitoring of atmospheric disturbances and flight risks.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-rose-500" />
            <span className="text-xs font-bold text-rose-500 uppercase tracking-wider">{alerts.length} Active Threats</span>
          </div>
        </div>
      </div>

      {alerts.length === 0 ? (
        <Card className="border-[var(--border)] bg-[var(--card)] p-12 text-center shadow-sm">
          <div className="flex flex-col items-center space-y-4">
            <div className="h-16 w-16 bg-emerald-500/10 rounded-full flex items-center justify-center">
              <ShieldAlert className="h-8 w-8 text-emerald-500" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-lg">Airspace Clear</h3>
              <p className="text-sm text-[var(--muted-foreground)] max-w-xs mx-auto">
                No significant turbulence or safety alerts detected in the monitored sectors.
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-4">
            {alerts.map((alert) => {
              const flight = getFlightDetails(alert.flight_id);
              return (
                <Card key={alert.id} className="border-[var(--border)] bg-[var(--card)] hover:border-rose-500/30 transition-all shadow-sm group overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500" />
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-rose-500/10">
                              <Bell className="h-5 w-5 text-rose-500" />
                            </div>
                            <div>
                              <div className="text-sm font-black text-[var(--foreground)] uppercase tracking-tight">
                                {alert.flight_id} <span className="text-[var(--muted-foreground)] font-normal ml-2">/ {flight?.callsign}</span>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-[var(--muted-foreground)] uppercase font-bold tracking-widest mt-0.5">
                                <Clock className="h-3 w-3" />
                                {format(new Date(alert.timestamp), "MMM dd, HH:mm:ss")}
                              </div>
                            </div>
                          </div>
                          <Badge variant="danger" className="uppercase text-[10px] px-2 py-0.5">High Risk</Badge>
                        </div>

                        <p className="text-sm text-[var(--foreground)] leading-relaxed font-medium">
                          {alert.message}
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                          <div className="space-y-1">
                            <div className="text-[10px] text-[var(--muted-foreground)] uppercase font-bold">Altitude</div>
                            <div className="text-xs font-mono text-[var(--foreground)]">{flight?.altitude.toLocaleString()} ft</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-[10px] text-[var(--muted-foreground)] uppercase font-bold">Speed</div>
                            <div className="text-xs font-mono text-[var(--foreground)]">{flight?.speed} kts</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-[10px] text-[var(--muted-foreground)] uppercase font-bold">Turbulence</div>
                            <div className="text-xs font-mono text-rose-500 font-bold">{alert.score}%</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-[10px] text-[var(--muted-foreground)] uppercase font-bold">Location</div>
                            <div className="text-xs font-mono text-[var(--foreground)]">{flight?.lat.toFixed(2)}, {flight?.lon.toFixed(2)}</div>
                          </div>
                        </div>
                      </div>

                      <div className="md:w-48 flex flex-col justify-center gap-3 border-t md:border-t-0 md:border-l border-[var(--border)] pt-4 md:pt-0 md:pl-6">
                        <button className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2">
                          <MapPin className="h-3 w-3" /> Locate on Map
                        </button>
                        <button className="w-full py-2 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] text-[var(--foreground)] text-xs font-bold transition-colors">
                          View History
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Sidebar Stats for Alerts */}
          <div className="space-y-6">
            <Card className="border-[var(--border)] bg-[var(--card)] shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Alert Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--muted)]">
                  <span className="text-xs font-medium">Critical Alerts</span>
                  <span className="text-sm font-bold text-rose-500">{alerts.filter(a => a.score > 80).length}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--muted)]">
                  <span className="text-xs font-medium">Warning Alerts</span>
                  <span className="text-sm font-bold text-amber-500">{alerts.filter(a => a.score > 50 && a.score <= 80).length}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--muted)]">
                  <span className="text-xs font-medium">Avg. Risk Score</span>
                  <span className="text-sm font-bold text-blue-500">
                    {alerts.length > 0 ? Math.round(alerts.reduce((acc, a) => acc + a.score, 0) / alerts.length) : 0}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-[var(--border)] bg-[var(--card)] shadow-sm overflow-hidden">
              <div className="p-4 bg-blue-600 text-white">
                <h3 className="text-xs font-black uppercase tracking-widest">Safety Protocol</h3>
              </div>
              <CardContent className="p-4 space-y-3">
                <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed italic">
                  "All high-risk turbulence alerts (Score {'>'} 70%) must be communicated to flight operations immediately for route reassessment."
                </p>
                <div className="pt-2 border-t border-[var(--border)]">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--foreground)]">
                    <Activity className="h-3 w-3 text-blue-500" />
                    SYSTEM STATUS: OPTIMAL
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsPage;
