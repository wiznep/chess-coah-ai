import React, { useMemo } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";

/**
 * Board — Renders a react-chessboard driven by the list of moves + a
 * currentPly index.  Includes Previous / Next navigation buttons.
 */
export default function Board({ moves, currentPly, onPlyChange }) {
  // Replay moves up to currentPly to compute the board FEN.
  const fen = useMemo(() => {
    const game = new Chess();
    for (let i = 0; i < currentPly; i++) {
      try {
        game.move(moves[i].move_san);
      } catch {
        break; // stop if something is wrong
      }
    }
    return game.fen();
  }, [moves, currentPly]);

  // Determine which squares to highlight (last move).
  const lastMove = currentPly > 0 ? moves[currentPly - 1] : null;
  const customSquareStyles = {};
  if (lastMove) {
    const uci = lastMove.move_uci;
    const from = uci.slice(0, 2);
    const to = uci.slice(2, 4);
    customSquareStyles[from] = { background: "rgba(255,255,0,0.35)" };
    customSquareStyles[to] = { background: "rgba(255,255,0,0.35)" };
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-full max-w-[560px] aspect-square">
        <Chessboard
          options={{
            position: fen,
            allowDragging: false,
            squareStyles: customSquareStyles,
            darkSquareStyle: { backgroundColor: "#779952" },
            lightSquareStyle: { backgroundColor: "#edeed1" },
          }}
        />
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPlyChange(0)}
          disabled={currentPly === 0}
          className="rounded bg-gray-700 px-3 py-1.5 text-sm text-white
                     hover:bg-gray-600 disabled:opacity-30 transition"
          title="Go to start"
        >
          ⏮
        </button>
        <button
          onClick={() => onPlyChange(Math.max(0, currentPly - 1))}
          disabled={currentPly === 0}
          className="rounded bg-gray-700 px-4 py-1.5 text-sm text-white
                     hover:bg-gray-600 disabled:opacity-30 transition"
        >
          ◀ Prev
        </button>
        <span className="min-w-[80px] text-center text-sm text-gray-400">
          {currentPly} / {moves.length}
        </span>
        <button
          onClick={() => onPlyChange(Math.min(moves.length, currentPly + 1))}
          disabled={currentPly >= moves.length}
          className="rounded bg-gray-700 px-4 py-1.5 text-sm text-white
                     hover:bg-gray-600 disabled:opacity-30 transition"
        >
          Next ▶
        </button>
        <button
          onClick={() => onPlyChange(moves.length)}
          disabled={currentPly >= moves.length}
          className="rounded bg-gray-700 px-3 py-1.5 text-sm text-white
                     hover:bg-gray-600 disabled:opacity-30 transition"
          title="Go to end"
        >
          ⏭
        </button>
      </div>
    </div>
  );
}
