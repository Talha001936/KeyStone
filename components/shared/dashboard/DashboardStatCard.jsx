// components/shared/DashboardStatCard.jsx
"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { RadialProgress } from "@/components/shared/ui/RadialProgress";

/**
 * Dashboard stat card.
 *
 * Pass `progress` to show a ring. Omit it for a plain number card.
 * Pass `icon` to render a small icon badge.
 * Pass `accent` to tint the icon badge: primary | accent | success | muted.
 */

const ACCENTS = {
  primary: {
    badge: "bg-primary/10 text-primary",
    ring: "var(--color-primary)",
  },
  accent: {
    badge: "bg-accent/20 text-accent-foreground",
    ring: "var(--color-accent)",
  },
  success: {
    badge: "bg-emerald-500/10 text-emerald-600",
    ring: "rgb(16 185 129)",
  },
  muted: {
    badge: "bg-muted text-muted-foreground",
    ring: "var(--color-muted-foreground)",
  },
};

export function DashboardStatCard({
  label,
  value,
  hint,
  progress,
  icon: Icon,
  accent = "muted",
  size = 56,
  index = 0,
}) {
  const a = ACCENTS[accent] || ACCENTS.muted;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: Math.min(index * 0.06, 0.3),
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <Card className="group relative h-full overflow-hidden border-border/70 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_12px_32px_-16px_rgba(70,63,58,0.2)]">
        {/* Soft corner glow on hover */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 -right-16 w-32 h-32 rounded-full bg-accent/15 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        />

        <CardContent className="relative pt-6 pb-6 px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-3">
              {/* Icon badge + label */}
              <div className="flex items-center gap-2.5">
                {Icon && (
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${a.badge}`}
                  >
                    <Icon className="w-4 h-4" strokeWidth={2} />
                  </div>
                )}
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {label}
                </p>
              </div>

              {/* Value */}
              <p className="text-3xl font-bold tracking-tight tabular-nums">
                {value}
              </p>

              {/* Hint */}
              {hint && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {hint}
                </p>
              )}
            </div>

            {typeof progress === "number" && (
              <div className="relative shrink-0 self-start">
                <RadialProgress
                  value={progress}
                  size={size}
                  stroke={6}
                  color={a.ring}
                  trackColor="var(--color-border)"
                />
                <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold tabular-nums">
                  {progress}%
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}