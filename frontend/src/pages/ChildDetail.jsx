import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import Layout from "../components/Layout";
import StageBadge from "../components/StageBadge";
import HealthLogTimeline from "../components/HealthLogTimeline";
import VaccinationList from "../components/VaccinationList";
import AIQA from "../components/AIQA";
import { ProfileAvatarEditable } from "../components/ProfileAvatar";
import { HealthScoreCard } from "../components/HealthScore";
import { ArrowLeft, Eye, Sparkles } from "lucide-react";

export default function ChildDetail() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [p, s] = await Promise.all([
      api.get(`/profiles/${id}`),
      api.get(`/profiles/${id}/stats`),
    ]);
    setProfile(p.data); setStats(s.data);
  };
  useEffect(() => { load(); }, [id]);

  const togglePuberty = async () => {
    setSaving(true);
    const r = await api.patch(`/profiles/${id}/puberty`, { puberty_started: !profile.puberty_started });
    setProfile(r.data);
    setSaving(false);
  };

  if (!profile) return <Layout><div className="text-sm text-[var(--text-2)]">Loading…</div></Layout>;

  return (
    <Layout stage="adult">
      <Link to="/parent/dashboard" className="inline-flex items-center gap-1 text-sm text-[var(--text-2)] hover:text-[var(--text)] mb-4" data-testid="back-to-dashboard">
        <ArrowLeft size={14} /> Back to dashboard
      </Link>
      <div className="flex items-end justify-between flex-wrap gap-6 mb-8">
        <div className="flex items-center gap-5">
          <ProfileAvatarEditable profile={profile} onChanged={load} size={96} />
          <div>
            <div className="flex items-center gap-3 mb-2"><StageBadge stage={profile.stage} /></div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold">{profile.name}</h1>
            <p className="text-[var(--text-2)] mt-1">Age {profile.age} · {profile.gender}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link to={`/child/${profile.id}`} data-testid="open-child-view-btn" className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-[var(--border)] bg-white hover:bg-[var(--surface)]">
            <Eye size={14} /> Open {profile.stage === "teen" ? "teen" : "child"} view
          </Link>
          <button onClick={togglePuberty} disabled={saving} data-testid="toggle-puberty-btn" className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg text-white disabled:opacity-50" style={{ background: profile.puberty_started ? "#5C7063" : "var(--brand)" }}>
            {profile.puberty_started ? "Puberty marked ✓ (undo)" : "Mark puberty started"}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white border border-[var(--border)] rounded-2xl p-6">
            <HealthLogTimeline profileId={profile.id} />
          </section>
          <section className="bg-white border border-[var(--border)] rounded-2xl p-6">
            <VaccinationList profile={profile} />
          </section>
        </div>
        <aside className="space-y-6">
          <section className="bg-white border border-[var(--border)] rounded-2xl p-6">
            <h3 className="font-display text-xl font-semibold mb-3 flex items-center gap-2"><Sparkles size={16} /> Ask AI about {profile.name}</h3>
            <AIQA profile={profile} contextType="parent" placeholder={`e.g. Is it normal for a ${profile.age}-year-old to catch a cold every month?`} testIdPrefix="parent-ai" />
          </section>
        </aside>
      </div>
    </Layout>
  );
}
