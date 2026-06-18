import React, { useEffect, useMemo, useState } from "react";
import { useStore } from "@/src/store/useStore";
import { Card, CardContent } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Bell, Clock, MapPin, ShieldAlert, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import {Dialog, DialogContent, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, } from "recharts";

interface AlertsPageProps {
  onLocateFlight: (flightId: string) => void;
}

const AlertsPage: React.FC<AlertsPageProps> = ({ onLocateFlight }) => {
  const { alerts, flights, selectedFlight, setSelectedFlightId } = useStore();
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<"all" | "warning" | "critical">("all");
  const [minScore, setMinScore] = useState(0);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const [historyOpen, setHistoryOpen] = useState(false);

  const getFlightDetails = (flightId: string) => {
    return flights.find(f => f.id === flightId);
  };

  const filteredAlerts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return alerts.filter((alert) => {
      const flight = getFlightDetails(alert.flight_id);
      const severity = alert.score >= 80 ? "critical" : "warning";

      const matchesQuery =
        query.length === 0 ||
        alert.flight_id.toLowerCase().includes(query) ||
        (flight?.callsign ?? "").toLowerCase().includes(query) ||
        alert.message.toLowerCase().includes(query);

      const matchesSeverity = severityFilter === "all" ? true : severity === severityFilter;
      const matchesScore = alert.score >= minScore;

      return matchesQuery && matchesSeverity && matchesScore;
    });
  }, [alerts, flights, search, severityFilter, minScore]);

  const totalPages = Math.ceil(
  filteredAlerts.length / PAGE_SIZE
);

  const paginatedAlerts = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;

    return filteredAlerts.slice(
      start,
      start + PAGE_SIZE
    );
  }, [filteredAlerts, page]);

  useEffect(() => {
    setPage(1);
  }, [
    search,
    severityFilter,
    minScore,
  ]);

  return (
    <>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Flight ID, Callsign or Message"
            className="h-10 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-sky-500/40"
          />
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as "all" | "warning" | "critical")}
            className="h-10 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-sky-500/40"
          >
            <option value="all">All Severities</option>
            <option value="warning">Warning (61-79)</option>
            <option value="critical">Critical (80+)</option>
          </select>
          <input
            type="number"
            min={0}
            max={100}
            value={minScore}
            onChange={(e) => setMinScore(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
            placeholder="Minimum Score %"
            className="h-10 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-sky-500/40"
          />
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
        ) : filteredAlerts.length === 0 ? (
          <Card className="border-[var(--border)] bg-[var(--card)] p-8 text-center shadow-sm">
            <p className="text-sm text-[var(--muted-foreground)]">
              No alerts match your current filters.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="xl:col-span-2 space-y-4">
              {paginatedAlerts.map((alert) => {
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
                          <button onClick={() => { onLocateFlight(alert.flight_id); }} className="w-full py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2">
                            <MapPin className="h-3 w-3" />
                            Locate on Map
                          </button>
                          <button onClick={() => { if (!flight) return; setSelectedFlightId(flight.id); setHistoryOpen(true); }} className="w-full py-2 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] text-[var(--foreground)] text-xs font-bold transition-colors">
                            View History
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            {totalPages > 1 && (
              <div className="mt-6 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setPage((p) => Math.max(1, p - 1));
                        }}
                      />
                    </PaginationItem>

                    {Array.from(
                      { length: totalPages },
                      (_, i) => i + 1
                    )
                      .slice(
                        Math.max(0, page - 3),
                        Math.min(totalPages, page + 2)
                      )
                      .map((pageNumber) => (
                        <PaginationItem key={pageNumber}>
                          <PaginationLink
                            href="#"
                            isActive={pageNumber === page}
                            className="text-[var(--foreground)]"
                            onClick={(e) => {
                              e.preventDefault();
                              setPage(pageNumber);
                            }}
                          >
                            {pageNumber}
                          </PaginationLink>
                        </PaginationItem>
                      ))}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setPage((p) =>
                            Math.min(totalPages, p + 1)
                          );
                        }}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
            {/* Sidebar Stats for Alerts */}
            {/* <div className="space-y-6">
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
                    <span className="text-sm font-bold text-sky-500">
                      {alerts.length > 0 ? Math.round(alerts.reduce((acc, a) => acc + a.score, 0) / alerts.length) : 0}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div> */}
          </div>
        )}
      </div>

      <Dialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Flight History - {selectedFlight?.callsign || selectedFlight?.id}
            </DialogTitle>
          </DialogHeader>

          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={
                  selectedFlight?.history
                    ?.slice()
                    .reverse() || []
                }
              >
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(value) =>
                    new Date(value).toLocaleTimeString()
                  }
                />

                <YAxis />

                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AlertsPage;
