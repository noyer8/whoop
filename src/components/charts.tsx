"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  AreaChart,
  Area,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
  ZAxis,
  Legend,
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

// ── Stacked area : phases de sommeil ─────────────────────────────────────
export function SleepStagesChart({
  data,
}: {
  data: { label: string; deep: number; rem: number; light: number }[];
}) {
  const fmt = (v: number) => `${Math.round(v)} min`;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid stroke={grid} vertical={false} />
        <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} minTickGap={24} />
        <YAxis tick={axis} tickLine={false} axisLine={false} width={40} tickFormatter={fmt} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
          formatter={(v, name) => [`${Math.round(Number(v))} min`, name]}
        />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
        <Area type="monotone" dataKey="deep" stackId="1" stroke="#6366f1" fill="#6366f1" fillOpacity={0.7} name="Profond" />
        <Area type="monotone" dataKey="rem" stackId="1" stroke="#a855f7" fill="#a855f7" fillOpacity={0.6} name="REM" />
        <Area type="monotone" dataKey="light" stackId="1" stroke="#93c5fd" fill="#93c5fd" fillOpacity={0.4} name="Leger" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Barres duree de sommeil + ligne efficacite ──────────────────────────
export function SleepDurationChart({
  data,
}: {
  data: { label: string; duration: number; efficiency: number | null }[];
}) {
  const fmtH = (v: number) => {
    const h = Math.floor(v / 60);
    const m = Math.round(v % 60);
    return `${h}h${String(m).padStart(2, "0")}`;
  };
  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid stroke={grid} vertical={false} />
        <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} minTickGap={24} />
        <YAxis yAxisId="left" tick={axis} tickLine={false} axisLine={false} width={48} tickFormatter={fmtH} />
        <YAxis yAxisId="right" orientation="right" tick={axis} tickLine={false} axisLine={false} width={40} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
          formatter={(v, name) => [
            name === "Efficacite" ? `${Math.round(Number(v))}%` : fmtH(Number(v)),
            name,
          ]}
        />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
        <ReferenceLine yAxisId="left" y={480} stroke="#22c55e" strokeDasharray="4 4" label={{ value: "8h", fontSize: 9, fill: "#22c55e", position: "right" }} />
        <Bar yAxisId="left" dataKey="duration" name="Duree" radius={[4, 4, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.duration >= 420 ? "#6366f1" : d.duration >= 360 ? "#f59e0b" : "#ef4444"} />
          ))}
        </Bar>
        <Line yAxisId="right" type="monotone" dataKey="efficiency" name="Efficacite" stroke="#10b981" strokeWidth={2} dot={false} connectNulls />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ── Barres horizontales : repartition moyenne des phases ─────────────────
export function SleepPhasesBar({
  deep,
  rem,
  light,
  total,
}: {
  deep: number;
  rem: number;
  light: number;
  total: number;
}) {
  if (total === 0) return null;
  const pct = (v: number) => Math.round((v / total) * 100);
  const fmtH = (v: number) => {
    const h = Math.floor(v / 60);
    const m = Math.round(v % 60);
    return `${h}h${String(m).padStart(2, "0")}`;
  };
  return (
    <div className="space-y-2">
      <div className="flex h-6 overflow-hidden rounded-full">
        <div className="bg-indigo-500" style={{ width: `${pct(deep)}%` }} title={`Profond ${pct(deep)}%`} />
        <div className="bg-purple-400" style={{ width: `${pct(rem)}%` }} title={`REM ${pct(rem)}%`} />
        <div className="bg-blue-300" style={{ width: `${pct(light)}%` }} title={`Leger ${pct(light)}%`} />
      </div>
      <div className="flex justify-between text-xs text-neutral-500">
        <span>Profond {fmtH(deep)} ({pct(deep)}%)</span>
        <span>REM {fmtH(rem)} ({pct(rem)}%)</span>
        <span>Leger {fmtH(light)} ({pct(light)}%)</span>
      </div>
    </div>
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
