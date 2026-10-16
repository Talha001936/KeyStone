"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Clock, TrendingUp, Users } from "lucide-react";

export function HeroVisual() {
  return (
    <div className="relative w-full max-w-lg mx-auto">
      {/* Glow behind card */}
      <div className="absolute inset-0 bg-accent/30 blur-3xl rounded-full transform scale-90" />

      {/* Main dashboard card */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="relative bg-card border rounded-2xl shadow-2xl p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Workspace
            </p>
            <h3 className="text-lg font-bold">Acme Corp</h3>
          </div>
          <div className="flex -space-x-2">
            {["JD", "AS", "MK"].map((i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full bg-accent/30 border-2 border-card flex items-center justify-center text-[10px] font-bold"
              >
                {i}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "To Do", value: 12, color: "bg-muted" },
            { label: "In Progress", value: 8, color: "bg-accent" },
            { label: "Done", value: 24, color: "bg-primary" },
          ].map((c) => (
            <div key={c.label} className="bg-secondary/10 rounded-lg p-3">
              <div className={`w-2 h-2 ${c.color} rounded-full mb-2`} />
              <p className="text-[10px] text-muted-foreground">{c.label}</p>
              <p className="text-xl font-bold">{c.value}</p>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          {[
            { title: "Design landing page", done: true },
            { title: "Review pull request", done: false },
            { title: "Update docs", done: false },
          ].map((t, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-2 rounded-md bg-secondary/5"
            >
              <CheckCircle2
                className={`w-4 h-4 ${
                  t.done ? "text-emerald-500" : "text-muted-foreground"
                }`}
              />
              <span
                className={`text-sm ${
                  t.done ? "line-through text-muted-foreground" : ""
                }`}
              >
                {t.title}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Floating stat cards */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="absolute -left-6 top-24 bg-card border rounded-xl shadow-lg p-3 hidden sm:flex items-center gap-3"
      >
        <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-accent-foreground" />
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">Progress</p>
          <p className="text-sm font-bold">+24%</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.8 }}
        className="absolute -right-6 bottom-20 bg-card border rounded-xl shadow-lg p-3 hidden sm:flex items-center gap-3"
      >
        <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
          <Users className="w-4 h-4 text-accent-foreground" />
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">Active</p>
          <p className="text-sm font-bold">12 users</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1 }}
        className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-card border rounded-xl shadow-lg p-3 hidden sm:flex items-center gap-3"
      >
        <Clock className="w-4 h-4 text-accent" />
        <p className="text-xs font-medium">All tasks synced</p>
      </motion.div>
    </div>
  );
}