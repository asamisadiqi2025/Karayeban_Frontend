"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { monthlyGoals } from "@/lib/client/dashboard-data";
import { cn } from "@/lib/shared/utils";

export function MonthlyGoals() {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-base font-semibold text-foreground">Monthly Goals</CardTitle>
        <p className="text-sm text-muted-foreground">Track progress toward targets</p>
      </CardHeader>
      <CardContent className="space-y-4 pt-3">
        {monthlyGoals.map((goal) => {
          const pct = Math.min(100, Math.round((goal.current / goal.target) * 100));
          const value =
            goal.label === "Monthly Revenue" ? `$${goal.current.toLocaleString()}` : goal.current.toLocaleString();
          const target =
            goal.label === "Monthly Revenue" ? `$${goal.target.toLocaleString()}` : goal.target.toLocaleString();

          return (
            <div key={goal.label}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{goal.label}</span>
                <span className="text-muted-foreground">
                  {value} <span className="text-muted-foreground/60">/ {target}</span>
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className={cn("h-full rounded-full bg-primary transition-all")}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
