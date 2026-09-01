"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { overviewData } from "@/lib/client/dashboard-data";

type Metric = "revenue" | "shops" | "expenses";

const metricLabels: Record<Metric, string> = {
  revenue: "عایدات",
  shops: "دوکان‌های اجاره",
  expenses: "مصارف",
};

const formatters: Record<Metric, (v: number) => string> = {
  revenue: (v) => `${Math.round(v / 1000)}k`,
  shops: (v) => `${v}`,
  expenses: (v) => `${Math.round(v / 1000)}k`,
};

const colors: Record<Metric, string> = {
  revenue: "#16a34a",
  shops: "#3b82f6",
  expenses: "#f59e0b",
};

export function OverviewChart() {
  const [metric, setMetric] = useState<Metric>("revenue");
  const color = colors[metric];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-col gap-3 pb-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="text-base font-semibold text-foreground">نمای کلی</CardTitle>
          <p className="text-sm text-muted-foreground">عملکرد ماهانه برای سال جاری</p>
        </div>
        <Tabs value={metric} onValueChange={(v) => setMetric(v as Metric)}>
          <TabsList>
            <TabsTrigger value="revenue">عایدات</TabsTrigger>
            <TabsTrigger value="shops">دوکان‌ها</TabsTrigger>
            <TabsTrigger value="expenses">مصارف</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="h-[320px] pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={overviewData} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
            <defs>
              <linearGradient id={`overview-${metric}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.22} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
              tickFormatter={formatters[metric]}
              width={48}
            />
            <Tooltip
              formatter={(v) => [formatters[metric](Number(v)), metricLabels[metric]]}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid var(--border)",
                fontSize: 12,
                boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
              }}
            />
            <Area
              type="monotone"
              dataKey={metric}
              stroke={color}
              strokeWidth={2.5}
              fill={`url(#overview-${metric})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
