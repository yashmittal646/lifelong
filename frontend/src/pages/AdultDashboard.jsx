import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import Layout from "../components/Layout";
import HealthLogTimeline from "../components/HealthLogTimeline";
import AIQA from "../components/AIQA";
import StageBadge from "../components/StageBadge";
import { HealthScoreCard } from "../components/HealthScore";
import { CalendarCheck, Sparkles, Heart, Shield } from "lucide-react";

const WOMEN_TOPICS = [
  { title: "Menstrual health", body: "Track cycles, note heavy bleeding, painful cramps, or missed periods — share with your gynecologist." },
  { title: "Cervical cancer prevention", body: "HPV vaccine is effective till age 26. From age 21, consider Pap smear every 3 years." },
  { title: "Breast self-exam", body: "Do a monthly self-check 5 days after your period. Report lumps, changes, or discharge to a doctor." },
  { title: "Contraception", body: "Condoms, pills, IUDs, injectables — each has trade-offs. Ask a doctor about what fits your life stage." },
];

const MEN_TOPICS = [
  { title: "Testicular self-exam", body: "Monthly check in the shower — any lump or change in size/weight should be examined by a doctor." },
  { title: "Heart & lifestyle", body: "Indian men have high cardiac risk. Track BP, sugar, cholesterol from age 30." },
  { title: "Mental health", body: "Stress, anxiety, and depression are real. Talking to a counsellor is a sign of strength, not weakness." },
  { title: "Sexual health", body: "Safe practices prevent STIs. Any persistent concern deserves a confidential doctor visit." },
];

export default function AdultDashboard() {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [checkups, setCheckups] = useState([]);

  useEffect(() => {
    api.get("/profiles").then(r => {
      const me = r.data.find(p => p.stage === "adult");
      setProfile(me || r.data[0]);
    });
  }, []);

  useEffect(() => {
    if (!profile) return;
    api.get(`/adult/checkups?gender=${profile.gender}`).then(r => setCheckups(r.data));
    api.get(`/profiles/${profile.id}/stats`).then(r => setStats(r.data));
  }, [profile?.id, profile?.gender]);

  if (!profile) return <Layout><div className="text-sm text-[var(--text-2)]">Loading…</div></Layout>;

  const topics = profile.gender === "female" ? WOMEN_TOPICS : profile.gender === "male" ? MEN_TOPICS : [];

  return (
    <Layout stage="adult">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2"><StageBadge stage="adult" /></div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold">Hi, {profile.name}.</h1>
          <p className="text-[var(--text-2)] mt-2 max-w-xl">Personalized reminders, your health log, and a private AI guide — for adult life in India.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <HealthScoreCard stats={stats} name={profile.name} />
          <section className="bg-white border border-[var(--border)] rounded-2xl p-6">
            <h3 className="font-display text-xl font-semibold mb-3 flex items-center gap-2"><CalendarCheck size={18} /> Upcoming checkups & vaccinations</h3>
          <ul className="divide-y divide-[var(--border)]">
            {checkups.map((c, i) => (
              <li key={i} className="py-3 flex items-start justify-between gap-4" data-testid={`checkup-${i}`}>
                <div>
                  <div className="font-medium">{c.title}</div>
                  <div className="text-sm text-[var(--text-2)]">{c.frequency}</div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-[var(--brand-light)] text-[var(--brand)] uppercase tracking-wider">{c.applies_to === "all" ? "Everyone" : c.applies_to}</span>
              </li>
            ))}
          </ul>
        </section>
        </div>

        <aside className="bg-white border border-[var(--border)] rounded-2xl p-6">
          <h3 className="font-display text-xl font-semibold mb-3 flex items-center gap-2"><Sparkles size={18} /> Ask AI</h3>
          <AIQA profile={profile} contextType="adult" healthScore={stats?.health_score} placeholder="e.g. What are safe contraception options after age 30?" testIdPrefix="adult-ai" />
        </aside>

        <section className="lg:col-span-2 bg-white border border-[var(--border)] rounded-2xl p-6">
          <HealthLogTimeline profileId={profile.id} />
        </section>

        <section className="bg-white border border-[var(--border)] rounded-2xl p-6">
          <h3 className="font-display text-xl font-semibold mb-3 flex items-center gap-2">
            {profile.gender === "female" ? <Heart size={18} /> : <Shield size={18} />}
            {profile.gender === "female" ? "Women's health" : profile.gender === "male" ? "Men's health" : "Health topics"}
          </h3>
          <div className="space-y-3">
            {topics.map(t => (
              <div key={t.title} className="bg-[var(--surface)] rounded-lg p-3">
                <div className="font-medium text-sm">{t.title}</div>
                <p className="text-sm text-[var(--text-2)] mt-1">{t.body}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
}
