"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatInr } from "@/lib/utils";

export interface EarningsSource {
  name: string;
  value: number;
}

// Categorical slots 1-3 (blue, orange, aqua) from the validated dataviz palette.
// Aqua sits below 3:1 on white, so the legend carries visible labels + values
// (the relief rule) — identity is never color-alone here.
const SERIES_COLORS = ["#2a78d6", "#eb6834", "#1baf7a"];

export function EarningsSourceDonut({ data }: { data: EarningsSource[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-slate-400">
        No confirmed earnings yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="h-40 w-40 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="60%"
              outerRadius="100%"
              paddingAngle={2}
              stroke="#ffffff"
              strokeWidth={2}
            >
              {data.map((entry, i) => (
                <Cell key={entry.name} fill={SERIES_COLORS[i % SERIES_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 12px rgba(15,23,42,0.08)",
                fontSize: 12,
              }}
              formatter={(value, name) => [formatInr(Number(value ?? 0)), String(name ?? "")]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className="flex-1 space-y-2 text-sm">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center gap-2">
            <span
              aria-hidden
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: SERIES_COLORS[i % SERIES_COLORS.length] }}
            />
            <span className="flex-1 text-slate-600">{d.name}</span>
            <span className="font-semibold text-slate-900">{formatInr(d.value)}</span>
            <span className="w-12 text-right text-xs text-slate-400">
              {total > 0 ? `${Math.round((d.value / total) * 100)}%` : "0%"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
