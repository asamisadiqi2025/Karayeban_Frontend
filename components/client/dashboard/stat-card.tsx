"use client";

import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { ArrowUpRight, ArrowDownRight, type LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/shared/utils";

export interface StatCardProps {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  strokeColor: string;
  data: { v: number }[];
}

export function StatCard({
  label,
  value,
  change,
  positive,
  icon: Icon,
  iconBg,
  iconColor,
  strokeColor,
  data,
}: StatCardProps) {
  const gradientId = `grad-${label.replace(/[^a-zA-Z0-9]/g, "")}`;
  const gradientColor = iconBg;

  return (
    <Card className="group p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <p className="text-[13.5px] font-medium text-muted-foreground">{label}</p>
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105"
          style={{ backgroundColor: iconBg }}
        >
          <Icon className="h-4 w-4" style={{ color: iconColor }} />
        </div>
      </div>

      <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{value}</p>

      <div className="mt-1.5 flex items-center gap-1 text-xs font-medium">
        {positive ? (
          <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />
        ) : (
          <ArrowDownRight className="h-3.5 w-3.5 text-rose-600" />
        )}
        <span className={cn(positive ? "text-emerald-600" : "text-rose-600")}>{change}</span>
        <span className="text-xs text-muted-foreground">امروز</span>
      </div>

      <div className="mt-3 h-12">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={strokeColor} stopOpacity={0.2} />
                <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke={strokeColor}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
