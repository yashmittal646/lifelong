import React, { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../lib/api";
import { ArrowRight, ArrowLeft, KeyRound, HeartPulse } from "lucide-react";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const nav = useNavigate();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setErr(null);
    if (pw.length < 6) { setErr("Password must be at least 6 characters."); return; }
    if (pw !== pw2) { setErr("Passwords do not match."); return; }
    if (!token) { setErr("Reset token missing — please use the link from your email."); return; }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, new_password: pw });
      toast.success("Password updated. Please log in with your new password.");
      nav("/login", { replace: true });
    } catch (e) {
      setErr(e?.response?.data?.detail || "Could not reset password.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg)] relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-20 w-[420px] h-[420px] rounded-full opacity-30 blur-3xl" style={{ background: "radial-gradient(circle, #E07A5F 0%, transparent 70%)" }} />
        <div className="absolute -bottom-40 -right-20 w-[520px] h-[520px] rounded-full opacity-25 blur-3xl" style={{ background: "radial-gradient(circle, #2A5948 0%, transparent 70%)" }} />
      </div>

      <form onSubmit={submit} data-testid="reset-form" className="w-full max-w-md bg-white border border-[var(--border)] rounded-3xl p-8 shadow-[0_30px_60px_-20px_rgba(26,46,36,0.18)] anim-fade-up space-y-5">
        <Link to="/login" className="inline-flex items-center gap-2.5 mb-1">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "var(--brand)" }}>
            <HeartPulse className="text-white" size={18} />
          </div>
          <div>
            <div className="font-display text-base font-bold leading-tight">Lifelong Health</div>
            <div className="text-[10px] tracking-[0.22em] uppercase text-[var(--text-2)]">Companion · India</div>
          </div>
        </Link>
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-[#5C7063]"><KeyRound size={12} /> Reset password</div>
          <h2 className="font-display text-3xl font-bold mt-1.5">Choose a new password</h2>
          <p className="text-sm text-[var(--text-2)] mt-1.5">It must be at least 6 characters. After saving, you'll need to log in again on every device.</p>
        </div>
        <div>
          <label className="text-xs font-semibold tracking-wide text-[#5C7063]">NEW PASSWORD</label>
          <input data-testid="reset-new-pw" type="password" required minLength={6} value={pw} onChange={e => setPw(e.target.value)} placeholder="At least 6 characters"
            className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[#FDFBF7] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2A5948]/25" />
        </div>
        <div>
          <label className="text-xs font-semibold tracking-wide text-[#5C7063]">CONFIRM PASSWORD</label>
          <input data-testid="reset-confirm-pw" type="password" required minLength={6} value={pw2} onChange={e => setPw2(e.target.value)} placeholder="Repeat new password"
            className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[#FDFBF7] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2A5948]/25" />
        </div>
        {err && <div data-testid="reset-error" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-2.5">{err}</div>}
        <button type="submit" data-testid="reset-submit-btn" disabled={loading} className="group w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold text-sm disabled:opacity-50 shadow-[0_8px_20px_-6px_rgba(42,89,72,0.55)]" style={{ background: "linear-gradient(135deg, #2A5948, #1F4434)" }}>
          {loading ? "Saving…" : <>Update password <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" /></>}
        </button>
        <Link to="/login" className="inline-flex items-center gap-1 text-sm text-[var(--text-2)] hover:text-[var(--text)]">
          <ArrowLeft size={14} /> Back to login
        </Link>
      </form>
    </div>
  );
}
