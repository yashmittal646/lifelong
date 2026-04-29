import React from "react";
import { AlertTriangle } from "lucide-react";

export default function AIDisclaimer() {
  return (
    <div data-testid="ai-medical-disclaimer" className="rounded-lg bg-[#FFF9EC] border border-[#F4D08C] p-3 flex items-start gap-3">
      <AlertTriangle size={16} className="text-[#B88330] mt-0.5 shrink-0" />
      <p className="text-sm text-[#705435] leading-relaxed">
        <strong>This is educational information, not medical advice.</strong> Always consult a qualified doctor for diagnosis or serious concerns.
      </p>
    </div>
  );
}
