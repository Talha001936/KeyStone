// components/shared/StatusBadge.jsx
import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS } from "@/lib/constants";

const VARIANTS = {
  todo: "secondary",
  in_progress: "default",
  done: "outline",
};

export function StatusBadge({ status, label }) {
  const key = String(status || "").toLowerCase();
  return (
    <Badge variant={VARIANTS[key] || "secondary"}>
      {label || STATUS_LABELS[key] || status}
    </Badge>
  );
}