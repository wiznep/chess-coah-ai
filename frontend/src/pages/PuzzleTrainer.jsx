import { useState, useEffect, useMemo, useCallback } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { fetchPuzzles } from "../api";
import { Link } from "react-router-dom";

export default function PuzzleTrainer() {
  const [puzzles, setPuzzles] = useState([]);
  const [idx, setIdx] = useState(0);
  const [feedback, setFeedback] = useState(null); // "correct" | "wrong" | null
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPuzzles()
      .then((data) => {
        setPuzzles(data);
        setIdx(0);
        setFeedback(null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const puzzle = puzzles[idx] || null;

  // Build a Chess instance from the puzzle FEN
  const game = useMemo(() => {
    if (!puzzle) return null;
    try {
      return new Chess(puzzle.fen_before_mistake);
    } catch {
      return null;
    }
  }, [puzzle]);

  const boardOrientation = puzzle?.color_to_move === "black" ? "black" : "white";

  // Determine the expected best move in UCI format for comparison
  const expectedUci = puzzle?.best_move_uci || "";

  const handleDrop = useCallback(
    (sourceSquare, targetSquare, piece) => {
      if (!game || feedback === "correct") return false;

      // Attempt the move
      const moveAttempt = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q", // always promote to queen for simplicity
      });

      if (!moveAttempt) return false; // illegal move

      // Build UCI to compare
      const playedUci =
        sourceSquare + targetSquare + (moveAttempt.promotion || "");

      // Also check SAN match as fallback
      const playedSan = moveAttempt.san;

      if (playedUci === expectedUci || playedSan === puzzle.best_move) {
        setFeedback("correct");
        return true;
      } else {
        // Wrong move — undo it and snap piece back
        game.undo();
        setFeedback("wrong");
        // Auto-clear wrong feedback after a moment
        setTimeout(() => setFeedback(null), 1200);
        return false;
      }
    },
    [game, puzzle, expectedUci, feedback]
  );

  const goNext = () => {
    if (idx < puzzles.length - 1) {
      setIdx((i) => i + 1);
      setFeedback(null);
    }
  };

  const goPrev = () => {
    if (idx > 0) {
      setIdx((i) => i - 1);
      setFeedback(null);
    }
  };

  // --- Render ---
  if (loading)
    return <p className="text-gray-400 text-center py-20">Loading puzzles…</p>;
  if (error)
    return <p className="text-red-400 text-center py-20">{error}</p>;

  if (puzzles.length === 0)
    return (
      <div className="text-center py-20 text-gray-500">
        <p className="text-lg font-semibold text-gray-300 mb-2">
          No puzzles yet
        </p>
        <p>
          Analyze some games with mistakes and they'll appear here as puzzles.{" "}
          <Link to="/" className="text-indigo-400 hover:underline">
            Analyze a game
          </Link>
        </p>
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Puzzle Trainer</h2>
        <span className="text-sm text-gray-500">
          {idx + 1} / {puzzles.length}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left: board */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-full max-w-[560px] aspect-square">
            {game && (
              <Chessboard
                position={game.fen()}
                onPieceDrop={handleDrop}
                boardOrientation={boardOrientation}
                arePiecesDraggable={feedback !== "correct"}
                customDarkSquareStyle={{ backgroundColor: "#779952" }}
                customLightSquareStyle={{ backgroundColor: "#edeed1" }}
                boardWidth={560}
              />
            )}
          </div>

          {/* Nav buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={goPrev}
              disabled={idx === 0}
              className="rounded bg-gray-700 px-4 py-1.5 text-sm text-white
                         hover:bg-gray-600 disabled:opacity-30 transition"
            >
              ◀ Prev
            </button>
            <button
              onClick={goNext}
              disabled={idx >= puzzles.length - 1}
              className="rounded bg-gray-700 px-4 py-1.5 text-sm text-white
                         hover:bg-gray-600 disabled:opacity-30 transition"
            >
              Next ▶
            </button>
          </div>
        </div>

        {/* Right: puzzle info */}
        <div className="flex flex-col gap-4">
          {/* Prompt */}
          <div className="rounded-xl border border-gray-700 bg-gray-800/60 p-5">
            <p className="text-sm text-gray-400 mb-2">
              <span className="font-semibold text-white capitalize">
                {puzzle.color_to_move}
              </span>{" "}
              to move
            </p>
            <p className="text-sm text-gray-300">
              You played{" "}
              <span className="font-bold text-red-400">
                {puzzle.played_move}
              </span>{" "}
              here — that was a{" "}
              <span
                className={
                  puzzle.classification === "Blunder"
                    ? "text-red-400 font-bold"
                    : "text-orange-400 font-bold"
                }
              >
                {puzzle.classification}
              </span>
              .
            </p>
            <p className="mt-2 text-sm font-semibold text-indigo-400">
              Can you find the best move?
            </p>
          </div>

          {/* Feedback */}
          {feedback === "correct" && (
            <div className="rounded-xl border border-green-700 bg-green-900/30 p-5 space-y-3">
              <p className="text-lg font-bold text-green-400">
                Correct!
              </p>
              <p className="text-sm text-gray-300">
                The best move was{" "}
                <span className="font-bold text-green-400">
                  {puzzle.best_move}
                </span>
                .
              </p>
              {puzzle.coach_explanation && (
                <div className="rounded-lg border border-indigo-800/40 bg-indigo-950/30 p-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-indigo-400">
                    Coach says
                  </p>
                  <p className="text-sm leading-relaxed text-gray-200">
                    {puzzle.coach_explanation}
                  </p>
                </div>
              )}
              {idx < puzzles.length - 1 && (
                <button
                  onClick={goNext}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold
                             text-white hover:bg-indigo-500 transition"
                >
                  Next Puzzle →
                </button>
              )}
            </div>
          )}

          {feedback === "wrong" && (
            <div className="rounded-xl border border-orange-700 bg-orange-900/20 p-5">
              <p className="text-sm font-semibold text-orange-400">
                Not quite — try again!
              </p>
            </div>
          )}

          {!feedback && (
            <div className="rounded-xl border border-gray-700 bg-gray-800/40 p-5 text-sm text-gray-500">
              Drag a piece to make your move.
            </div>
          )}

          {/* Eval drop badge */}
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span
              className={`rounded-full border px-3 py-0.5 font-semibold ${
                puzzle.classification === "Blunder"
                  ? "bg-red-600/20 text-red-400 border-red-700"
                  : "bg-orange-600/20 text-orange-400 border-orange-700"
              }`}
            >
              {puzzle.classification}
            </span>
            <span>Eval drop: {puzzle.eval_drop.toFixed(1)} pawns</span>
          </div>
        </div>
      </div>
    </div>
  );
}
