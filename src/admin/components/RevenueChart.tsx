import { useEffect, useState } from "react";
import { getRevenueChart, type RevenueRange } from "../../lib/dashboardCharts";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const RANGES: { value: RevenueRange; label: string }[] = [
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "3m", label: "3M" },
  { value: "6m", label: "6M" },
  { value: "1y", label: "1Y" },
];

export function RevenueChart() {
  const [data, setData] = useState<any[]>([]);
  const [range, setRange] = useState<RevenueRange>("30d");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChart();
  }, [range]);

  async function loadChart() {
    setLoading(true);
    const revenue = await getRevenueChart(range);
    setData(revenue);
    setLoading(false);
  }

  return (
    <div className="bg-white rounded-xl shadow p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold">Paid Revenue</h2>

        <div className="flex bg-gray-100 rounded-lg p-1">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${
                range === r.value
                  ? "bg-white shadow text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ width: "100%", height: 300 }} className="min-w-0">
        {loading ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            Loading...
          </div>
        ) : data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400 text-center px-4">
            No paid orders in this period
          </div>
        ) : (
          <ResponsiveContainer>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} width={50} />
              <Tooltip
              formatter={(v) => [Number(v).toLocaleString("en-IN"), "Revenue"]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#2563eb"
                strokeWidth={3}
                fill="#2563eb"
                fillOpacity={0.12}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}