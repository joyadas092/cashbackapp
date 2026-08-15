"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatInr } from "@/lib/utils";

export interface EarningsPoint {
  date: string;
  label: string;
  amount: number;
}

// Categorical slot 1 (blue) from the validated dataviz palette.
const SERIES = "#2a78d6";
const GRID = "#e1e0d9";
const MUTED = "#898781";

export function EarningsLineChart({ data }: { data: EarningsPoint[] }) {
  if (data.every((d) => d.amount === 0)) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-slate-400">
        No earnings recorded in the last 90 days yet.
      </div>
    );
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="earningsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={SERIES} stopOpacity={0.25} />
              <stop offset="100%" stopColor={SERIES} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={GRID} strokeDasharray="0" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: MUTED, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: GRID }}
            minTickGap={24}
          />
          <YAxis
            tick={{ fill: MUTED, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={56}
            tickFormatter={(v: number) => formatInr(v)}
          />
          <Tooltip
            cursor={{ stroke: MUTED, strokeWidth: 1 }}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 12px rgba(15,23,42,0.08)",
              fontSize: 12,
            }}
            formatter={(value) => [formatInr(Number(value ?? 0)), "Earnings"]}
          />
          <Area
            type="monotone"
            dataKey="amount"
            stroke={SERIES}
            strokeWidth={2}
            fill="url(#earningsFill)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: "#ffffff" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
