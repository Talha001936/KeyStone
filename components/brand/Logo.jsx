// components/brand/Logo.jsx
"use client";

import Link from "next/link";
import { LogoMark } from "./LogoMark";
import { cn } from "@/lib/cn";

/**
 * Full Keystone logo — mark + wordmark, optionally wrapped in a Link.
 *
 * Usage:
 *   <Logo />                            → link to "/" with default size
 *   <Logo href={null} />                → no link, just the mark + name
 *   <Logo size="lg" />                  → larger for footers/heroes
 */
export function Logo({
  href = "/",
  size = "md",
  showName = true,
  className,
  nameClassName,
  markClassName,
}) {
  const dims = {
    sm: { mark: 28, name: "text-lg", gap: "gap-2" },
    md: { mark: 32, name: "text-xl", gap: "gap-2.5" },
    lg: { mark: 40, name: "text-2xl", gap: "gap-3" },
  }[size] || { mark: 32, name: "text-xl", gap: "gap-2.5" };

  const inner = (
    <span className={cn("flex items-center", dims.gap, className)}>
      <LogoMark size={dims.mark} className={markClassName} />
      {showName && (
        <span className={cn("font-bold tracking-tight", dims.name, nameClassName)}>
          Keystone
        </span>
      )}
    </span>
  );

  if (!href) return inner;

  return (
    <Link href={href} className="inline-flex items-center">
      {inner}
    </Link>
  );
}