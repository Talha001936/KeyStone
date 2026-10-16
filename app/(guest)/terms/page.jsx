// app/(guest)/terms/page.jsx
"use client";

import { motion } from "framer-motion";
import { Reveal } from "@/components/landing/Reveal";
import { GuestHero } from "@/components/guest/GuestHero";
import {
  FileText,
  CheckCircle2,
  Ban,
  Scale,
  RefreshCw,
  Mail,
} from "lucide-react";

const SECTIONS = [
  {
    icon: CheckCircle2,
    title: "1. Acceptance of Terms",
    body: "By creating an account or using Keystone, you agree to these terms. If you do not agree, do not use the service.",
  },
  {
    icon: FileText,
    title: "2. Your Account",
    body: "You are responsible for keeping your credentials secure and for all activity under your account. Notify us immediately of any unauthorized use.",
  },
  {
    icon: Ban,
    title: "3. Acceptable Use",
    body: "Do not abuse the service, attempt to access other workspaces, reverse engineer the platform, or use it for illegal activity.",
  },
  {
    icon: Scale,
    title: "4. Content Ownership",
    body: "You retain ownership of the content you create. We claim no intellectual property rights over your projects, tasks, or comments.",
  },
  {
    icon: RefreshCw,
    title: "5. Changes to the Service",
    body: "We may update or discontinue features. We'll give reasonable notice for breaking changes whenever possible.",
  },
  {
    icon: Mail,
    title: "6. Contact",
    body: "Questions about these terms? Email hello@keystone.app.",
  },
];

export default function TermsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <GuestHero
        badge="Legal"
        title="Terms of Service"
        highlight="Terms"
        description="The ground rules for using Keystone — what you can expect from us, and what we expect from you."
      />

      <section className="px-6 lg:px-14 py-24">
        <div className="max-w-3xl mx-auto space-y-6">
          {SECTIONS.map((s, i) => {
            const Icon = s.icon;
            return (
              <Reveal key={i} delay={i * 0.05}>
                <div className="group rounded-2xl border border-border bg-card p-6 md:p-8 transition-all duration-300 hover:border-primary hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--color-primary)]">
                  <div className="flex items-start gap-4">
                    <div className="relative w-10 h-10 shrink-0">
                      <div className="absolute inset-0 rounded-xl bg-accent/40 blur-lg scale-75 group-hover:scale-100 transition-transform duration-500" />
                      <div className="relative w-10 h-10 rounded-xl bg-accent/25 border border-accent/50 flex items-center justify-center">
                        <Icon
                          className="w-5 h-5 text-primary"
                          strokeWidth={1.75}
                        />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg font-bold mb-2">{s.title}</h2>
                      <p className="text-muted-foreground leading-relaxed text-sm">
                        {s.body}
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>
    </motion.div>
  );
}