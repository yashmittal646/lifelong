import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { HeartPulse, ArrowRight, UsersRound, User } from "lucide-react";

export default function Signup() {
  const { signup } = useAuth();
  const nav = useNavigate();
  const [role, setRole] = useState("parent");
  const [form, setForm] = useState({ email: "", password: "", name: "", dob: "", gender: "female" });
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(null); setLoading(true);
    try {
      const payload = role === "parent"
        ? { email: form.email, password: form.password, role }
        : { ...form, role };
      const u = await signup(payload);
      nav(u.role === "parent" ? "/parent/dashboard" : "/adult/dashboard");
    } catch (e) {
      setErr(e?.response?.data?.detail || "Signup failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen w-full bg-[#FDFBF7] relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-20 w-[420px] h-[420px] rounded-full opacity-30 blur-3xl" style={{ background: "radial-gradient(circle, #E07A5F 0%, transparent 70%)" }} />
        <div className="absolute -bottom-40 -right-20 w-[520px] h-[520px] rounded-full opacity-25 blur-3xl" style={{ background: "radial-gradient(circle, #2A5948 0%, transparent 70%)" }} />
      </div>

      <div className="min-h-screen flex items-center justify-center p-6">
        <form onSubmit={submit} data-testid="signup-form" className="w-full max-w-md bg-white border border-[var(--border)] rounded-3xl p-8 shadow-[0_30px_60px_-20px_rgba(26,46,36,0.15)] anim-fade-up space-y-5">
          <Link to="/login" className="inline-flex items-center gap-2.5 mb-1">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "var(--brand)" }}>
              <HeartPulse className="text-white" size={18} strokeWidth={2.2} />
            </div>
            <div>
              <div className="font-display text-base font-bold leading-tight">Lifelong Health</div>
              <div className="text-[10px] tracking-[0.22em] uppercase text-[var(--text-2)]">Companion · India</div>
            </div>
          </Link>
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-[#5C7063]">Get started</div>
            <h2 className="font-display text-3xl font-bold mt-1.5">Create your account</h2>
            <p className="text-sm text-[var(--text-2)] mt-1.5">It only takes a moment.</p>
          </div>

          <div className="grid grid-cols-2 gap-2 p-1 bg-[var(--surface)] rounded-xl">
            <button type="button" onClick={() => setRole("parent")} data-testid="signup-role-parent" className={`flex items-center justify-center gap-2 py-2.5 text-sm rounded-lg transition-colors ${role === "parent" ? "bg-white shadow font-semibold" : "text-[var(--text-2)]"}`}>
              <UsersRound size={14} /> I'm a parent
            </button>
            <button type="button" onClick={() => setRole("individual")} data-testid="signup-role-individual" className={`flex items-center justify-center gap-2 py-2.5 text-sm rounded-lg transition-colors ${role === "individual" ? "bg-white shadow font-semibold" : "text-[var(--text-2)]"}`}>
              <User size={14} /> I'm an adult (18+)
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="text-xs font-semibold tracking-wide text-[#5C7063]">EMAIL</label>
              <input data-testid="signup-email-input" required type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[#FDFBF7] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2A5948]/25 focus:border-[#2A5948]" />
            </div>
            <div>
              <label className="text-xs font-semibold tracking-wide text-[#5C7063]">PASSWORD</label>
              <input data-testid="signup-password-input" required type="password" placeholder="At least 6 characters" minLength={6} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[#FDFBF7] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2A5948]/25 focus:border-[#2A5948]" />
            </div>
            {role === "individual" && (
              <>
                <div>
                  <label className="text-xs font-semibold tracking-wide text-[#5C7063]">YOUR NAME</label>
                  <input data-testid="signup-name-input" required placeholder="e.g. Priya" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[#FDFBF7] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2A5948]/25" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold tracking-wide text-[#5C7063]">DATE OF BIRTH</label>
                    <input data-testid="signup-dob-input" required type="date" value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[#FDFBF7] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2A5948]/25" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold tracking-wide text-[#5C7063]">GENDER</label>
                    <select data-testid="signup-gender-select" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[#FDFBF7] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2A5948]/25">
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </>
            )}
          </div>

          {err && <div data-testid="signup-error" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-2.5">{err}</div>}

          <button data-testid="signup-submit-btn" disabled={loading} className="group w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold text-sm tracking-wide disabled:opacity-50 transition-all shadow-[0_8px_20px_-6px_rgba(42,89,72,0.55)]" style={{ background: "linear-gradient(135deg, #2A5948, #1F4434)" }}>
            {loading ? "Creating…" : <>Create account <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" /></>}
          </button>
          <div className="text-sm text-[var(--text-2)] text-center">Already have an account? <Link to="/login" className="font-medium underline decoration-[#E07A5F]/60 underline-offset-2" data-testid="signup-login-link">Log in</Link></div>
        </form>
      </div>
    </div>
  );
}
