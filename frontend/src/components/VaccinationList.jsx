import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Syringe, CheckCircle2, Clock } from "lucide-react";

// Compute age in months from dob string
function ageMonths(dob) {
  const d = new Date(dob);
  const now = new Date();
  return (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
}

export default function VaccinationList({ profile }) {
  const [schedule, setSchedule] = useState([]);

  useEffect(() => {
    api.get("/vaccinations/schedule").then(r => setSchedule(r.data));
  }, []);

  const months = ageMonths(profile.dob);
  return (
    <div>
      <h3 className="font-display text-xl font-semibold mb-3 flex items-center gap-2">
        <Syringe size={18} /> Vaccination schedule (India · IAP-inspired)
      </h3>
      <ol className="border-l-2 border-[var(--border)] ml-3 pl-6 relative space-y-5">
        {schedule.map((s, i) => {
          const done = months >= s.age_months + 1;
          const upcoming = !done && months >= s.age_months - 3;
          return (
            <li key={i} data-testid={`vaccine-row-${i}`} className="relative">
              <span className={`absolute -left-[34px] top-1 w-5 h-5 rounded-full flex items-center justify-center ${done ? "bg-[#4A7C59]" : upcoming ? "bg-[#D4A373]" : "bg-white border-2 border-[var(--border)]"}`}>
                {done ? <CheckCircle2 size={12} className="text-white" /> : upcoming ? <Clock size={11} className="text-white" /> : null}
              </span>
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <div>
                  <div className="text-xs uppercase tracking-wider text-[var(--text-2)]">{s.label}</div>
                  <div className="font-medium">{s.vaccines.join(" · ")}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${done ? "bg-[#E9EFEA] text-[#2A5948]" : upcoming ? "bg-[#FFF0E0] text-[#8B5A2B]" : "bg-[var(--surface)] text-[var(--text-2)]"}`}>
                  {done ? "Done / due earlier" : upcoming ? "Upcoming" : "Later"}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
