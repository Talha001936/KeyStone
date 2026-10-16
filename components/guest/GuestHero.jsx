// components/guest/GuestHero.jsx
"use client";

import { motion } from "framer-motion";

/**
 * Shared hero for guest sub-pages.
 *
 * Props:
 *   - badge:        small label pill
 *   - title:        main title, can contain a `highlight` word
 *   - highlight:    optional string inside `title` to underline in accent
 *   - description:  paragraph under the title
 *   - stats:        optional array of { value, label }
 *   - align:        "center" | "left" (default center)
 */
export function GuestHero({
  badge,
  title,
  highlight,
  description,
  stats,
  align = "center",
}) {
  const isCenter = align === "center";

  const parts =
    highlight && title.includes(highlight)
      ? title.split(highlight)
      : [title];

  return (
    <section className="relative px-6 lg:px-14 pt-32 md:pt-40 pb-20 overflow-hidden border-b border-border/70">
      {/* ============ BACKGROUND LAYERS ============ */}
      {/* Base color wash */}
      <div className="absolute inset-0 -z-30 bg-secondary/15" />

      {/* Radial gradient for warmth */}
      <div
        aria-hidden
        className="absolute inset-0 -z-20"
        style={{
          background:
            "radial-gradient(circle at 20% 0%, rgba(224,175,160,0.22), transparent 55%), radial-gradient(circle at 80% 100%, rgba(70,63,58,0.08), transparent 55%)",
        }}
      />

      {/* Dotted grid pattern */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(70,63,58,0.18) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      {/* Drifting glows */}
      <motion.div
        aria-hidden
        className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-accent/25 blur-3xl -z-10"
        animate={{
          x: [0, 30, 0],
          y: [0, 20, 0],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute top-20 right-1/4 w-72 h-72 rounded-full bg-secondary/25 blur-3xl -z-10"
        animate={{
          x: [0, -20, 0],
          y: [0, 14, 0],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* ============ CONTENT ============ */}
      <div
        className={`relative max-w-4xl mx-auto space-y-6 ${
          isCenter ? "text-center" : ""
        }`}
      >
        {/* Badge */}
        {badge && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className={`inline-flex items-center gap-1.5 rounded-full border border-accent bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent-foreground ${
              isCenter ? "mx-auto" : ""
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            {badge}
          </motion.div>
        )}

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05]"
        >
          {highlight && title.includes(highlight) ? (
            <>
              {parts[0]}
              <span className="relative inline-block">
                <span className="relative z-10 text-accent-foreground">
                  {highlight}
                </span>
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{
                    duration: 0.8,
                    delay: 0.9,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="absolute bottom-1 left-0 right-0 h-3 bg-accent/40 origin-left -z-0"
                />
              </span>
              {parts[1]}
            </>
          ) : (
            title
          )}
        </motion.h1>

        {/* Description */}
        {description && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.6,
              delay: 0.16,
              ease: [0.22, 1, 0.36, 1],
            }}
            className={`text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl ${
              isCenter ? "mx-auto" : ""
            }`}
          >
            {description}
          </motion.p>
        )}

        {/* Stats */}
        {stats && stats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.6,
              delay: 0.28,
              ease: [0.22, 1, 0.36, 1],
            }}
            className={`flex flex-wrap gap-6 pt-6 ${
              isCenter ? "justify-center" : ""
            }`}
          >
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.4,
                  delay: 0.4 + i * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="text-center"
              >
                <p className="text-3xl md:text-4xl font-extrabold text-primary tabular-nums">
                  {s.value}
                </p>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mt-1">
                  {s.label}
                </p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}