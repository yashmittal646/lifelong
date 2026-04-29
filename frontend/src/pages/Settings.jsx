import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Layout from "../components/Layout";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";
import { Mail, KeyRound, Shield, LogOut } from "lucide-react";

function Section({ title, icon: Icon, children, testid }) {
  return (
    <section data-testid={testid} className="bg-white border border-[var(--border)] rounded-2xl p-6">
      <h3 className="font-display text-xl font-semibold flex items-center gap-2 mb-4">
        <Icon size={18} /> {title}
      </h3>
      {children}
    </section>
  );
}

function ChangeEmail() {
  const { user, refresh } = useAuth();
  const [newEmail, setNewEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const submit = async (e) => {
    e.preventDefault(); setErr(null); setLoading(true);
    try {
      await api.post("/auth/change-email", { new_email: newEmail, current_password: pw || undefined });
      toast.success("Email updated");
      setNewEmail(""); setPw("");
      refresh?.();
    } catch (e) {
      setErr(e?.response?.data?.detail || "Could not update email.");
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="text-xs text-[var(--text-2)]">Current: <strong>{user?.email}</strong></div>
      <input data-testid="settings-new-email" type="email" required placeholder="New email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="w-full rounded-xl border border-[var(--border)] bg-[#FDFBF7] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2A5948]/25" />
      {user?.source !== "google" && (
        <input data-testid="settings-email-currentpw" type="password" required placeholder="Current password" value={pw} onChange={e => setPw(e.target.value)} className="w-full rounded-xl border border-[var(--border)] bg-[#FDFBF7] px-4 py-2.5 text-sm" />
      )}
      {err && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">{err}</div>}
      <button data-testid="settings-email-submit" type="submit" disabled={loading} className="px-4 py-2 rounded-lg text-white text-sm disabled:opacity-50" style={{ background: "var(--brand)" }}>
        {loading ? "Saving…" : "Update email"}
      </button>
    </form>
  );
}

function ChangePassword() {
  const { user } = useAuth();
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const submit = async (e) => {
    e.preventDefault(); setErr(null);
    if (next.length < 6) { setErr("New password must be at least 6 characters."); return; }
    setLoading(true);
    try {
      await api.post("/auth/change-password", { current_password: cur || undefined, new_password: next });
      toast.success(user?.source === "google" ? "Password set – you can now log in with email & password too" : "Password updated");
      setCur(""); setNext("");
    } catch (e) {
      setErr(e?.response?.data?.detail || "Could not update password.");
    } finally { setLoading(false); }
  };

  const isGoogle = user?.source === "google";
  return (
    <form onSubmit={submit} className="space-y-3">
      {isGoogle && <p className="text-xs text-[var(--text-2)]">You signed in with Google. Set a password here to also enable email login.</p>}
      {!isGoogle && (
        <input data-testid="settings-current-password" type="password" required placeholder="Current password" value={cur} onChange={e => setCur(e.target.value)} className="w-full rounded-xl border border-[var(--border)] bg-[#FDFBF7] px-4 py-2.5 text-sm" />
      )}
      <input data-testid="settings-new-password" type="password" required placeholder="New password (min 6 chars)" minLength={6} value={next} onChange={e => setNext(e.target.value)} className="w-full rounded-xl border border-[var(--border)] bg-[#FDFBF7] px-4 py-2.5 text-sm" />
      {err && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">{err}</div>}
      <button data-testid="settings-password-submit" type="submit" disabled={loading} className="px-4 py-2 rounded-lg text-white text-sm disabled:opacity-50" style={{ background: "var(--brand)" }}>
        {loading ? "Saving…" : isGoogle ? "Set password" : "Update password"}
      </button>
    </form>
  );
}

export default function Settings() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  return (
    <Layout stage="adult">
      <h1 className="font-display text-4xl font-bold mb-2">Account settings</h1>
      <p className="text-[var(--text-2)] mb-8">Manage your email, password, and privacy.</p>

      <div className="grid lg:grid-cols-2 gap-6 max-w-4xl">
        <Section title="Profile" icon={Shield} testid="settings-profile-section">
          <dl className="text-sm space-y-2">
            <div className="flex justify-between"><dt className="text-[var(--text-2)]">Email</dt><dd className="font-medium">{user?.email}</dd></div>
            <div className="flex justify-between"><dt className="text-[var(--text-2)]">Role</dt><dd className="font-medium capitalize">{user?.role || "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-[var(--text-2)]">Sign-in method</dt><dd className="font-medium capitalize">{user?.source === "google" ? "Google" : "Email & password"}</dd></div>
          </dl>
        </Section>

        <Section title="Change email" icon={Mail} testid="settings-email-section">
          <ChangeEmail />
        </Section>

        <Section title={user?.source === "google" ? "Set a password" : "Change password"} icon={KeyRound} testid="settings-password-section">
          <ChangePassword />
        </Section>

        <Section title="Privacy" icon={Shield} testid="settings-privacy-section">
          <p className="text-sm text-[var(--text-2)]">Teen Q&A is never shown to parents. When a child reaches age 18, parent access to their detailed health log is automatically removed.</p>
          <button onClick={() => { logout(); nav("/login"); }} data-testid="settings-logout-btn" className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border)] text-sm hover:bg-[var(--surface)]">
            <LogOut size={14} /> Log out of all devices
          </button>
        </Section>
      </div>
    </Layout>
  );
}
