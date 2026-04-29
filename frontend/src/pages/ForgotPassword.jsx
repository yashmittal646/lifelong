import React, { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { ArrowRight, ArrowLeft, MailCheck, HeartPulse } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setErr(null); setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email, origin: window.location.origin });
      setSent(true);
    } catch (e) {
      setErr(e?.response?.data?.detail || "Could not send reset link.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg)] relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-20 w-[420px] h-[420px] rounded-full opacity-30 blur-3xl" style={{ background: "radial-gradient(circle, #E07A5F 0%, transparent 70%)" }} />
        <div className="absolute -bottom-40 -right-20 w-[520px] h-[520px] rounded-full opacity-25 blur-3xl" style={{ background: "radial-gradient(circle, #2A5948 0%, transparent 70%)" }} />
      </div>

      <div className="w-full max-w-md bg-white border border-[var(--border)] rounded-3xl p-8 shadow-[0_30px_60px_-20px_rgba(26,46,36,0.18)] anim-fade-up">
        <Link to="/login" className="inline-flex items-center gap-2.5 mb-5">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "var(--brand)" }}>
            <HeartPulse className="text-white" size={18} />
          </div>
          <div>
            <div className="font-display text-base font-bold leading-tight">Lifelong Health</div>
            <div className="text-[10px] tracking-[0.22em] uppercase text-[var(--text-2)]">Companion · India</div>
          </div>
        </Link>

        {!sent ? (
          <form onSubmit={submit} data-testid="forgot-form" className="space-y-5">
            <div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-[#5C7063]">Forgot password</div>
              <h2 className="font-display text-3xl font-bold mt-1.5">Reset your password</h2>
              <p className="text-sm text-[var(--text-2)] mt-1.5">Enter the email you signed up with. We'll send you a one-time reset link.</p>
            </div>
            <div>
              <label className="text-xs font-semibold tracking-wide text-[#5C7063]">EMAIL</label>
              <input data-testid="forgot-email-input" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[#FDFBF7] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2A5948]/25 focus:border-[#2A5948]" />
            </div>
            {err && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-2.5">{err}</div>}
            <button type="submit" data-testid="forgot-submit-btn" disabled={loading} className="group w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold text-sm disabled:opacity-50 shadow-[0_8px_20px_-6px_rgba(42,89,72,0.55)]" style={{ background: "linear-gradient(135deg, #2A5948, #1F4434)" }}>
              {loading ? "Sending…" : <>Send reset link <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" /></>}
            </button>
            <Link to="/login" className="inline-flex items-center gap-1 text-sm text-[var(--text-2)] hover:text-[var(--text)]" data-testid="forgot-back-login">
              <ArrowLeft size={14} /> Back to login
            </Link>
          </form>
        ) : (
          <div data-testid="forgot-sent" className="space-y-4 anim-fade-up">
            <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ background: "var(--brand-light)" }}>
              <MailCheck className="text-[var(--brand)]" size={22} />
            </div>
            <h2 className="font-display text-2xl font-bold">Check your email</h2>
            <p className="text-sm text-[var(--text-2)] leading-relaxed">
              If an account exists for <strong>{email}</strong>, we've sent a one-time reset link. It expires in <strong>30 minutes</strong>.
            </p>
            <p className="text-xs text-[var(--text-2)]">Didn't get the email? Check your spam folder, or wait a minute and try again.</p>
            <Link to="/login" className="inline-flex items-center gap-1 text-sm font-medium" style={{ color: "var(--brand)" }} data-testid="forgot-go-login">
              <ArrowLeft size={14} /> Back to login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
