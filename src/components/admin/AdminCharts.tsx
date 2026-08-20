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

export interface DualSeriesPoint {
  label: string;
  primary: number;
  secondary: number;
}

/**
 * Two series on independent axes — a count on the left, rupees on the right.
 * Used by the store, order and affiliate reports, which all want "activity
 * versus money" on one timeline but never on one scale.
 */
export function DualMetricChart({
  data,
  primaryName,
  secondaryName,
  primaryIsMoney = false,
}: {
  data: DualSeriesPoint[];
  primaryName: string;
  secondaryName: string;
  primaryIsMoney?: boolean;
}) {
  return (
    <div className="h-60 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="dualSecondary" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} />
          <YAxis yAxisId="left" tick={AXIS} tickLine={false} axisLine={false} width={48} />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={AXIS}
            tickLine={false}
            axisLine={false}
            width={52}
          />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
            formatter={(value, name) =>
              name === secondaryName || (name === primaryName && primaryIsMoney)
                ? [formatInr(Number(value)), String(name)]
                : [String(value), String(name)]
            }
          />
          <Legend iconType="plainline" wrapperStyle={{ fontSize: 12, paddingBottom: 8 }} />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="primary"
            name={primaryName}
            stroke="#7c3aed"
            strokeWidth={2}
            dot={false}
          />
          <Area
            yAxisId="right"
            type="monotone"
            dataKey="secondary"
            name={secondaryName}
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#dualSecondary)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

const SLICE_COLORS = ["#f59e0b", "#3b82f6", "#ec4899", "#10b981", "#8b5cf6", "#94a3b8"];

/**
 * Donut with a legend. `valueFormat` decides whether the slices read as money
 * or as plain counts — the same component backs commission-by-store and
 * orders-by-status, which are not the same kind of number.
 */
export function TopStoresDonut({
  data,
  total,
  centreLabel = "Commission",
  valueFormat = "money",
  emptyMessage = "No confirmed commission yet.",
}: {
  data: StoreSlice[];
  total: number;
  centreLabel?: string;
  valueFormat?: "money" | "count";
  emptyMessage?: string;
}) {
  const show = (value: number) => (valueFormat === "money" ? formatInr(value) : String(value));

  if (data.length === 0) {
    return <p className="py-12 text-center text-sm text-slate-500">{emptyMessage}</p>;
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
              formatter={(value) => show(Number(value))}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-sm font-extrabold text-slate-900">{show(total)}</span>
          <span className="text-[11px] text-slate-400">{centreLabel}</span>
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
              {show(slice.value)}
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
