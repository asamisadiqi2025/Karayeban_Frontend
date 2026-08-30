"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export interface LineSeries {
  key: string;
  label: string;
  color: string;
}

export function LineChartCard({
  title,
  description,
  data,
  xKey,
  series,
  height = 280,
}: {
  title: string;
  description: string;
  data: Record<string, string | number>[];
  xKey: string;
  series: LineSeries[];
  height?: number;
}) {
  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-4" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
            <CartesianGrid vertical={false} stroke="#eef0f2" />
            <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9ca3af" }} dy={8} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9ca3af" }} width={40} />
            <Tooltip
              contentStyle={{
                borderRadius: 10,
                border: "1px solid #e6e8eb",
                fontSize: 12,
                boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
              }}
            />
            {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
            {series.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={2.5}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function RadarChartCard({
  title,
  description,
  data,
  angleKey,
  series,
  height = 300,
}: {
  title: string;
  description: string;
  data: Record<string, string | number>[];
  angleKey: string;
  series: LineSeries[];
  height?: number;
}) {
  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-4" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="72%">
            <PolarGrid stroke="#e6e8eb" />
            <PolarAngleAxis dataKey={angleKey} tick={{ fontSize: 11, fill: "#6b7280" }} />
            <PolarRadiusAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} />
            {series.map((s) => (
              <Radar
                key={s.key}
                name={s.label}
                dataKey={s.key}
                stroke={s.color}
                fill={s.color}
                fillOpacity={0.18}
                strokeWidth={2}
              />
            ))}
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                borderRadius: 10,
                border: "1px solid #e6e8eb",
                fontSize: 12,
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
