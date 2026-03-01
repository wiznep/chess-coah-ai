/**
 * store/authStore.js — Zustand store for authentication state.
 *
 * Persists the JWT token + username in localStorage so the user stays
 * logged in across page reloads.
 */
import { create } from "zustand";

const useAuthStore = create((set) => ({
  token: localStorage.getItem("token") || null,
  username: localStorage.getItem("username") || null,

  /** Save token after login / register */
  login: (token, username) => {
    localStorage.setItem("token", token);
    localStorage.setItem("username", username);
    set({ token, username });
  },

  /** Clear everything on logout */
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    set({ token: null, username: null });
  },
}));

export default useAuthStore;
