"use client";

import { Card, CardContent } from "@/components/ui/card";
import { RadialProgress } from "@/components/shared/ui/RadialProgress";

export function StatCard({
  label,
  value,
  hint,
  progress,
  size = 56,
}) {
  return (
    <Card>
      <CardContent className="pt-6 pb-6 px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold tracking-tight mt-2">{value}</p>
            {hint && (
              <p className="text-xs text-muted-foreground mt-1">{hint}</p>
            )}
          </div>

          {typeof progress === "number" && (
            <div className="relative shrink-0">
              <RadialProgress
                value={progress}
                size={size}
                stroke={6}
                color="var(--color-accent)"
                trackColor="var(--color-border)"
              />
              <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold">
                {progress}%
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}