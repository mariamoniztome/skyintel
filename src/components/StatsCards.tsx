import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Plane, AlertTriangle, Activity, Wind } from "lucide-react";
import { useStore } from "@/src/store/useStore";

const StatsCards: React.FC = () => {
  const { flights, alerts } = useStore();

  const highRiskCount = flights.filter(f => f.riskLevel === "high").length;
  const avgScore = flights.length > 0 
    ? Math.round(flights.reduce((acc, f) => acc + f.turbulenceScore, 0) / flights.length) 
    : 0;

  const stats = [
    {
      title: "Total Flights",
      value: flights.length,
      icon: Plane,
      color: "text-blue-400",
      bg: "bg-blue-400/10"
    },
    {
      title: "High Risk",
      value: highRiskCount,
      icon: AlertTriangle,
      color: "text-rose-400",
      bg: "bg-rose-400/10"
    },
    {
      title: "Avg Turbulence",
      value: `${avgScore}%`,
      icon: Activity,
      color: "text-amber-400",
      bg: "bg-amber-400/10"
    },
    {
      title: "Active Alerts",
      value: alerts.length,
      icon: Wind,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <Card key={i} className="border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] transition-colors shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">{stat.title}</CardTitle>
            <div className={`${stat.bg} p-2 rounded-lg`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--foreground)]">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatsCards;
