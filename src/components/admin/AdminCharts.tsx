"use client";

import {
  Area,
  AreaChart,
  Cell,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatInr } from "@/lib/utils";

export interface EarningsClicksPoint {
  label: string;
  earnings: number;
  clicks: number;
}

export interface UserGrowthPoint {
  label: string;
  users: number;
}

export interface StoreSlice {
  name: string;
  value: number;
}

const AXIS = { fontSize: 11, fill: "#94a3b8" };

/** Dual-axis: rupees and clicks share a chart but never a scale. */
export function EarningsClicksChart({ data }: { data: EarningsClicksPoint[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="adminEarnings" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} />
          <YAxis yAxisId="left" tick={AXIS} tickLine={false} axisLine={false} width={54} />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={AXIS}
            tickLine={false}
            axisLine={false}
            width={44}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              fontSize: 12,
              boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
            }}
            formatter={(value, name) =>
              name === "Earnings" ? [formatInr(Number(value)), name] : [String(value), name]
            }
          />
          <Legend iconType="plainline" wrapperStyle={{ fontSize: 12, paddingBottom: 8 }} />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="earnings"
            name="Earnings"
            stroke="#7c3aed"
            strokeWidth={2}
            fill="url(#adminEarnings)"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="clicks"
            name="Clicks"
            stroke="#38bdf8"
            strokeWidth={2}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function UserGrowthChart({ data }: { data: UserGrowthPoint[] }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -14, bottom: 0 }}>
          <defs>
            <linearGradient id="adminUsers" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} />
          <YAxis tick={AXIS} tickLine={false} axisLine={false} width={44} />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              fontSize: 12,
            }}
          />
          <Area
            type="monotone"
            dataKey="users"
            name="Users"
            stroke="#7c3aed"
            strokeWidth={2}
            fill="url(#adminUsers)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

const SLICE_COLORS = ["#f59e0b", "#3b82f6", "#ec4899", "#10b981", "#8b5cf6", "#94a3b8"];

export function TopStoresDonut({ data, total }: { data: StoreSlice[]; total: number }) {
  if (data.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-slate-500">No confirmed commission yet.</p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <div className="relative h-44 w-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={52}
              outerRadius={80}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={SLICE_COLORS[i % SLICE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
              formatter={(value) => formatInr(Number(value))}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-sm font-extrabold text-slate-900">{formatInr(total)}</span>
          <span className="text-[11px] text-slate-400">Commission</span>
        </div>
      </div>

      <ul className="min-w-0 flex-1 space-y-2.5">
        {data.map((slice, i) => (
          <li key={slice.name} className="flex items-center gap-2.5">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: SLICE_COLORS[i % SLICE_COLORS.length] }}
            />
            <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{slice.name}</span>
            <span className="shrink-0 text-sm font-semibold text-slate-900">
              {formatInr(slice.value)}
            </span>
            <span className="w-14 shrink-0 text-right text-xs text-slate-400">
              {total > 0 ? `${((slice.value / total) * 100).toFixed(1)}%` : "—"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
