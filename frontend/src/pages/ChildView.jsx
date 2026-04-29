import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import Layout from "../components/Layout";
import AIQA from "../components/AIQA";
import { Sparkles, Heart, Hand, Smile, Frown, Angry, Shield, BookHeart, Droplets, UserCheck } from "lucide-react";

// ---- Child (8–10) view ----
const HYGIENE = [
  { title: "Wash your hands", body: "Use soap for 20 seconds — before eating and after using the toilet. Count slowly: 1… 2… 3…" },
  { title: "Brush your teeth", body: "Two times a day, for two minutes. Gentle circles on every tooth keep cavities away." },
  { title: "Bathe daily", body: "A daily bath keeps your skin healthy and fresh, especially in Indian summers." },
];

const MOODS = [
  { key: "happy", label: "Happy", Icon: Smile, color: "#4A7C59", tip: "That's wonderful! Maybe tell someone why you feel happy today." },
  { key: "sad", label: "Sad", Icon: Frown, color: "#84A59D", tip: "It's okay to feel sad. Talk to someone you trust — a parent, sibling, or teacher." },
  { key: "angry", label: "Angry", Icon: Angry, color: "#E07A5F", tip: "Take 5 slow breaths. Count to 10. Then tell a grown-up what made you upset." },
  { key: "scared", label: "Scared", Icon: Shield, color: "#D4A373", tip: "Being scared is normal. Find a trusted adult and share what you feel — they will help." },
];

const BODY_SAFETY = {
  title: "Your body belongs to you",
  points: [
    "Some parts of your body are private. Only you and a doctor (with a parent) may see them.",
    "A 'good touch' feels safe and kind — like a hug from family.",
    "A 'bad touch' makes you feel scared, confused, or sad. It is never your fault.",
    "Always tell a trusted adult right away if someone gives a bad touch, even if they say 'don't tell'.",
  ],
};

const STORIES = [
  { title: "Rani tells the truth", body: "Rani's uncle said not to tell anyone he pinched her. She felt bad inside. She told her mom — and mom said she was brave. The uncle never came back. Telling a trusted adult kept Rani safe." },
  { title: "Arjun's secret online friend", body: "A stranger online asked Arjun for photos. Arjun felt worried. He told his father. Father blocked the person and praised Arjun. Asking a grown-up is always the right choice." },
];

