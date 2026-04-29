import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { HeartPulse, Syringe, Sparkles, ShieldCheck, BookHeart, ArrowRight } from "lucide-react";

const FEATURES = [
  { Icon: Syringe, title: "Vaccinations", body: "India IAP-aligned schedule for every child." },
  { Icon: BookHeart, title: "Puberty & consent", body: "Honest, age-appropriate body education." },
  { Icon: Sparkles, title: "Private AI guide", body: "Trained for India. Always with disclaimers." },
];

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(null); setLoading(true);
    try {
      const u = await login(email, password);
      nav(u.role === "parent" ? "/parent/dashboard" : "/adult/dashboard");
    } catch (e) {
      setErr(e?.response?.data?.detail || "Login failed. Check email & password.");
    } finally { setLoading(false); }
  };

  const fillDemo = (which) => {
    setEmail(which === "parent" ? "parent@demo.com" : "adult@demo.com");
    setPassword("demo1234");
    setErr(null);
  };

  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  const continueWithGoogle = () => {
    const redirectUrl = window.location.origin + "/auth/callback";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] bg-[#FDFBF7] overflow-hidden">
      {/* LEFT — visual hero */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden text-white"
        style={{ background: "linear-gradient(135deg, #1F4434 0%, #2A5948 45%, #345E47 100%)" }}>
        {/* Decorative blobs */}
        <div className="absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full opacity-40 blur-3xl" style={{ background: "radial-gradient(circle at 30% 30%, #E07A5F 0%, transparent 70%)" }} />
        <div className="absolute -bottom-32 -right-20 w-[480px] h-[480px] rounded-full opacity-30 blur-3xl" style={{ background: "radial-gradient(circle at 70% 30%, #D4A373 0%, transparent 70%)" }} />
        <div className="absolute top-1/4 right-10 w-32 h-32 rounded-full opacity-25" style={{ background: "radial-gradient(circle, #F5F3EC 0%, transparent 70%)" }} />
        {/* subtle grain */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.06] mix-blend-overlay" xmlns="http://www.w3.org/2000/svg">
          <filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" /></filter>
          <rect width="100%" height="100%" filter="url(#n)" />
        </svg>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2.5">
            <div className="h-11 w-11 rounded-2xl flex items-center justify-center bg-white/15 backdrop-blur border border-white/20">
              <HeartPulse className="text-white" size={22} strokeWidth={2.2} />
            </div>
            <div>
              <div className="font-display text-xl font-bold leading-tight">Lifelong Health</div>
              <div className="text-[11px] tracking-[0.22em] uppercase text-white/70">Companion · India</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] mb-5 bg-white/10 backdrop-blur px-3 py-1.5 rounded-full border border-white/15">
            <ShieldCheck size={13} /> Private · Stage-aware · For India
          </div>
          <h1 className="font-display text-5xl xl:text-6xl font-bold leading-[1.05] tracking-tight">
            Health that grows<br />
            with your <span className="italic" style={{ color: "#F4C9A7" }}>family.</span>
          </h1>
          <p className="mt-5 text-white/80 text-lg leading-relaxed max-w-md">
            One companion app — for the curious child, the questioning teen, and the busy adult. Vaccination reminders, puberty &amp; consent education, and a private AI guide.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-3">
            {FEATURES.map(({ Icon, title, body }) => (
              <div key={title} className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 p-4">
                <Icon size={18} className="text-[#F4C9A7] mb-2" strokeWidth={2} />
                <div className="text-sm font-semibold">{title}</div>
                <p className="text-xs text-white/70 mt-1 leading-snug">{body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-6 text-xs text-white/60">
          <span>HIPAA-style privacy</span>
          <span className="w-1 h-1 rounded-full bg-white/40" />
          <span>Educational, not diagnostic</span>
          <span className="w-1 h-1 rounded-full bg-white/40" />
          <span>Made for Bharat</span>
        </div>
      </div>

      {/* RIGHT — login card */}
      <div className="relative flex items-center justify-center p-6 sm:p-12">
        {/* Mobile-only mini hero */}
        <div className="lg:hidden absolute inset-x-0 top-0 h-40" style={{ background: "linear-gradient(135deg, #2A5948, #345E47)" }} />
        <div className="relative w-full max-w-md">
          <div className="lg:hidden mb-6 flex items-center gap-2 text-white">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-white/15 backdrop-blur border border-white/20"><HeartPulse size={20} /></div>
            <div className="font-display text-lg font-bold">Lifelong Health</div>
          </div>
          <div className="bg-white border border-[var(--border)] rounded-3xl p-8 shadow-[0_30px_60px_-20px_rgba(26,46,36,0.18)] anim-fade-up">
            <div className="mb-6">
              <div className="text-[11px] uppercase tracking-[0.22em] text-[#5C7063]">Welcome back</div>
              <h2 className="font-display text-3xl font-bold mt-1.5">Log in to your account</h2>
              <p className="text-sm text-[var(--text-2)] mt-1.5">Or <Link to="/signup" className="font-medium underline decoration-[#E07A5F]/60 underline-offset-2 hover:text-[var(--text)]" data-testid="login-signup-link">create a new account</Link></p>
            </div>

            <form onSubmit={submit} data-testid="login-form" className="space-y-4">
              <div>
                <label htmlFor="login-email" className="text-xs font-semibold tracking-wide text-[#5C7063]">EMAIL</label>
                <input id="login-email" data-testid="login-email-input" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[#FDFBF7] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2A5948]/25 focus:border-[#2A5948]" />
              </div>
              <div>
                <div className="flex items-baseline justify-between">
                  <label htmlFor="login-password" className="text-xs font-semibold tracking-wide text-[#5C7063]">PASSWORD</label>
                  <Link to="/forgot-password" data-testid="forgot-password-link" className="text-xs font-medium text-[var(--text-2)] hover:text-[var(--brand)]">Forgot?</Link>
                </div>
                <input id="login-password" data-testid="login-password-input" type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[#FDFBF7] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2A5948]/25 focus:border-[#2A5948]" />
              </div>

              {err && <div data-testid="login-error" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-2.5">{err}</div>}

              <button type="submit" data-testid="login-submit-btn" disabled={loading} className="group w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold text-sm tracking-wide disabled:opacity-50 transition-all shadow-[0_8px_20px_-6px_rgba(42,89,72,0.55)] hover:shadow-[0_10px_24px_-6px_rgba(42,89,72,0.65)]"
                style={{ background: "linear-gradient(135deg, #2A5948, #1F4434)" }}>
                {loading ? "Logging in…" : <>Log in <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" /></>}
              </button>
            </form>

            <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-[#9BA89E]">
              <span className="flex-1 h-px bg-[var(--border)]" /> Or <span className="flex-1 h-px bg-[var(--border)]" />
            </div>
            <button type="button" onClick={continueWithGoogle} data-testid="google-login-btn" className="w-full inline-flex items-center justify-center gap-3 py-3 rounded-xl border border-[var(--border)] bg-white hover:bg-[var(--surface)] transition-colors text-sm font-medium">
              <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path fill="#4285F4" d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.614z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.583-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
              </svg>
              Continue with Google
            </button>

            <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-[#9BA89E]">
              <span className="flex-1 h-px bg-[var(--border)]" /> Try a demo <span className="flex-1 h-px bg-[var(--border)]" />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button type="button" onClick={() => fillDemo("parent")} data-testid="demo-parent-btn" className="rounded-xl border border-[var(--border)] bg-[#F5F3EC] px-3 py-2.5 text-left hover:bg-[#EDEAE0] transition-colors">
                <div className="text-xs font-semibold">Parent demo</div>
                <div className="text-[11px] text-[var(--text-2)] mt-0.5">parent@demo.com</div>
              </button>
              <button type="button" onClick={() => fillDemo("adult")} data-testid="demo-adult-btn" className="rounded-xl border border-[var(--border)] bg-[#F5F3EC] px-3 py-2.5 text-left hover:bg-[#EDEAE0] transition-colors">
                <div className="text-xs font-semibold">Adult demo</div>
                <div className="text-[11px] text-[var(--text-2)] mt-0.5">adult@demo.com</div>
              </button>
            </div>
            <p className="text-[11px] text-[var(--text-2)] mt-3 text-center">Demo password: <code className="bg-[var(--surface)] px-1.5 py-0.5 rounded">demo1234</code></p>
          </div>

          <p className="text-center text-xs text-[var(--text-2)] mt-6">
            By continuing you agree this is educational content,<br className="hidden sm:block" /> never a substitute for medical advice.
          </p>
        </div>
      </div>
    </div>
  );
}
