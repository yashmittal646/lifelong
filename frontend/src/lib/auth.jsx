import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("lhc_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const r = await api.get("/auth/me");
      setUser(r.data);
      localStorage.setItem("lhc_user", JSON.stringify(r.data));
      return r.data;
    } catch {
      localStorage.removeItem("lhc_token");
      localStorage.removeItem("lhc_user");
      setUser(null);
      return null;
    }
  };

  useEffect(() => {
    // If returning from OAuth callback, skip (AuthCallback will set the user)
    if (window.location.hash?.includes("session_id=")) {
      setLoading(false);
      return;
    }
    const t = localStorage.getItem("lhc_token");
    if (!t) { setLoading(false); return; }
    fetchMe().finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const r = await api.post("/auth/login", { email, password });
    localStorage.setItem("lhc_token", r.data.token);
    localStorage.setItem("lhc_user", JSON.stringify(r.data.user));
    setUser(r.data.user);
    return r.data.user;
  };
  const signup = async (payload) => {
    const r = await api.post("/auth/signup", payload);
    localStorage.setItem("lhc_token", r.data.token);
    localStorage.setItem("lhc_user", JSON.stringify(r.data.user));
    setUser(r.data.user);
    return r.data.user;
  };
  const logout = async () => {
    try { await api.post("/auth/logout"); } catch (_) { /* ignore */ }
    localStorage.removeItem("lhc_token");
    localStorage.removeItem("lhc_user");
    setUser(null);
  };
  const setUserFromGoogle = (u) => { setUser(u); };

  return (
    <AuthCtx.Provider value={{ user, login, signup, logout, loading, refresh: fetchMe, setUserFromGoogle }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
