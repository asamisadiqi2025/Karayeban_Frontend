"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export interface BarSeries {
  key: string;
  label: string;
  color: string;
}

export function BarChartCard({
  title,
  description,
  data,
  xKey,
  series,
  height = 280,
  stacked = false,
  yFormatter,
}: {
  title: string;
  description: string;
  data: Record<string, string | number>[];
  xKey: string;
  series: BarSeries[];
  height?: number;
  stacked?: boolean;
  yFormatter?: (v: number) => string;
}) {
  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-4" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
            <CartesianGrid vertical={false} stroke="#eef0f2" />
            <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9ca3af" }} dy={8} />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#9ca3af" }}
              width={yFormatter ? 52 : 40}
              tickFormatter={yFormatter ? (v) => yFormatter(Number(v)) : undefined}
            />
            <Tooltip
              formatter={yFormatter ? (v) => [yFormatter(Number(v)), ""] : undefined}
              contentStyle={{
                borderRadius: 10,
                border: "1px solid #e6e8eb",
                fontSize: 12,
                boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
              }}
            />
            {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
            {series.map((s) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.label}
                fill={s.color}
                radius={[4, 4, 0, 0]}
                stackId={stacked ? "a" : undefined}
                maxBarSize={32}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
