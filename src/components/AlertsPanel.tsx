import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Bell, Clock, AlertCircle } from "lucide-react";
import { useStore } from "@/src/store/useStore";
import { format } from "date-fns";

const AlertsPanel: React.FC = () => {
  const { alerts } = useStore();

  return (
    <Card className="h-full border-[var(--border)] bg-[var(--card)] shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-[var(--border)]">
        <CardTitle className="text-sm font-bold flex items-center gap-2 text-[var(--foreground)]">
          <Bell className="h-4 w-4 text-rose-500" />
          Real-time Alerts
        </CardTitle>
        <Badge variant="outline" className="text-[10px] text-[var(--muted-foreground)] border-[var(--border)]">
          {alerts.length} Active
        </Badge>
      </CardHeader>
      <CardContent className="p-0 overflow-y-auto max-h-[400px]">
        {alerts.length === 0 ? (
          <div className="p-8 text-center text-[var(--muted-foreground)] text-xs">
            No active turbulence alerts
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {alerts.map((alert) => (
              <div key={alert.id} className="p-4 hover:bg-[var(--muted)] transition-colors group">
                <div className="flex items-start gap-3">
                  <div className="mt-1 p-1.5 rounded-full bg-rose-500/10 border border-rose-500/20">
                    <AlertCircle className="h-3 w-3 text-rose-500" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--foreground)]">{alert.flight_id}</span>
                      <span className="text-[10px] text-[var(--muted-foreground)] flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {format(new Date(alert.timestamp), "HH:mm:ss")}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed">
                      {alert.message}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="h-1 flex-1 bg-[var(--muted)] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-rose-500" 
                          style={{ width: `${alert.score}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-rose-500">{alert.score}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AlertsPanel;
