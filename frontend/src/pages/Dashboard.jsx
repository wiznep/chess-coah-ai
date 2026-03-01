import { useState, useEffect } from "react";
import { fetchAnalytics } from "../api";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const PIE_COLORS = {
  Inaccuracies: "#facc15", // yellow-400
  Mistakes: "#fb923c",     // orange-400
  Blunders: "#f87171",     // red-400
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return <p className="text-gray-400 text-center py-20">Loading analytics…</p>;
  if (error)
    return <p className="text-red-400 text-center py-20">{error}</p>;
  if (!data || data.total_games === 0)
    return (
      <div className="text-center py-20 text-gray-500">
        <p className="text-lg font-semibold text-gray-300 mb-2">No data yet</p>
        <p>Analyze some games first and your stats will appear here.</p>
      </div>
    );

  // --- Pie chart data ---
  const pieData = [
    { name: "Inaccuracies", value: data.inaccuracies },
    { name: "Mistakes", value: data.mistakes },
    { name: "Blunders", value: data.blunders },
  ].filter((d) => d.value > 0);

  // --- Bar chart data (per game) ---
  const barData = (data.games_over_time || []).map((g, i) => ({
    name: `Game ${i + 1}`,
    Inaccuracies: g.inaccuracies,
    Mistakes: g.mistakes,
    Blunders: g.blunders,
  }));

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Dashboard</h2>

      {/* ---- Summary cards ---- */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Games Analyzed" value={data.total_games} color="text-indigo-400" />
        <StatCard label="Inaccuracies" value={data.inaccuracies} color="text-yellow-400" />
        <StatCard label="Mistakes" value={data.mistakes} color="text-orange-400" />
        <StatCard label="Blunders" value={data.blunders} color="text-red-400" />
      </div>

      {/* ---- Charts ---- */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pie chart */}
        <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
            Error Profile
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                {pieData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={PIE_COLORS[entry.name]}
                    stroke="transparent"
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "0.5rem",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar chart — per game breakdown */}
        {barData.length > 0 && (
          <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
              Errors Per Game
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData}>
                <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fill: "#9ca3af", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "0.5rem",
                  }}
                />
                <Legend />
                <Bar dataKey="Inaccuracies" fill="#facc15" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Mistakes" fill="#fb923c" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Blunders" fill="#f87171" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800/50 px-5 py-4">
      <p className="text-xs uppercase tracking-wider text-gray-500">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
