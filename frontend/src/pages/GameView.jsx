import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchGame } from "../api";
import AnalyzePage from "./AnalyzePage";

/**
 * GameView — Loads a specific saved game from the DB and renders
 * the analysis view pre-populated (no re-analysis needed).
 */
export default function GameView() {
  const { gameId } = useParams();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetchGame(gameId)
      .then(setGame)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [gameId]);

  if (loading)
    return <p className="text-gray-400 text-center py-20">Loading game…</p>;
  if (error)
    return <p className="text-red-400 text-center py-20">{error}</p>;
  if (!game)
    return <p className="text-gray-500 text-center py-20">Game not found.</p>;

  // Build an analysis-shaped object the AnalyzePage can render directly
  const analysisData = {
    white: game.white_player,
    black: game.black_player,
    white_player: game.white_player,
    black_player: game.black_player,
    result: game.result,
    moves: game.moves,
  };

  return (
    <div className="space-y-4">
      <Link
        to="/games"
        className="inline-block text-sm text-gray-400 hover:text-white transition"
      >
        ← Back to My Games
      </Link>
      <AnalyzePage preloaded={analysisData} />
    </div>
  );
}
