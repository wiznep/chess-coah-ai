/**
 * api.js — Thin wrapper around the backend /analyze endpoint.
 */

const API_BASE = "/analyze";

/**
 * Send a PGN string to the backend for analysis.
 * @param {string} pgn  — The raw PGN text.
 * @param {number} [playerRating=1500] — Approximate player rating.
 * @returns {Promise<Object>} — The analysis payload.
 */
export async function analyzeGame(pgn, playerRating = 1500) {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pgn, player_rating: playerRating }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Server error ${res.status}`);
  }

  return res.json();
}
