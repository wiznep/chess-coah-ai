import { useState, useCallback, useEffect } from "react";
import PGNUploader from "./components/PGNUploader";
import Board from "./components/Board";
import FeedbackPanel from "./components/FeedbackPanel";
import MoveList from "./components/MoveList";
import { analyzeGame } from "./api";
import "./App.css";

function App() {
  const [analysis, setAnalysis] = useState(null); // full backend response
  const [currentPly, setCurrentPly] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ---- Analyze handler ----
  const handleAnalyze = useCallback(async (pgn) => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    setCurrentPly(0);
    try {
      const data = await analyzeGame(pgn);
      setAnalysis(data);
    } catch (err) {
      setError(err.message || "Analysis failed.");
    } finally {
      setLoading(false);
    }
  }, []);

  // ---- Keyboard navigation ----
  useEffect(() => {
    if (!analysis) return;
    const handler = (e) => {
      if (e.key === "ArrowRight") {
        setCurrentPly((p) => Math.min(analysis.moves.length, p + 1));
      } else if (e.key === "ArrowLeft") {
        setCurrentPly((p) => Math.max(0, p - 1));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [analysis]);

  const currentMove = analysis && currentPly > 0 ? analysis.moves[currentPly - 1] : null;

  // ---- Summary stats ----
  const stats = analysis
    ? {
        inaccuracies: analysis.moves.filter((m) => m.classification === "Inaccuracy").length,
        mistakes: analysis.moves.filter((m) => m.classification === "Mistake").length,
        blunders: analysis.moves.filter((m) => m.classification === "Blunder").length,
      }
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-950 text-white">
      {/* ---- Header ---- */}
      <header className="border-b border-gray-800 bg-gray-900/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <h1 className="text-xl font-bold tracking-tight">
            <span className="text-indigo-400">♟</span> AI Chess Coach
          </h1>
          
        </div>
      </header>

      {/* ---- Main layout ---- */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        {!analysis ? (
          /* ---------- Upload screen ---------- */
          <div className="mx-auto max-w-xl">
            <PGNUploader onAnalyze={handleAnalyze} loading={loading} />
            {error && (
              <p className="mt-4 rounded-lg bg-red-900/30 p-3 text-sm text-red-400">
                {error}
              </p>
            )}
          </div>
        ) : (
          /* ---------- Analysis screen ---------- */
          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            {/* Left: board */}
            <div className="flex flex-col gap-4">
              {/* Game info bar */}
              <div className="flex flex-wrap items-center gap-4 rounded-lg bg-gray-800/50 px-4 py-2 text-sm">
                <span>
                  <strong className="text-white">{analysis.white}</strong>{" "}
                  <span className="text-gray-500">vs</span>{" "}
                  <strong className="text-white">{analysis.black}</strong>
                </span>
                <span className="text-gray-500">|</span>
                <span className="text-gray-400">{analysis.result}</span>
                {stats && (
                  <>
                    <span className="text-gray-500">|</span>
                    <span className="text-yellow-400">{stats.inaccuracies} inaccuracies</span>
                    <span className="text-orange-400">{stats.mistakes} mistakes</span>
                    <span className="text-red-400">{stats.blunders} blunders</span>
                  </>
                )}
              </div>

              <Board
                moves={analysis.moves}
                currentPly={currentPly}
                onPlyChange={setCurrentPly}
              />
            </div>

            {/* Right: panel */}
            <div className="flex flex-col gap-4">
              <FeedbackPanel move={currentMove} gameInfo={analysis} />
              <MoveList
                moves={analysis.moves}
                currentPly={currentPly}
                onPlyChange={setCurrentPly}
              />
              <button
                onClick={() => {
                  setAnalysis(null);
                  setCurrentPly(0);
                }}
                className="rounded-lg border border-gray-700 px-4 py-2 text-sm
                           text-gray-400 hover:bg-gray-800 transition"
              >
                ← Analyze another game
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
