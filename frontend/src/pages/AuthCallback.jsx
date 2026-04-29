import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Loader2 } from "lucide-react";

// Handles redirect from Emergent OAuth: URL contains #session_id=...
// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
export default function AuthCallback() {
  const nav = useNavigate();
  const { setUserFromGoogle } = useAuth();
  const [error, setError] = useState(null);
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const hash = window.location.hash || "";
    const m = hash.match(/session_id=([^&]+)/);
    if (!m) { nav("/login", { replace: true }); return; }
    const sessionId = decodeURIComponent(m[1]);

    (async () => {
      try {
        const r = await api.post("/auth/google-session", { session_id: sessionId });
        const u = r.data.user;
        // Store the session token like JWT for Bearer auth (cookies also set by backend)
        localStorage.setItem("lhc_token", r.data.token);
        localStorage.setItem("lhc_user", JSON.stringify(u));
        setUserFromGoogle?.(u);
        // Clear hash so reload doesn't re-process
        window.history.replaceState(null, "", window.location.pathname);
        if (!u.role) {
          nav("/onboarding/role", { replace: true });
        } else {
          nav(u.role === "parent" ? "/parent/dashboard" : "/adult/dashboard", { replace: true });
        }
      } catch (e) {
        setError(e?.response?.data?.detail || "Sign-in failed");
      }
    })();
  }, [nav, setUserFromGoogle]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
      <div className="text-center">
        <Loader2 className="mx-auto animate-spin mb-3" size={28} />
        <p className="text-sm text-[var(--text-2)]">{error ? error : "Signing you in with Google…"}</p>
      </div>
    </div>
  );
}
