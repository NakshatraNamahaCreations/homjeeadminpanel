// src/utils/auth.js
const KEY = "adminAuth";

export const setAuth = (payload) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(payload));
  } catch {}
};

export const getAuth = () => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const clearAuth = () => {
  try {
    localStorage.removeItem(KEY);
  } catch {}
};

export const isAuthed = () => !!getAuth();
