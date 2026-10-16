// components/shared/LoadingState.jsx
import { Loader2 } from "lucide-react";

export function LoadingState({ label = "Loading…" }) {
  return (
    <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      {label}
    </div>
  );
}