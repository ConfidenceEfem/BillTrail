import type { LucideIcon } from "lucide-react";

type StatusIconProps = {
  icon: LucideIcon;
  tone: "success" | "info" | "error";
};

const toneStyles = {
  success: "bg-green-50 text-green-600",
  info: "bg-brand-50 text-brand-600",
  error: "bg-red-50 text-red-600",
};

export function StatusIcon({ icon: Icon, tone }: StatusIconProps) {
  return (
    <div
      className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5 ${toneStyles[tone]}`}
    >
      <Icon size={26} strokeWidth={2} />
    </div>
  );
}