"use client";

import { ReceiptText, FileText, Zap, UserPlus, type LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { recentActivity } from "@/lib/client/dashboard-data";

const icons: Record<string, LucideIcon> = {
  rent: ReceiptText,
  contract: FileText,
  electricity: Zap,
  tenant: UserPlus,
};

const colors: Record<string, string> = {
  rent: "#16a34a",
  contract: "#3b82f6",
  electricity: "#f59e0b",
  tenant: "#a855f7",
};

const backgrounds: Record<string, string> = {
  rent: "#ecfdf5",
  contract: "#eff6ff",
  electricity: "#fff7ed",
  tenant: "#faf5ff",
};

export function RecentActivity() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-foreground">فعالیت‌های اخیر</CardTitle>
        <p className="text-sm text-muted-foreground">آخرین رویدادها در سیستم</p>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {recentActivity.map((activity) => {
            const Icon = icons[activity.type];
            return (
              <li key={activity.id} className="flex items-start gap-3">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: backgrounds[activity.type] }}
                >
                  <Icon className="h-4 w-4" style={{ color: colors[activity.type] }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{activity.message}</p>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{activity.time}</span>
                    {activity.amount && (
                      <>
                        <span className="text-muted-foreground/40">•</span>
                        <span className="font-medium text-muted-foreground">{activity.amount}</span>
                      </>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
