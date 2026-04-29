import React, { useState } from "react";
import { api } from "../lib/api";
import AIDisclaimer from "./AIDisclaimer";
import { Sparkles, Loader2 } from "lucide-react";

export default function AIQA({ profile, contextType, healthScore = null, placeholder = "Ask a health question…", anonymous = false, testIdPrefix = "ai" }) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState(null);
  const [error, setError] = useState(null);

  const ask = async (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true); setAnswer(null); setError(null);
    try {
      const r = await api.post("/ai/ask", {
        question: q,
        profile_id: profile?.id,
        age: profile?.age ?? 18,
        gender: profile?.gender ?? "other",
        stage: profile?.stage ?? "adult",
        context_type: contextType,
        health_score: healthScore,
      });
      setAnswer(r.data.answer);
      setQ("");
    } catch (err) {
      setError(err?.response?.data?.detail || "Could not get an answer. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <AIDisclaimer />
      <form onSubmit={ask} className="space-y-3">
        <textarea
          data-testid={`${testIdPrefix}-question-input`}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          rows={3}
          placeholder={placeholder}
          className="w-full rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30"
        />
        <div className="flex items-center justify-between">
          {anonymous && <span className="text-xs text-[var(--text-2)]">Your question is private. Parents cannot see it.</span>}
          <button
            type="submit"
            disabled={loading || !q.trim()}
            data-testid={`${testIdPrefix}-ask-btn`}
            className="ml-auto inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            style={{ background: "var(--brand)" }}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {loading ? "Asking…" : "Ask AI"}
          </button>
        </div>
      </form>
      {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">{error}</div>}
      {answer && (
        <div data-testid={`${testIdPrefix}-answer`} className="anim-fade-up rounded-lg bg-white border border-[var(--border)] p-5">
          <div className="text-xs uppercase tracking-wider text-[var(--text-2)] mb-2">AI response</div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{answer}</p>
        </div>
      )}
    </div>
  );
}
