"use client";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface HolderData {
  name: string;
  value: number;
  color: string;
}

interface Props {
  holders: HolderData[];
}

export default function HolderDonut({ holders }: Props) {
  return (
    <div style={{ width: "100%", height: 200 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={holders}
            innerRadius={55}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            animationDuration={800}
          >
            {holders.map((h, i) => (
              <Cell key={i} fill={h.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "#111113",
              border: "1px solid #1e1e22",
              borderRadius: 8,
              fontSize: 12,
              color: "#fafafa",
            }}
            formatter={(val) => [`${Number(val).toFixed(2)}%`, "Share"]}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
