import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { UsersRound, User, ArrowRight, HeartPulse } from "lucide-react";

export default function RolePicker() {
  const { user, refresh } = useAuth();
  const nav = useNavigate();
  const [role, setRole] = useState("parent");
  const [form, setForm] = useState({ name: "", dob: "", gender: "female" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  if (!user) { nav("/login", { replace: true }); return null; }
  if (user.role) { nav(user.role === "parent" ? "/parent/dashboard" : "/adult/dashboard", { replace: true }); return null; }

  const submit = async (e) => {
    e.preventDefault();
    setErr(null); setLoading(true);
    try {
      const payload = role === "parent" ? { role } : { role, ...form };
      await api.post("/auth/pick-role", payload);
      toast.success("Welcome aboard!");
      await refresh?.();
      nav(role === "parent" ? "/parent/dashboard" : "/adult/dashboard", { replace: true });
    } catch (e) {
      setErr(e?.response?.data?.detail || "Could not save your role.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg)]">
      <form onSubmit={submit} className="w-full max-w-md bg-white border border-[var(--border)] rounded-3xl p-8 shadow-[0_30px_60px_-20px_rgba(26,46,36,0.18)] space-y-5 anim-fade-up">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "var(--brand)" }}>
            <HeartPulse className="text-white" size={18} />
          </div>
          <div>
            <div className="font-display text-base font-bold leading-tight">Welcome, {user.email.split("@")[0]}</div>
            <div className="text-[10px] tracking-[0.22em] uppercase text-[var(--text-2)]">One last step</div>
          </div>
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold">How will you use the app?</h2>
          <p className="text-sm text-[var(--text-2)] mt-1.5">You can manage children as a parent, or use it just for yourself.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 p-1 bg-[var(--surface)] rounded-xl">
          <button type="button" onClick={() => setRole("parent")} data-testid="role-parent" className={`flex items-center justify-center gap-2 py-2.5 text-sm rounded-lg transition-colors ${role === "parent" ? "bg-white shadow font-semibold" : "text-[var(--text-2)]"}`}>
            <UsersRound size={14} /> I'm a parent
          </button>
          <button type="button" onClick={() => setRole("individual")} data-testid="role-individual" className={`flex items-center justify-center gap-2 py-2.5 text-sm rounded-lg transition-colors ${role === "individual" ? "bg-white shadow font-semibold" : "text-[var(--text-2)]"}`}>
            <User size={14} /> I'm an adult (18+)
          </button>
        </div>
        {role === "individual" && (
          <div className="space-y-3">
            <input data-testid="role-name" required placeholder="Your name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-[var(--border)] bg-[#FDFBF7] px-4 py-3 text-sm" />
            <div className="grid grid-cols-2 gap-3">
              <input data-testid="role-dob" required type="date" max={new Date().toISOString().slice(0,10)} value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} className="rounded-xl border border-[var(--border)] bg-[#FDFBF7] px-4 py-3 text-sm" />
              <select data-testid="role-gender" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} className="rounded-xl border border-[var(--border)] bg-[#FDFBF7] px-4 py-3 text-sm">
                <option value="female">Female</option><option value="male">Male</option><option value="other">Other</option>
              </select>
            </div>
          </div>
        )}
        {err && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">{err}</div>}
        <button data-testid="role-submit" type="submit" disabled={loading} className="group w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold text-sm disabled:opacity-50 shadow-[0_8px_20px_-6px_rgba(42,89,72,0.55)]" style={{ background: "linear-gradient(135deg, #2A5948, #1F4434)" }}>
          {loading ? "Saving…" : <>Continue <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" /></>}
        </button>
      </form>
    </div>
  );
}
