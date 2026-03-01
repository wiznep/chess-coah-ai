import React from "react";

/**
 * MoveList — Scrollable list of all game moves with colour-coded
 * classification. Clicking a move jumps the board to that position.
 */
export default function MoveList({ moves, currentPly, onPlyChange }) {
  // Group half-moves into full-move pairs.
  const rows = [];
  for (let i = 0; i < moves.length; i += 2) {
    rows.push({
      number: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1] || null,
    });
  }

  const classColor = {
    Best: "text-gray-200",
    Inaccuracy: "text-yellow-400",
    Mistake: "text-orange-400",
    Blunder: "text-red-400 font-bold",
  };

  const bgHighlight = "bg-indigo-600/30";

  return (
    <div className="max-h-[360px] overflow-y-auto rounded-lg border border-gray-700 bg-gray-800/40 text-sm">
      <table className="w-full table-fixed">
        <thead className="sticky top-0 bg-gray-800">
          <tr className="text-xs text-gray-500 uppercase">
            <th className="w-10 py-1 text-center">#</th>
            <th className="py-1 pl-2 text-left">White</th>
            <th className="py-1 pl-2 text-left">Black</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.number} className="border-t border-gray-800">
              <td className="py-1 text-center text-gray-500">{row.number}</td>
              {/* White move */}
              <td
                className={`cursor-pointer py-1 pl-2 ${
                  classColor[row.white.classification]
                } ${row.white.ply + 1 === currentPly ? bgHighlight : ""} hover:bg-gray-700/50 rounded`}
                onClick={() => onPlyChange(row.white.ply + 1)}
              >
                {row.white.move_san}
                {row.white.classification !== "Best" && (
                  <span className="ml-1 text-[10px] opacity-70">
                    {row.white.classification === "Inaccuracy"
                      ? "?!"
                      : row.white.classification === "Mistake"
                        ? "?"
                        : "??"}
                  </span>
                )}
              </td>
              {/* Black move */}
              <td
                className={`cursor-pointer py-1 pl-2 ${
                  row.black
                    ? classColor[row.black.classification]
                    : "text-gray-600"
                } ${
                  row.black && row.black.ply + 1 === currentPly
                    ? bgHighlight
                    : ""
                } hover:bg-gray-700/50 rounded`}
                onClick={() =>
                  row.black && onPlyChange(row.black.ply + 1)
                }
              >
                {row.black ? row.black.move_san : ""}
                {row.black &&
                  row.black.classification !== "Best" && (
                    <span className="ml-1 text-[10px] opacity-70">
                      {row.black.classification === "Inaccuracy"
                        ? "?!"
                        : row.black.classification === "Mistake"
                          ? "?"
                          : "??"}
                    </span>
                  )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
