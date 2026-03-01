import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchGames } from "../api";

export default function GameLibrary() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGames()
      .then(setGames)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return <p className="text-gray-400 text-center py-20">Loading games…</p>;
  if (error)
    return <p className="text-red-400 text-center py-20">{error}</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">My Games</h2>

      {games.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-lg font-semibold text-gray-300 mb-2">
            No games yet
          </p>
          <p>
            Go to{" "}
            <Link to="/" className="text-indigo-400 hover:underline">
              Analyze
            </Link>{" "}
            to upload your first PGN.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-700 bg-gray-800/50">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-700 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">White</th>
                <th className="px-4 py-3">Black</th>
                <th className="px-4 py-3">Result</th>
                <th className="px-4 py-3 text-center text-yellow-400">?!</th>
                <th className="px-4 py-3 text-center text-orange-400">?</th>
                <th className="px-4 py-3 text-center text-red-400">??</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {games.map((g, idx) => {
                const s = g.analysis_summary || {};
                return (
                  <tr
                    key={g.id}
                    className="border-b border-gray-800 hover:bg-gray-700/30 transition"
                  >
                    <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-white">
                      {g.white_player}
                    </td>
                    <td className="px-4 py-3 font-medium text-white">
                      {g.black_player}
                    </td>
                    <td className="px-4 py-3 text-gray-400">{g.result}</td>
                    <td className="px-4 py-3 text-center text-yellow-400">
                      {s.inaccuracies ?? 0}
                    </td>
                    <td className="px-4 py-3 text-center text-orange-400">
                      {s.mistakes ?? 0}
                    </td>
                    <td className="px-4 py-3 text-center text-red-400">
                      {s.blunders ?? 0}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {g.created_at
                        ? new Date(g.created_at).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/games/${g.id}`}
                        className="rounded bg-indigo-600/20 px-3 py-1 text-xs font-semibold
                                   text-indigo-400 hover:bg-indigo-600/40 transition"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
