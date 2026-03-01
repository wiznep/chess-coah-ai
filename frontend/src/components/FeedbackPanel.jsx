import React from "react";

/**
 * FeedbackPanel — Shows the evaluation bar, move classification badge,
 * and the AI coach's explanation for the currently viewed move.
 */
export default function FeedbackPanel({ move, gameInfo }) {
  if (!move) {
    return (
      <div className="rounded-xl border border-gray-700 bg-gray-800/60 p-5 text-gray-400 text-sm">
        Step through the moves to see analysis here.
      </div>
    );
  }

  const evalPawns = (move.eval_after_cp / 100).toFixed(2);
  const evalDisplay = move.eval_after_cp >= 0 ? `+${evalPawns}` : evalPawns;

  // Badge colours per classification
  const badgeMap = {
    Best: "bg-green-600/20 text-green-400 border-green-700",
    Inaccuracy: "bg-yellow-600/20 text-yellow-400 border-yellow-700",
    Mistake: "bg-orange-600/20 text-orange-400 border-orange-700",
    Blunder: "bg-red-600/20 text-red-400 border-red-700",
  };
  const badge = badgeMap[move.classification] || badgeMap.Best;

  // Visual eval bar (clamped to ±10)
  const clampedEval = Math.max(-10, Math.min(10, move.eval_after_cp / 100));
  const barPercent = ((clampedEval + 10) / 20) * 100;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-gray-700 bg-gray-800/60 p-5">
      {/* ---- Header: move + badge ---- */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-white">
            {move.ply % 2 === 0
              ? `${Math.floor(move.ply / 2) + 1}. ${move.move_san}`
              : `${Math.floor(move.ply / 2) + 1}… ${move.move_san}`}
          </span>
          <span className="text-xs text-gray-500 uppercase">{move.side}</span>
        </div>
        <span
          className={`rounded-full border px-3 py-0.5 text-xs font-semibold ${badge}`}
        >
          {move.classification}
        </span>
      </div>

      {/* ---- Eval bar ---- */}
      <div className="flex items-center gap-3">
        <span className="w-16 text-right font-mono text-sm text-gray-200">
          {evalDisplay}
        </span>
        <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-gray-700">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-gray-100 to-white transition-all duration-300"
            style={{ width: `${barPercent}%` }}
          />
          {/* centre tick */}
          <div className="absolute inset-y-0 left-1/2 w-px bg-gray-500" />
        </div>
      </div>

      {/* ---- Best move ---- */}
      {move.best_move_san && move.classification !== "Best" && (
        <p className="text-sm text-gray-400">
          Engine preferred:{" "}
          <span className="font-semibold text-indigo-400">
            {move.best_move_san}
          </span>
        </p>
      )}

      {/* ---- Hanging piece tag ---- */}
      {move.is_capture_next && (
        <span className="inline-flex w-fit items-center gap-1 rounded bg-red-900/30 px-2 py-0.5 text-xs text-red-400">
          ⚠ Possible hanging piece
        </span>
      )}

      {/* ---- Coach explanation ---- */}
      {move.coach_explanation && (
        <div className="rounded-lg border border-indigo-800/40 bg-indigo-950/30 p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-indigo-400">
            Coach says
          </p>
          <p className="text-sm leading-relaxed text-gray-200">
            {move.coach_explanation}
          </p>
        </div>
      )}
    </div>
  );
}
