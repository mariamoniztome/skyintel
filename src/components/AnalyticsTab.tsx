import React from "react";
import { useStore } from "@/src/store/useStore";
import StatsCards from "@/src/components/StatsCards";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const AnalyticsTab: React.FC = () => {
  const { flights, theme } = useStore();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tighter uppercase text-[var(--foreground)]">Fleet Analytics</h2>
          <p className="text-sm text-[var(--muted-foreground)]">Comprehensive data overview of global flight operations and risk levels.</p>
        </div>
      </div>

      {/* Stats Section moved to Analytics for "everything on analytics" view */}
      <StatsCards />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Level Distribution */}
        <Card className="border-[var(--border)] bg-[var(--card)] shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-[var(--foreground)]">Turbulence Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: "Low", value: flights.filter(f => f.riskLevel === "low").length, color: "#10b981" },
                    { name: "Medium", value: flights.filter(f => f.riskLevel === "medium").length, color: "#f59e0b" },
                    { name: "High", value: flights.filter(f => f.riskLevel === "high").length, color: "#f43f5e" },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {[
                    { name: "Low", value: flights.filter(f => f.riskLevel === "low").length, color: "#10b981" },
                    { name: "Medium", value: flights.filter(f => f.riskLevel === "medium").length, color: "#f59e0b" },
                    { name: "High", value: flights.filter(f => f.riskLevel === "high").length, color: "#f43f5e" },
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: theme === "dark" ? "#111" : "#fff", border: `1px solid ${theme === "dark" ? "#333" : "#eee"}`, borderRadius: '8px' }}
                  itemStyle={{ color: theme === "dark" ? "#fff" : "#000" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-4">
              {[
                { name: "Low", value: flights.filter(f => f.riskLevel === "low").length, color: "#10b981" },
                { name: "Medium", value: flights.filter(f => f.riskLevel === "medium").length, color: "#f59e0b" },
                { name: "High", value: flights.filter(f => f.riskLevel === "high").length, color: "#f43f5e" },
              ].map(d => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-xs text-[var(--muted-foreground)]">{d.name}: {d.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Altitude Distribution */}
        <Card className="border-[var(--border)] bg-[var(--card)] shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-[var(--foreground)]">Flight Altitude Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { range: "0-10k", count: flights.filter(f => f.altitude < 10000).length },
                { range: "10k-20k", count: flights.filter(f => f.altitude >= 10000 && f.altitude < 20000).length },
                { range: "20k-30k", count: flights.filter(f => f.altitude >= 20000 && f.altitude < 30000).length },
                { range: "30k-40k", count: flights.filter(f => f.altitude >= 30000 && f.altitude < 40000).length },
                { range: "40k+", count: flights.filter(f => f.altitude >= 40000).length },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "#ffffff10" : "#00000010"} vertical={false} />
                <XAxis dataKey="range" stroke={theme === "dark" ? "#94a3b8" : "#64748b"} fontSize={12} />
                <YAxis stroke={theme === "dark" ? "#94a3b8" : "#64748b"} fontSize={12} />
                <Tooltip 
                  cursor={{ fill: theme === "dark" ? "#ffffff05" : "#00000005" }}
                  contentStyle={{ backgroundColor: theme === "dark" ? "#111" : "#fff", border: `1px solid ${theme === "dark" ? "#333" : "#eee"}`, borderRadius: '8px' }}
                  itemStyle={{ color: theme === "dark" ? "#fff" : "#000" }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats Table */}
      <Card className="border-[var(--border)] bg-[var(--card)] shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-[var(--foreground)]">Operational Fleet Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--border)] text-[var(--muted-foreground)] uppercase text-[10px] font-bold tracking-widest">
                <tr>
                  <th className="px-4 py-3">Flight ID</th>
                  <th className="px-4 py-3">Callsign</th>
                  <th className="px-4 py-3">Altitude</th>
                  <th className="px-4 py-3">Speed</th>
                  <th className="px-4 py-3">Turbulence Score</th>
                  <th className="px-4 py-3">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {flights.map(f => (
                  <tr key={f.id} className="hover:bg-[var(--muted)] transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">{f.id}</td>
                    <td className="px-4 py-3 font-bold">{f.callsign}</td>
                    <td className="px-4 py-3">{f.altitude.toLocaleString()} ft</td>
                    <td className="px-4 py-3">{f.speed} kts</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1.5 bg-[var(--muted)] rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${f.turbulenceScore > 70 ? 'bg-rose-500' : f.turbulenceScore > 40 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${f.turbulenceScore}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono">{f.turbulenceScore}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 uppercase text-[10px] font-black tracking-tighter">
                      <span className={f.riskLevel === 'high' ? 'text-rose-500' : f.riskLevel === 'medium' ? 'text-amber-500' : 'text-emerald-500'}>
                        {f.riskLevel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsTab;