function ChildStage({ profile }) {
  const [mood, setMood] = useState(null);
  return (
    <div className="max-w-2xl mx-auto space-y-12 font-child">
      <header>
        <div className="text-xs uppercase tracking-[0.2em] text-[#C8664D] mb-2">Hi {profile.name}!</div>
        <h1 className="text-4xl sm:text-5xl font-black leading-tight">Let's learn about your body and feelings.</h1>
      </header>

      {/* My Body */}
      <section className="bg-white rounded-3xl border-4 border-[#F3E8D6] p-8 shadow-[0_12px_32px_rgba(224,122,95,0.08)]">
        <div className="flex items-center gap-2 mb-4">
          <Hand size={24} className="text-[#E07A5F]" />
          <h2 className="text-2xl font-black">My Body</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {HYGIENE.map(h => (
            <div key={h.title} className="bg-[#FCF9F2] rounded-2xl p-4">
              <div className="font-bold">{h.title}</div>
              <p className="text-sm text-[#5C7063] mt-1">{h.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 bg-[#FFF0EB] rounded-2xl p-5">
          <div className="font-bold text-[#C8664D]">{BODY_SAFETY.title}</div>
          <ul className="mt-2 space-y-2 text-sm text-[#6B3B2C]">
            {BODY_SAFETY.points.map((p, i) => <li key={i}>• {p}</li>)}
          </ul>
        </div>
      </section>

      {/* My Feelings */}
      <section className="bg-white rounded-3xl border-4 border-[#F3E8D6] p-8 shadow-[0_12px_32px_rgba(224,122,95,0.08)]">
        <div className="flex items-center gap-2 mb-4">
          <Heart size={24} className="text-[#E07A5F]" />
          <h2 className="text-2xl font-black">My Feelings</h2>
        </div>
        <p className="text-sm text-[#5C7063] mb-4">How are you feeling today?</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" role="radiogroup">
          {MOODS.map(m => {
            const active = mood === m.key;
            return (
              <button key={m.key} onClick={() => setMood(m.key)} data-testid={`mood-${m.key}`} className={`rounded-2xl p-4 flex flex-col items-center gap-2 border-2 transition-transform hover:scale-105 ${active ? "scale-105" : ""}`} style={{ borderColor: active ? m.color : "#F3E8D6", background: active ? `${m.color}15` : "#FCF9F2" }}>
                <m.Icon size={32} style={{ color: m.color }} strokeWidth={2.5} />
                <span className="font-bold text-sm">{m.label}</span>
              </button>
            );
          })}
        </div>
        {mood && (
          <div className="mt-4 bg-[#FCF9F2] rounded-2xl p-4 anim-fade-up">
            <p className="text-sm"><strong>Tip:</strong> {MOODS.find(m => m.key === mood).tip}</p>
          </div>
        )}
      </section>

      {/* Stories */}
      <section className="bg-white rounded-3xl border-4 border-[#F3E8D6] p-8 shadow-[0_12px_32px_rgba(224,122,95,0.08)]">
        <div className="flex items-center gap-2 mb-4">
          <BookHeart size={24} className="text-[#E07A5F]" />
          <h2 className="text-2xl font-black">Stories</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {STORIES.map(s => (
            <div key={s.title} className="bg-[#FCF9F2] rounded-2xl p-5" data-testid={`story-${s.title}`}>
              <div className="font-bold">{s.title}</div>
              <p className="text-sm text-[#5C7063] mt-2 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ---- Teen view ----
const TEEN_SECTIONS = [
  {
    id: "puberty",
    title: "Puberty basics",
    Icon: UserCheck,
    items: [
      "Your body is changing — growth spurts, new hair, voice changes, acne. It is normal.",
      "Sleep 8–9 hours and eat iron-rich foods (dal, leafy greens, eggs) to support growth.",
      "Mood swings happen. If sadness lasts weeks, talk to a trusted adult or counsellor.",
    ],
  },
  {
    id: "periods",
    title: "Periods & menstrual hygiene",
    Icon: Droplets,
    items: [
      "A period usually comes every 24–35 days. The first few cycles can be irregular.",
      "Change pads every 4–6 hours. Wash hands before and after. Dispose wrapped in paper.",
      "For cramps: warm water bag, gentle walking, hydration. See a doctor if pain is severe or bleeding is very heavy.",
    ],
  },
  {
    id: "consent",
    title: "Consent & safety",
    Icon: Shield,
    items: [
      "Your body is yours. 'No' is a full sentence — you never owe anyone a hug, kiss or touch.",
      "Good touch feels safe; bad touch makes you uncomfortable. If unsure, that uneasy feeling matters.",
      "Online: never share photos of your body or home address. Block and tell a trusted adult if someone pressures you.",
    ],
  },
  {
    id: "sexed",
    title: "Sex & contraception (basics)",
    Icon: Heart,
    items: [
      "Sex is a normal part of adult life. Waiting until you feel emotionally and physically ready is healthy.",
      "Condoms help protect from pregnancy and infections. No method is 100% effective — learn before deciding.",
      "If you have questions, ask here anonymously, or speak to a youth-friendly clinic. A doctor will not judge you.",
    ],
  },
];

function TeenStage({ profile }) {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <header>
        <div className="text-xs uppercase tracking-[0.2em] text-[#52796F] mb-2">Teen zone · private</div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold leading-tight">Hello, {profile.name}.</h1>
        <p className="text-[var(--text-2)] mt-2 max-w-xl">Accurate, judgement-free health and body info — written for teens in India. Your questions to our AI stay private.</p>
      </header>

      {TEEN_SECTIONS.map(s => {
        const hidePeriods = s.id === "periods" && profile.gender === "male";
        if (hidePeriods) return null;
        return (
          <section key={s.id} data-testid={`teen-section-${s.id}`} className="bg-white border border-[#DCE3E0] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <s.Icon size={18} className="text-[#52796F]" />
              <h2 className="font-display text-xl font-semibold">{s.title}</h2>
            </div>
            <ul className="space-y-2 text-sm leading-relaxed">
              {s.items.map((it, i) => <li key={i} className="flex gap-2"><span className="text-[#52796F] mt-1">·</span><span>{it}</span></li>)}
            </ul>
          </section>
        );
      })}

      <section className="bg-white border border-[#DCE3E0] rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={18} className="text-[#52796F]" />
          <h2 className="font-display text-xl font-semibold">Ask me anything (anonymous)</h2>
        </div>
        <AIQA profile={profile} contextType="teen" anonymous placeholder="e.g. Why is my period late this month?" testIdPrefix="teen-ai" />
      </section>
    </div>
  );
}

export default function ChildView() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    api.get(`/profiles/${id}`).then(r => setProfile(r.data));
  }, [id]);

  if (!profile) return <Layout><div className="text-sm text-[var(--text-2)]">Loading…</div></Layout>;

  const stage = profile.stage;
  return (
    <Layout stage={stage === "child" ? "child" : "teen"}>
      <Link to={`/parent/child/${profile.id}`} className="inline-flex items-center gap-1 text-sm text-[var(--text-2)] mb-6 hover:text-[var(--text)]" data-testid="back-to-parent-view">
        ← Parent view
      </Link>
      {stage === "child" ? <ChildStage profile={profile} /> : <TeenStage profile={profile} />}
    </Layout>
  );
}
