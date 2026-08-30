"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trafficSources } from "@/lib/client/dashboard-data";

export function TrafficSources() {
  const totalVisits = "284K";

  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle className="text-base font-semibold text-foreground">Traffic Sources</CardTitle>
        <p className="text-sm text-muted-foreground">Where your visitors come from</p>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 pt-4 sm:flex-row sm:items-center">
        <div className="relative h-[140px] w-[140px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={trafficSources}
                dataKey="value"
                nameKey="name"
                innerRadius={44}
                outerRadius={68}
                paddingAngle={3}
                startAngle={90}
                endAngle={-270}
                stroke="none"
              >
                {trafficSources.map((s) => (
                  <Cell key={s.name} fill={s.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-semibold text-foreground">{totalVisits}</span>
            <span className="text-[11px] text-muted-foreground">Visits</span>
          </div>
        </div>

        <ul className="w-full flex-1 space-y-2.5">
          {trafficSources.map((s) => (
            <li key={s.name} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                {s.name}
              </span>
              <span className="font-medium text-foreground">{s.value}%</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
