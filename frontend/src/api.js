/**
 * api.js — HTTP client for all backend endpoints.
 *
 * Every authenticated request reads the JWT from localStorage and attaches
 * it as a Bearer token. If a 401 is returned the token is cleared.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse(res) {
  if (res.status === 401) {
    // Token expired / invalid → force logout
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    window.location.href = "/login";
    throw new Error("Session expired — please log in again.");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Server error ${res.status}`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export async function registerUser(username, password) {
  const res = await fetch("/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return handleResponse(res);
}

export async function loginUser(username, password) {
  // OAuth2PasswordRequestForm expects form-encoded data
  const params = new URLSearchParams();
  params.append("username", username);
  params.append("password", password);

  const res = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  return handleResponse(res);
}

// ---------------------------------------------------------------------------
// Analysis
// ---------------------------------------------------------------------------
export async function analyzeGame(pgn, playerRating = 1500) {
  const res = await fetch("/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ pgn, player_rating: playerRating }),
  });
  return handleResponse(res);
}

// ---------------------------------------------------------------------------
// Game library
// ---------------------------------------------------------------------------
export async function fetchGames() {
  const res = await fetch("/games", { headers: authHeaders() });
  return handleResponse(res);
}

export async function fetchGame(gameId) {
  const res = await fetch(`/games/${gameId}`, { headers: authHeaders() });
  return handleResponse(res);
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------
export async function fetchAnalytics() {
  const res = await fetch("/analytics", { headers: authHeaders() });
  return handleResponse(res);
}

// ---------------------------------------------------------------------------
// Puzzles
// ---------------------------------------------------------------------------
export async function fetchPuzzles() {
  const res = await fetch("/puzzles", { headers: authHeaders() });
  return handleResponse(res);
}

