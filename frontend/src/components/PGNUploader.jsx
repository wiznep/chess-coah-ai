import React, { useState } from "react";

/**
 * PGNUploader — A text area + button that lets the user paste a PGN and
 * trigger analysis.  Shows a spinner while the backend is working.
 */
export default function PGNUploader({ onAnalyze, loading }) {
  const [pgn, setPgn] = useState("");

  const samplePGN = `[Event "Casual Game"]
[Site "Internet"]
[Date "2025.01.15"]
[White "Player1"]
[Black "Player2"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6
8. c3 O-O 9. h3 Nb8 10. d4 Nbd7 11. Nbd2 Bb7 12. Bc2 Re8 13. Nf1 Bf8
14. Ng3 g6 15. Bg5 h6 16. Bd2 Bg7 17. a4 c5 18. d5 c4 19. b4 Nh5
20. Nxh5 gxh5 21. Bh6 Nf6 22. Bxg7 Kxg7 23. Nh4 Rh8 24. Qf3 Qe7
25. Qxf6+ Qxf6 26. Nf5+ Kg6 27. Nxd6 Bc8 28. Nxe8 Qd8 29. Nxc7 Qxc7
30. axb5 axb5 31. Rxa8 Bxh3 32. gxh3 Qc5 33. Ra7 Qd6 1-0`;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pgn.trim()) onAnalyze(pgn.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label
        htmlFor="pgn-input"
        className="text-sm font-semibold text-gray-300 uppercase tracking-wide"
      >
        Paste your PGN
      </label>

      <textarea
        id="pgn-input"
        rows={10}
        value={pgn}
        onChange={(e) => setPgn(e.target.value)}
        placeholder={`Paste a PGN here…\n\nExample:\n1. e4 e5 2. Nf3 Nc6 …`}
        className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-sm
                   text-gray-100 placeholder-gray-500 focus:border-indigo-500
                   focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono resize-y"
      />

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading || !pgn.trim()}
          className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold
                     text-white shadow hover:bg-indigo-500 disabled:opacity-40
                     disabled:cursor-not-allowed transition"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              {/* simple CSS spinner */}
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
              Analyzing…
            </span>
          ) : (
            "Analyze Game"
          )}
        </button>

        <button
          type="button"
          onClick={() => setPgn(samplePGN)}
          className="rounded-lg border border-gray-600 px-4 py-2.5 text-sm
                     text-gray-300 hover:bg-gray-700 transition"
        >
          Load Sample
        </button>
      </div>
    </form>
  );
}
