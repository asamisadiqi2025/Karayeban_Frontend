"use client";

import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface AreaSeries {
  key: string;
  label: string;
  color: string;
  formatter?: (v: number) => string;
}

export function AreaChartCard({
  title,
  description,
  data,
  xKey,
  series,
  height = 300,
}: {
  title: string;
  description: string;
  data: Record<string, string | number>[];
  xKey: string;
  series: AreaSeries[];
  height?: number;
}) {
  const [active, setActive] = useState(series[0].key);
  const current = series.find((s) => s.key === active) ?? series[0];
  const fmt = current.formatter ?? ((v: number) => `${v}`);
  const gradientId = `grad-${title.replace(/[^a-zA-Z0-9]/g, "")}-${current.key}`;

  return (
    <Card>
      <CardHeader className="flex-col gap-3 pb-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
          <CardDescription className="mt-0.5">{description}</CardDescription>
        </div>
        {series.length > 1 && (
          <Tabs value={active} onValueChange={setActive}>
            <TabsList>
              {series.map((s) => (
                <TabsTrigger key={s.key} value={s.key}>
                  {s.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}
      </CardHeader>
      <CardContent className="pt-4" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={current.color} stopOpacity={0.22} />
                <stop offset="100%" stopColor={current.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#eef0f2" />
            <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9ca3af" }} dy={8} />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#9ca3af" }}
              tickFormatter={(v) => fmt(Number(v))}
              width={52}
            />
            <Tooltip
              formatter={(v) => [fmt(Number(v)), current.label]}
              contentStyle={{
                borderRadius: 10,
                border: "1px solid #e6e8eb",
                fontSize: 12,
                boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
              }}
            />
            <Area
              type="monotone"
              dataKey={current.key}
              stroke={current.color}
              strokeWidth={2.5}
              fill={`url(#${gradientId})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
