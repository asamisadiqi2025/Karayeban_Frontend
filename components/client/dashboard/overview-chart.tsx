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

type Metric = "revenue" | "orders" | "profit";

const formatters: Record<Metric, (v: number) => string> = {
  revenue: (v) => `$${Math.round(v / 1000)}k`,
  orders: (v) => `${v}`,
  profit: (v) => `$${Math.round(v / 1000)}k`,
};

export function OverviewChart() {
  const [metric, setMetric] = useState<Metric>("revenue");

  return (
    <Card>
      <CardHeader className="flex-col gap-3 pb-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="text-base font-semibold text-foreground">Overview</CardTitle>
          <p className="text-sm text-muted-foreground">Monthly performance for the current year</p>
        </div>
        <Tabs value={metric} onValueChange={(v) => setMetric(v as Metric)}>
          <TabsList>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="profit">Profit</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="h-[320px] pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={overviewData} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
            <defs>
              <linearGradient id="overviewGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#16a34a" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#16a34a" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#eef0f2" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#9ca3af" }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#9ca3af" }}
              tickFormatter={formatters[metric]}
              width={48}
            />
            <Tooltip
              formatter={(v) => [formatters[metric](Number(v)), metric[0].toUpperCase() + metric.slice(1)]}
              contentStyle={{
                borderRadius: 10,
                border: "1px solid #e6e8eb",
                fontSize: 12,
                boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
              }}
            />
            <Area
              type="monotone"
              dataKey={metric}
              stroke="#16a34a"
              strokeWidth={2.5}
              fill="url(#overviewGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
