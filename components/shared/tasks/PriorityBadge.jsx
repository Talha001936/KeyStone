// components/shared/PriorityBadge.jsx
import { Badge } from "@/components/ui/badge";
import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";
import { PRIORITY_LABELS } from "@/lib/constants";

const CONFIG = {
  low: { variant: "outline", icon: ArrowDown, label: PRIORITY_LABELS.low },
  medium: { variant: "secondary", icon: ArrowRight, label: PRIORITY_LABELS.medium },
  high: { variant: "destructive", icon: ArrowUp, label: PRIORITY_LABELS.high },
};

export function PriorityBadge({ priority, label }) {
  const key = String(priority || "").toLowerCase();
  const cfg = CONFIG[key] || CONFIG.medium;
  const Icon = cfg.icon;
  return (
    <Badge variant={cfg.variant} className="flex items-center gap-1">
      <Icon className="w-3 h-3" />
      {label || cfg.label}
    </Badge>
  );
}