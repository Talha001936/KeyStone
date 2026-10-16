// app/(guest)/about/page.jsx
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Reveal } from "@/components/landing/Reveal";
import { GuestHero } from "@/components/guest/GuestHero";
import {
  ArrowRight,
  Target,
  Heart,
  Shield,
  Zap,
  Sparkles,
  Rocket,
} from "lucide-react";

const VALUES = [
  {
    icon: Target,
    title: "Focus on the work",
    desc: "Every decision we make is guided by one question: does this help teams ship faster?",
  },
  {
    icon: Heart,
    title: "Respect the user",
    desc: "No dark patterns, no upsell games. Just honest software that respects your time.",
  },
  {
    icon: Shield,
    title: "Own your data",
    desc: "Your workspace belongs to you. We enforce strict authorization at every layer.",
  },
  {
    icon: Zap,
    title: "Fast by default",
    desc: "Speed is a feature. Real-time updates, instant navigations, no spinners where they aren't needed.",
  },
];

const STATS = [
  { value: "50k+", label: "Tasks completed" },
  { value: "12k+", label: "Active teams" },
  { value: "99.9%", label: "Uptime" },
];

export default function AboutPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <GuestHero
        badge="About"
        title="Software that gets out of the way"
        highlight="out of the way"
        description="Keystone started as a simple question: why is project management software so much harder to use than the work itself? We're building the answer."
        stats={STATS}
      />

      <section className="px-6 lg:px-14 py-24">
        <div className="max-w-3xl mx-auto space-y-6 text-muted-foreground leading-relaxed">
          <Reveal>
            <p className="text-lg text-foreground font-medium">
              Every team we talked to had the same complaints.
            </p>
          </Reveal>
          <Reveal delay={0.05}>
            <p>
              Boards that lag, permissions that are either too loose or too
              rigid, and reports nobody reads. We decided to build something
              different — a workspace that&apos;s fast, clear, and honest about
              what it does.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <p>
              We keep the feature list short on purpose. Owners and Admins get
              the controls they need. Members get a clean view of the work
              assigned to them. Nothing else.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="rounded-2xl border border-border bg-card p-6 mt-6">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  Keystone is invite-only. There&apos;s no &quot;upgrade to
                  premium&quot; nag because there&apos;s nothing to upsell — the
                  product is complete as-is.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="px-6 lg:px-14 py-24 bg-secondary/10">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">
                Values
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-3">
                What we believe
              </h2>
              <p className="text-muted-foreground">
                Four principles that shape every release.
              </p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-6">
            {VALUES.map((v, i) => {
              const Icon = v.icon;
              return (
                <Reveal key={i} delay={i * 0.08}>
                  <Card className="group h-full p-8 border-border hover:border-primary transition-all duration-300 hover:-translate-y-1 hover:shadow-[6px_6px_0_0_var(--color-primary)]">
                    <CardContent className="p-0 space-y-4">
                      <div className="relative w-12 h-12">
                        <div className="absolute inset-0 rounded-2xl bg-accent/40 blur-lg scale-75 group-hover:scale-100 transition-transform duration-500" />
                        <div className="relative w-12 h-12 rounded-2xl bg-accent/25 border border-accent/50 flex items-center justify-center">
                          <Icon
                            className="w-6 h-6 text-primary"
                            strokeWidth={1.75}
                          />
                        </div>
                      </div>
                      <h3 className="text-xl font-bold">{v.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {v.desc}
                      </p>
                    </CardContent>
                  </Card>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-6 lg:px-14 py-24 relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        </div>
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <Reveal>
            <Rocket className="w-10 h-10 text-accent mx-auto" />
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Join us
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Create an account to get started, or reach out if you have
              questions about how Keystone could fit your team.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Link href="/register">
                <Button size="lg" className="h-12 px-8 w-full sm:w-auto">
                  Create account <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 px-8 w-full sm:w-auto"
                >
                  Contact us
                </Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </motion.div>
  );
}