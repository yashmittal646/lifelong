import React from "react";

const MAP = {
  child: { label: "Child", cls: "bg-[#FFF0EB] text-[#C8664D]" },
  teen:  { label: "Teen", cls: "bg-[#EEF2F1] text-[#3E5C54]" },
  // Backward-compat: legacy stage value
  puberty_teen: { label: "Teen", cls: "bg-[#EEF2F1] text-[#3E5C54]" },
  adult: { label: "Adult", cls: "bg-[#E9EFEA] text-[#2A5948]" },
};

export default function StageBadge({ stage }) {
  const m = MAP[stage] || MAP.adult;
  return (
    <span data-testid={`stage-badge-${stage}`} className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${m.cls}`}>
      {m.label}
    </span>
  );
}
