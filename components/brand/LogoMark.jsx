// components/brand/LogoMark.jsx
"use client";

import { Layers } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Keystone logo mark — a rounded square containing the Layers icon.
 * Pass `size` for the square, icon scales proportionally.
 * Uses `currentColor` on the icon so it inherits text color.
 */
export function LogoMark({
  size = 32,
  iconSize,
  className,
  radius = "0.75rem",
  ...props
}) {
  const icon = iconSize ?? Math.round(size * 0.55);
  return (
    <div
      className={cn(
        "shrink-0 flex items-center justify-center bg-primary text-primary-foreground",
        className
      )}
      style={{ width: size, height: size, borderRadius: radius }}
      {...props}
    >
      <Layers
        style={{ width: icon, height: icon }}
        strokeWidth={2.25}
        aria-hidden="true"
      />
    </div>
  );
}