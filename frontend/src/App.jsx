import { Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import useAuthStore from "./store/authStore";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AnalyzePage from "./pages/AnalyzePage";
import Dashboard from "./pages/Dashboard";
import GameLibrary from "./pages/GameLibrary";
import GameView from "./pages/GameView";
import PuzzleTrainer from "./pages/PuzzleTrainer";
import "./App.css";

/** Redirect to /login if not authenticated */
function ProtectedRoute({ children }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function Navbar() {
  const { username, logout } = useAuthStore();
  const location = useLocation();

  const links = [
    { to: "/", label: "Analyze" },
    { to: "/games", label: "My Games" },
    { to: "/dashboard", label: "Dashboard" },
    { to: "/puzzles", label: "Puzzle Trainer" },
  ];

  return (
    <header className="border-b border-gray-800 bg-gray-900/70 backdrop-blur sticky top-0 z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-xl font-bold tracking-tight text-white">
            <span className="text-indigo-400">♟</span> AI Chess Coach
          </Link>

          <nav className="hidden sm:flex items-center gap-1">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`rounded-lg px-3 py-1.5 text-sm transition ${
                  location.pathname === l.to
                    ? "bg-indigo-600/20 text-indigo-400 font-semibold"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">{username}</span>
          <button
            onClick={logout}
            className="rounded-lg border border-gray-700 px-3 py-1 text-xs text-gray-400
                       hover:bg-gray-800 hover:text-white transition"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

function AppShell({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-950 text-white">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppShell><AnalyzePage /></AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/games"
        element={
          <ProtectedRoute>
            <AppShell><GameLibrary /></AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/games/:gameId"
        element={
          <ProtectedRoute>
            <AppShell><GameView /></AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppShell><Dashboard /></AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/puzzles"
        element={
          <ProtectedRoute>
            <AppShell><PuzzleTrainer /></AppShell>
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
