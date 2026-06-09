"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";

const axis = { fontSize: 11, stroke: "#9ca3af" };

export function InjuryPainChart({
  data,
}: {
  data: { label: string; intensite: number; note: string | null; activities: string }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid stroke="#e5e7eb33" vertical={false} />
        <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} />
        <YAxis tick={axis} tickLine={false} axisLine={false} domain={[0, 10]} width={30} />
        <Tooltip
          contentStyle={{ fontSize: 11, borderRadius: 8 }}
          formatter={(_v, _n, p) => {
            const d = p?.payload as { intensite: number; activities: string; note: string | null } | undefined;
            if (!d) return [String(_v), "Douleur"];
            const parts = [`${d.intensite}/10`];
            if (d.activities) parts.push(d.activities);
            if (d.note) parts.push(d.note);
            return [parts.join(" | "), "Douleur"];
          }}
        />
        <ReferenceLine y={3} stroke="#22c55e" strokeDasharray="3 3" />
        <ReferenceLine y={7} stroke="#ef4444" strokeDasharray="3 3" />
        <Line
          type="monotone"
          dataKey="intensite"
          stroke="#ef4444"
          strokeWidth={2}
          dot={{ r: 4, fill: "#ef4444" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
