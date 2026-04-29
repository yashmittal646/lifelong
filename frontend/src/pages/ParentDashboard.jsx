import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../lib/api";
import Layout from "../components/Layout";
import StageBadge from "../components/StageBadge";
import { ProfileAvatar } from "../components/ProfileAvatar";
import { HealthScoreRing } from "../components/HealthScore";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "../components/ui/dropdown-menu";
import { Plus, ChevronRight, AlertCircle, MoreVertical, Pencil, Trash2 } from "lucide-react";

function ChildFormModal({ initial, onClose, onSaved, mode = "create" }) {
  const [form, setForm] = useState(initial || { name: "", dob: "", gender: "female" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const ageFromDob = (s) => {
    if (!s) return null;
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return null;
    const today = new Date();
    let a = today.getFullYear() - d.getFullYear();
    const m = today.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) a -= 1;
    return a;
  };
  const previewAge = ageFromDob(form.dob);

  const submit = async (e) => {
    e.preventDefault();
    setErr(null);
    if (!form.name.trim()) { setErr("Please enter the child's name."); return; }
    if (!form.dob) { setErr("Please enter the date of birth."); return; }
    const d = new Date(form.dob);
    if (Number.isNaN(d.getTime()) || d > new Date()) { setErr("Date of birth must be a valid past date."); return; }
    if (previewAge !== null && previewAge >= 18) {
      setErr(`This date makes ${form.name.trim() || "the child"} ${previewAge} years old. Children must be under 18 to be tracked under a parent account.`);
      return;
    }
    setLoading(true);
    try {
      if (mode === "edit") {
        await api.patch(`/profiles/${initial.id}`, { name: form.name.trim(), dob: form.dob, gender: form.gender });
        toast.success(`${form.name.trim()} updated`);
      } else {
        const r = await api.post("/profiles", { ...form, name: form.name.trim(), is_child: true });
        toast.success(`${r.data.name} added to your family`);
      }
      onSaved();
    } catch (e) {
      setErr(e?.response?.data?.detail || "Could not save. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <form onSubmit={submit} onClick={e => e.stopPropagation()} data-testid="child-form" className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl anim-fade-up">
        <div>
          <h3 className="font-display text-2xl font-bold">{mode === "edit" ? "Edit child" : "Add a child"}</h3>
          <p className="text-sm text-[var(--text-2)] mt-1">Stage is calculated automatically from age.</p>
        </div>
        <div>
          <label className="text-xs font-semibold tracking-wide text-[#5C7063]">CHILD'S NAME</label>
          <input data-testid="child-form-name" autoFocus placeholder="e.g. Riya" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[#FDFBF7] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2A5948]/25" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold tracking-wide text-[#5C7063]">DATE OF BIRTH</label>
            <input data-testid="child-form-dob" type="date" max={new Date().toISOString().slice(0, 10)} value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[#FDFBF7] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2A5948]/25" />
          </div>
          <div>
            <label className="text-xs font-semibold tracking-wide text-[#5C7063]">GENDER</label>
            <select data-testid="child-form-gender" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[#FDFBF7] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2A5948]/25">
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        {previewAge !== null && (
          <div data-testid="child-age-preview" className={`rounded-lg px-3 py-2 text-sm flex items-center justify-between ${previewAge >= 18 ? "bg-[#FDECE7] text-[#8B3A2F] border border-[#F4C9BD]" : "bg-[var(--surface)] text-[var(--text-2)]"}`}>
            <span>Calculated age: <strong>{previewAge} year{previewAge === 1 ? "" : "s"}</strong></span>
            <span className="text-xs">{previewAge >= 18 ? "⚠ must be under 18" : previewAge >= 11 ? "Stage: Teen" : "Stage: Child"}</span>
          </div>
        )}
        {err && <div data-testid="child-form-error" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-2.5">{err}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm rounded-xl border border-[var(--border)] hover:bg-[var(--surface)]">Cancel</button>
          <button data-testid="child-form-submit" type="submit" disabled={loading} className="px-5 py-2.5 text-sm rounded-xl text-white font-medium disabled:opacity-50 shadow-[0_8px_20px_-6px_rgba(42,89,72,0.55)]" style={{ background: "linear-gradient(135deg, #2A5948, #1F4434)" }}>
            {loading ? "Saving…" : mode === "edit" ? "Save changes" : "Add child"}
          </button>
        </div>
      </form>
    </div>
  );
}

function ConfirmDelete({ profile, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    setLoading(true);
    try {
      await api.delete(`/profiles/${profile.id}`);
      toast.success(`${profile.name} removed`);
      onDeleted();
    } finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl anim-fade-up" data-testid="delete-confirm">
        <div>
          <h3 className="font-display text-xl font-bold">Remove {profile.name}?</h3>
          <p className="text-sm text-[var(--text-2)] mt-2">This permanently deletes their profile, health log, and photo. This cannot be undone.</p>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2.5 text-sm rounded-xl border border-[var(--border)]">Cancel</button>
          <button onClick={submit} disabled={loading} data-testid="delete-confirm-btn" className="px-5 py-2.5 text-sm rounded-xl bg-red-600 text-white font-medium disabled:opacity-50">
            {loading ? "Removing…" : "Yes, remove"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ChildStatCard({ profile, onEdit, onDelete }) {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    api.get(`/profiles/${profile.id}/stats`).then(r => setStats(r.data));
  }, [profile.id, profile.has_photo]);

  return (
    <div data-testid={`child-card-${profile.id}`} className="relative bg-white border border-[var(--border)] rounded-2xl p-6 hover:shadow-md transition-shadow anim-fade-up">
      <div className="absolute top-3 right-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button data-testid={`child-menu-${profile.id}`} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-[var(--surface)] text-[var(--text-2)]">
              <MoreVertical size={16} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => onEdit(profile)} data-testid={`child-edit-${profile.id}`} className="cursor-pointer">
              <Pencil size={14} className="mr-2" /> Edit details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(profile)} data-testid={`child-delete-${profile.id}`} className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50">
              <Trash2 size={14} className="mr-2" /> Remove child
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-4 pr-8">
        <ProfileAvatar profile={profile} size={56} />
        <div className="min-w-0 flex-1">
          <div className="font-display text-2xl font-bold truncate">{profile.name}</div>
          <div className="text-sm text-[var(--text-2)]">Age {profile.age} · {profile.gender}</div>
        </div>
        {stats?.health_score != null && <HealthScoreRing score={stats.health_score} size={48} />}
      </div>
      <div className="mt-4"><StageBadge stage={profile.stage} /></div>

      {stats?.reminder && stats.reminder.tone !== "good" && (
        <div className="mt-4 flex items-start gap-2 text-sm text-[#8B3A2F] bg-[#FDECE7] rounded-md px-3 py-2" data-testid={`reminder-${profile.id}`}>
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>{stats.reminder.message}</span>
        </div>
      )}
      <div className="text-xs text-[var(--text-2)] mt-3">Health score: <strong className="text-[var(--text)]">{stats?.health_score ?? "—"}</strong> · Sickness (90d): <strong className="text-[var(--text)]">{stats?.sickness_3mo ?? "—"}</strong></div>

      <Link to={`/parent/child/${profile.id}`} className="mt-4 inline-flex items-center gap-1 text-sm font-medium" style={{ color: "var(--brand)" }} data-testid={`child-open-${profile.id}`}>
        Open profile <ChevronRight size={14} />
      </Link>
    </div>
  );
}

export default function ParentDashboard() {
  const [profiles, setProfiles] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = () => api.get("/profiles").then(r => setProfiles(r.data));
  useEffect(() => { load(); }, []);

  return (
    <Layout stage="adult">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-[var(--text-2)]">Parent dashboard</div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold mt-1">Your family's health, in one place.</h1>
          <p className="text-[var(--text-2)] mt-2 max-w-lg">Track vaccinations, log sickness, and ask our AI any health question — tailored for India.</p>
        </div>
        <button onClick={() => setShowAdd(true)} data-testid="add-child-btn" className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-[0_8px_20px_-6px_rgba(42,89,72,0.55)]" style={{ background: "linear-gradient(135deg, #2A5948, #1F4434)" }}>
          <Plus size={14} /> Add child
        </button>
      </div>

      {profiles.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-[var(--border)] rounded-2xl">
          <div className="font-display text-2xl font-semibold">No children yet</div>
          <p className="text-sm text-[var(--text-2)] mt-2">Add your first child to start tracking their health.</p>
          <button onClick={() => setShowAdd(true)} className="mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm text-white" style={{ background: "var(--brand)" }}>
            <Plus size={14} /> Add child
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="children-grid">
          {profiles.map(p => <ChildStatCard key={p.id} profile={p} onEdit={setEditing} onDelete={setDeleting} />)}
        </div>
      )}

      {showAdd && <ChildFormModal onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load(); }} />}
      {editing && <ChildFormModal mode="edit" initial={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
      {deleting && <ConfirmDelete profile={deleting} onClose={() => setDeleting(null)} onDeleted={() => { setDeleting(null); load(); }} />}
    </Layout>
  );
}
