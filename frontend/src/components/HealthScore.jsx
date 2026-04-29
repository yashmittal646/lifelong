import React from "react";
import { ShieldCheck, TriangleAlert, Stethoscope, HeartPulse } from "lucide-react";

const TONES = {
  good:  { color: "#2A5948", bg: "#E9EFEA",  Icon: ShieldCheck,  ring: "#4A7C59" },
  warn:  { color: "#8B5A2B", bg: "#FFF0E0",  Icon: TriangleAlert, ring: "#D4A373" },
  alert: { color: "#8B3A2F", bg: "#FDECE7",  Icon: Stethoscope,  ring: "#C8664D" },
};

// Compact ring score used on cards
export function HealthScoreRing({ score, size = 56 }) {
  if (score == null) return null;
  const pct = Math.max(0, Math.min(100, score));
  const tone = score >= 80 ? "good" : score >= 60 || score >= 40 ? "warn" : "alert";
  const t = TONES[tone];
  const circ = 2 * Math.PI * 22;
  const dash = (pct / 100) * circ;
  return (
    <div className="relative" style={{ width: size, height: size }} data-testid="health-score-ring" aria-label={`Health score ${pct} of 100`}>
      <svg viewBox="0 0 50 50" width={size} height={size}>
        <circle cx="25" cy="25" r="22" stroke="#E2DFD6" strokeWidth="3.5" fill="none" />
        <circle cx="25" cy="25" r="22" stroke={t.ring} strokeWidth="3.5" fill="none" strokeLinecap="round" strokeDasharray={`${dash} ${circ - dash}`} transform="rotate(-90 25 25)" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-bold text-sm" style={{ color: t.color }}>{pct}</span>
      </div>
    </div>
  );
}

// Big card with score + reminder text
export function HealthScoreCard({ stats, name }) {
  if (!stats) return null;
  const { health_score: score = 0, reminder, sickness_3mo = 0 } = stats;
  const tone = reminder?.tone || (score >= 80 ? "good" : score >= 40 ? "warn" : "alert");
  const t = TONES[tone];
  return (
    <div data-testid="health-score-card" className="rounded-2xl p-5 flex items-center gap-5" style={{ background: t.bg }}>
      <HealthScoreRing score={score} size={72} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <HeartPulse size={14} style={{ color: t.color }} />
          <span className="text-[11px] uppercase tracking-[0.18em] font-semibold" style={{ color: t.color }}>Health score · {name || "you"}</span>
        </div>
        <div className="font-display text-xl font-bold mt-1" style={{ color: t.color }}>{reminder?.label || "—"}</div>
        <p className="text-sm mt-1" style={{ color: t.color }}>{reminder?.message}</p>
        <div className="text-xs mt-2 opacity-80" style={{ color: t.color }}>{sickness_3mo} sickness {sickness_3mo === 1 ? "entry" : "entries"} in the last 90 days · score = 100 − (sickness × 10)</div>
      </div>
    </div>
  );
}
