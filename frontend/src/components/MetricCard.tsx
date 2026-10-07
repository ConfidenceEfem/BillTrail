import { useEffect, useState } from "react";
import { animate, useMotionValue } from "framer-motion";
import { formatKobo } from "../lib/money";
import { usePrivacyStore } from "../store/privacyStore";

type MetricCardProps = {
  label: string;
  rawValue: number;
  tone?: "default" | "danger";
};

export function MetricCard({ label, rawValue, tone = "default" }: MetricCardProps) {
  const [displayValue, setDisplayValue] = useState(formatKobo(0));
  const motionValue = useMotionValue(0);
  const amountsHidden = usePrivacyStore((state) => state.amountsHidden);

  useEffect(() => {
    const controls = animate(motionValue, rawValue, {
      duration: 0.6,
      ease: "easeOut",
      onUpdate: (v) => setDisplayValue(formatKobo(Math.round(v))),
    });
    return () => controls.stop();
  }, [rawValue]);

  return (
    <div className="bg-white rounded-xl p-4">
      <p className="text-sm text-gray-500 mb-1.5">{label}</p>
      <p className={`text-2xl font-medium ${tone === "danger" ? "text-red-600" : "text-gray-900"}`}>
        {amountsHidden ? "••••••" : displayValue}
      </p>
    </div>
  );
}