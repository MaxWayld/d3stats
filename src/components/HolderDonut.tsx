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
    <div>
      <div style={{ width: "100%", height: 180 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={holders}
              innerRadius={50}
              outerRadius={75}
              paddingAngle={2}
              dataKey="value"
              animationDuration={800}
            >
              {holders.map((h) => (
                <Cell key={h.name} fill={h.color} />
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

      {/* Legend */}
      <div className="mt-3 space-y-1.5">
        {holders.map((h) => (
          <div key={h.name} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: h.color }}
            />
            <span className="text-[12px] text-text-secondary truncate flex-1">
              {h.name}
            </span>
            <span className="text-[12px] num text-text-muted shrink-0">
              {h.value.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
