"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
  ZAxis,
} from "recharts";

const axis = { fontSize: 11, stroke: "#9ca3af" };
const grid = "#e5e7eb33";

// ── Courbe de tendance simple (HRV, FC repos, recovery…) ─────────────────
export function TrendChart({
  data,
  dataKey,
  color = "#10b981",
  unit = "",
  domain,
}: {
  data: Record<string, unknown>[];
  dataKey: string;
  color?: string;
  unit?: string;
  domain?: [number | "auto", number | "auto"];
}) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid stroke={grid} vertical={false} />
        <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} minTickGap={24} />
        <YAxis tick={axis} tickLine={false} axisLine={false} domain={domain} width={40} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
          formatter={(v) => [`${v}${unit}`, dataKey]}
        />
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          dot={false}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Barres hebdo Z4-Z5 vs objectif ───────────────────────────────────────
export function WeeklyGoalBars({
  data,
  goal,
}: {
  data: { label: string; value: number }[];
  goal: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid stroke={grid} vertical={false} />
        <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} />
        <YAxis tick={axis} tickLine={false} axisLine={false} width={40} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => [`${v} min`, "Z4-Z5"]} />
        <ReferenceLine y={goal} stroke="#ef4444" strokeDasharray="4 4" label={{ value: `${goal} min`, fontSize: 10, fill: "#ef4444", position: "right" }} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.value >= goal ? "#10b981" : "#f59e0b"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Progression Bronco (temps, plus bas = mieux) ─────────────────────────
export function BroncoChart({
  data,
  paliers,
}: {
  data: { label: string; sec: number }[];
  paliers: { label: string; max: number; color: string }[];
}) {
  const fmt = (s: number) => `${Math.floor(s / 60)}'${String(Math.round(s % 60)).padStart(2, "0")}`;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 48, left: -8, bottom: 0 }}>
        <CartesianGrid stroke={grid} vertical={false} />
        <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} />
        <YAxis
          tick={axis}
          tickLine={false}
          axisLine={false}
          domain={["dataMin - 15", "dataMax + 15"]}
          reversed
          tickFormatter={fmt}
          width={48}
        />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => [fmt(Number(v)), "Bronco"]} />
        {paliers.map((p) => (
          <ReferenceLine
            key={p.label}
            y={p.max}
            stroke={p.color}
            strokeDasharray="3 3"
            label={{ value: p.label, fontSize: 9, fill: p.color, position: "right" }}
          />
        ))}
        <Line type="monotone" dataKey="sec" stroke="#0ea5e9" strokeWidth={2.5} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Timeline douleurs (scatter date × intensité) ─────────────────────────
export function PainTimeline({
  data,
}: {
  data: { x: number; intensite: number; zone: string; label: string }[];
}) {
  const color = (i: number) =>
    i >= 7 ? "#ef4444" : i >= 4 ? "#f59e0b" : "#10b981";
  return (
    <ResponsiveContainer width="100%" height={220}>
      <ScatterChart margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid stroke={grid} />
        <XAxis
          type="number"
          dataKey="x"
          domain={["dataMin", "dataMax"]}
          tick={axis}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => new Date(v).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}
        />
        <YAxis type="number" dataKey="intensite" domain={[0, 10]} tick={axis} tickLine={false} axisLine={false} width={40} />
        <ZAxis range={[60, 200]} dataKey="intensite" />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
          formatter={(_v, _n, p) => {
            const d = p.payload as { zone: string; intensite: number; label: string };
            return [`${d.zone} — ${d.intensite}/10`, d.label];
          }}
        />
        <Scatter data={data}>
          {data.map((d, i) => (
            <Cell key={i} fill={color(d.intensite)} />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}

// ── Nuage de points générique (croisements) ──────────────────────────────
export function CrossScatter({
  data,
  xLabel,
  yLabel,
  color = "#8b5cf6",
}: {
  data: { x: number; y: number; label?: string }[];
  xLabel: string;
  yLabel: string;
  color?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <ScatterChart margin={{ top: 8, right: 8, left: -8, bottom: 8 }}>
        <CartesianGrid stroke={grid} />
        <XAxis type="number" dataKey="x" name={xLabel} tick={axis} tickLine={false} axisLine={false} label={{ value: xLabel, fontSize: 10, fill: "#9ca3af", position: "insideBottom", offset: -2 }} />
        <YAxis type="number" dataKey="y" name={yLabel} tick={axis} tickLine={false} axisLine={false} width={40} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
          cursor={{ strokeDasharray: "3 3" }}
          formatter={(v, n) => [v, n === "x" ? xLabel : yLabel]}
        />
        <Scatter data={data} fill={color} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
