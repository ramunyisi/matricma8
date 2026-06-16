"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type ProgressPoint = {
  name: string;
  mark: number;
  target: number;
};

export function ProgressChart({ data }: { data: ProgressPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Area type="monotone" dataKey="target" stroke="#f2b84b" fill="#f2b84b" fillOpacity={0.18} />
        <Area type="monotone" dataKey="mark" stroke="#1f8a70" fill="#1f8a70" fillOpacity={0.28} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
