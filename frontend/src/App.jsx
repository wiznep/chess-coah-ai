import { useState } from "react";
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

const navLinks = [
  { to: "/", label: "Analyze"},
  { to: "/games", label: "My Games" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/puzzles", label: "Puzzles"},
];

function Sidebar() {
  const { username, logout } = useAuthStore();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`sticky top-0 flex h-screen flex-col border-r border-gray-800 bg-gray-900/80 backdrop-blur transition-all duration-300 ${
        collapsed ? "w-16" : "w-56"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 border-b border-gray-800 px-4 py-4">
        <span className="text-2xl text-indigo-400">♟</span>
        {!collapsed && (
          <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
            AI Chess Coach
          </span>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navLinks.map((l) => {
          const active = location.pathname === l.to;
          return (
            <Link
              key={l.to}
              to={l.to}
              title={l.label}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                active
                  ? "bg-indigo-600/20 text-indigo-400 font-semibold"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              <span className="text-lg leading-none">{l.icon}</span>
              {!collapsed && <span>{l.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section: user + collapse toggle */}
      <div className="border-t border-gray-800 px-3 py-3 space-y-2">
        {!collapsed && (
          <div className="flex items-center justify-between">
            <span className="truncate text-sm text-gray-400">{username}</span>
            <button
              onClick={logout}
              className="rounded border border-gray-700 px-2 py-0.5 text-xs text-gray-400
                         hover:bg-gray-800 hover:text-white transition"
            >
              Logout
            </button>
          </div>
        )}
       
      </div>
    </aside>
  );
}

function AppShell({ children }) {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-950 text-white">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-6 py-8">{children}</main>
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
