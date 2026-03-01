import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import useAuthStore from "../store/authStore";
import { loginUser } from "../api";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await loginUser(username, password);
      login(data.access_token, data.username);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-gray-900 to-slate-950">
      <div className="w-full max-w-sm rounded-2xl border border-gray-700 bg-gray-800/70 p-8 shadow-xl">
        <h2 className="mb-6 text-center text-2xl font-bold text-white">
          <span className="text-indigo-400">♟</span> Sign In
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="rounded-lg border border-gray-600 bg-gray-900 px-4 py-2.5 text-sm
                       text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="rounded-lg border border-gray-600 bg-gray-900 px-4 py-2.5 text-sm
                       text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
          />

          {error && (
            <p className="rounded bg-red-900/30 p-2 text-xs text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white
                       hover:bg-indigo-500 disabled:opacity-40 transition"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-400">
          Don't have an account?{" "}
          <Link to="/register" className="text-indigo-400 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
