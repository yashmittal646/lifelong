import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Activity, Stethoscope, Syringe, StickyNote, Plus } from "lucide-react";

const TYPE_META = {
  sickness: { label: "Sickness", Icon: Activity, color: "#C8664D" },
  visit: { label: "Doctor visit", Icon: Stethoscope, color: "#2A5948" },
  vaccine: { label: "Vaccination", Icon: Syringe, color: "#4A7C59" },
  note: { label: "Note", Icon: StickyNote, color: "#84A59D" },
};

export default function HealthLogTimeline({ profileId }) {
  const [logs, setLogs] = useState([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ type: "sickness", title: "", description: "", date: new Date().toISOString().slice(0, 10) });

  const load = async () => {
    const r = await api.get(`/profiles/${profileId}/logs`);
    setLogs(r.data);
  };
  useEffect(() => { load(); }, [profileId]);

  const submit = async (e) => {
    e.preventDefault();
    await api.post(`/profiles/${profileId}/logs`, form);
    setForm({ ...form, title: "", description: "" });
    setAdding(false);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-xl font-semibold">Health log</h3>
        <button onClick={() => setAdding(v => !v)} data-testid="log-add-toggle-btn" className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-[var(--border)] bg-white hover:bg-[var(--surface)]">
          <Plus size={14} /> Add entry
        </button>
      </div>
      {adding && (
        <form onSubmit={submit} className="bg-white border border-[var(--border)] rounded-lg p-4 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <select data-testid="log-type-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="rounded border border-[var(--border)] px-3 py-2 text-sm">
              <option value="sickness">Sickness</option>
              <option value="visit">Doctor visit</option>
              <option value="vaccine">Vaccination</option>
              <option value="note">Note</option>
            </select>
            <input data-testid="log-date-input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="rounded border border-[var(--border)] px-3 py-2 text-sm" />
          </div>
          <input data-testid="log-title-input" required placeholder="Title (e.g. Fever, MMR booster)" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full rounded border border-[var(--border)] px-3 py-2 text-sm" />
          <textarea data-testid="log-desc-input" placeholder="Notes (optional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full rounded border border-[var(--border)] px-3 py-2 text-sm" rows={2} />
          <button data-testid="log-submit-btn" type="submit" className="px-4 py-2 rounded-lg text-white text-sm" style={{ background: "var(--brand)" }}>Save entry</button>
        </form>
      )}
      {logs.length === 0 ? (
        <div className="text-sm text-[var(--text-2)] bg-white border border-dashed border-[var(--border)] rounded-lg p-6 text-center">No entries yet.</div>
      ) : (
        <ol className="border-l-2 border-[var(--border)] ml-3 pl-6 relative space-y-6">
          {logs.map(l => {
            const meta = TYPE_META[l.type] || TYPE_META.note;
            const { Icon } = meta;
            return (
              <li key={l.id} data-testid={`log-item-${l.id}`} className="relative">
                <span className="absolute -left-[34px] top-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: meta.color }}>
                  <Icon size={11} className="text-white" />
                </span>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-xs uppercase tracking-wider" style={{ color: meta.color }}>{meta.label}</span>
                  <span className="text-xs text-[var(--text-2)]">· {l.date}</span>
                </div>
                <div className="font-medium mt-0.5">{l.title}</div>
                {l.description && <p className="text-sm text-[var(--text-2)] mt-1">{l.description}</p>}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
