// app/(guest)/privacy/page.jsx
"use client";

import { motion } from "framer-motion";
import { Reveal } from "@/components/landing/Reveal";
import { GuestHero } from "@/components/guest/GuestHero";
import { Shield, Lock, Eye, FileText, Cookie, Mail } from "lucide-react";

const SECTIONS = [
  {
    icon: Eye,
    title: "1. What we collect",
    body: "We collect only what's needed to run the service: your name, email address, a securely hashed password, and the content you create inside your workspaces (projects, tasks, comments, and activity).",
  },
  {
    icon: FileText,
    title: "2. How we use it",
    body: "Your data is used to authenticate you, display your workspaces and tasks, deliver invites and password resets, and produce activity feeds. We do not sell or share your data with third parties.",
  },
  {
    icon: Lock,
    title: "3. Storage & security",
    body: "Passwords are hashed with scrypt and a per-user salt. Sessions are signed with HMAC-SHA256. Authorization is enforced on every API endpoint. Data is stored in a Postgres database with regular backups.",
  },
  {
    icon: Shield,
    title: "4. Your rights",
    body: "You can update your name and email at any time from your profile page. To delete your account and all associated data, contact us at hello@keystone.app.",
  },
  {
    icon: Cookie,
    title: "5. Cookies",
    body: "We use a single session cookie to keep you logged in. No tracking, no advertising cookies.",
  },
  {
    icon: Mail,
    title: "6. Contact",
    body: "Questions about this policy? Email hello@keystone.app.",
  },
];

export default function PrivacyPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <GuestHero
        badge="Legal"
        title="Privacy Policy"
        highlight="Privacy"
        description="How Keystone handles your data — what we collect, how we use it, and the rights you keep."
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