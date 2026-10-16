// app/(guest)/page.jsx
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  LayoutDashboard,
  Users,
  Zap,
  Shield,
  BarChart3,
  MessageSquare,
  Bell,
  Search,
  Calendar,
  Sparkles,
  Star,
  Quote,
  Plus,
  Minus,
  ShieldCheck,
  Crown,
} from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import Marquee from "react-fast-marquee";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/landing/Reveal";
import { AnimatedCounter } from "@/components/landing/AnimatedCounter";
import { HeroVisual } from "@/components/landing/HeroVisual";

const featureList = [
  { icon: LayoutDashboard, tag: "Visualize", title: "Project Boards", desc: "Kanban boards and list views. Drag, drop, and track progress in real time." },
  { icon: Users, tag: "Permissions", title: "Team Roles", desc: "Granular access for Owners, Admins, and Members. Control where it matters." },
  { icon: CheckCircle2, tag: "Workflow", title: "Task Tracking", desc: "Assign, prioritize, and track tasks with due dates and priority levels." },
  { icon: BarChart3, tag: "Insights", title: "Analytics", desc: "Project-level statistics — tasks by status, progress, and team velocity." },
  { icon: MessageSquare, tag: "Collaborate", title: "Comments", desc: "Discuss changes directly on tasks. Never leave the platform to align." },
  { icon: Bell, tag: "Realtime", title: "Real-time Updates", desc: "Instant notifications for assignments, status changes, and mentions." },
  { icon: Search, tag: "Find", title: "Advanced Search", desc: "Server-side search, filtering, sorting, and pagination across all tasks." },
  { icon: Calendar, tag: "Deadlines", title: "Due Dates", desc: "Track deadlines with visual calendars and overdue indicators." },
  { icon: Shield, tag: "Security", title: "Secure Access", desc: "Workspace-level authorization enforced on every backend operation." },
];

const trustedBy = [
  "Vertex", "Nimbus", "Quantum", "Aster", "Pulse",
  "Orbit", "Zenith", "Cascade", "Meridian", "Lumen",
];

const goAndBrake = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export default function LandingPage() {
  const trackRef = useRef(null);
  const cardRefs = useRef([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const totalFeatures = featureList.length;
  const animationRef = useRef(null);

  const repeatedFeatures = [...featureList, ...featureList, ...featureList];

  const animateScrollTo = useCallback((targetLeft, duration = 1000) => {
    const track = trackRef.current;
    if (!track) return;
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    const startLeft = track.scrollLeft;
    const distance = targetLeft - startLeft;
    const startTime = performance.now();
    const step = (now) => {
      const t = Math.min((now - startTime) / duration, 1);
      track.scrollLeft = startLeft + distance * goAndBrake(t);
      if (t < 1) animationRef.current = requestAnimationFrame(step);
    };
    animationRef.current = requestAnimationFrame(step);
  }, []);

  const slideTo = (index) => {
    const wrapped = (index + totalFeatures) % totalFeatures;
    const targetCard = cardRefs.current[wrapped + totalFeatures];
    if (!targetCard) return;
    animateScrollTo(targetCard.offsetLeft, 1000);
    setCurrentIndex(wrapped);
  };

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const middleCard = cardRefs.current[totalFeatures];
    if (middleCard) track.scrollLeft = middleCard.offsetLeft;
  }, [totalFeatures]);

  return (
    <>
      <section className="px-6 lg:px-14 pt-32 md:pt-40 pb-24 md:pb-32 relative">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center rounded-full border border-accent bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent-foreground"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Built for modern teams
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-primary leading-[1.1]"
            >
              Manage projects with{" "}
              <span className="relative inline-block">
                <span className="text-accent-foreground relative z-10">
                  clarity
                </span>
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.8, delay: 1 }}
                  className="absolute bottom-1 left-0 right-0 h-3 bg-accent/40 origin-left -z-0"
                />
              </span>{" "}
              and speed.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed"
            >
              The all-in-one workspace for modern teams. Assign tasks, track
              progress, and collaborate in real-time without the clutter.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link href="/register">
                <Button
                  size="lg"
                  className="h-12 px-8 text-lg font-semibold w-full sm:w-auto"
                >
                  Get Started <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 px-8 text-lg font-semibold border-muted-foreground/30 w-full sm:w-auto"
                >
                  Log in
                </Button>
              </Link>
            </motion.div>
          </div>

          <HeroVisual />
        </div>
      </section>

      <section className="py-12 border-y bg-secondary/5 overflow-hidden">
        <Reveal>
          <p className="text-center text-sm font-medium text-muted-foreground uppercase tracking-wider mb-8">
            Trusted by teams at
          </p>
        </Reveal>
        <Marquee
          gradient={true}
          gradientColor="#f4f3ee"
          gradientWidth={100}
          speed={40}
          pauseOnHover={true}
          autoFill={true}
        >
          {trustedBy.map((name) => (
            <div
              key={name}
              className="mx-12 text-3xl font-bold tracking-tight text-muted-foreground/60 hover:text-primary transition-colors cursor-pointer"
            >
              {name}
            </div>
          ))}
        </Marquee>
      </section>

      <section id="features" className="py-24 md:py-32 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-14">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10">
            <Reveal>
              <div className="max-w-2xl">
                <Badge variant="outline" className="mb-4">
                  Features
                </Badge>
                <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight uppercase leading-[1.05]">
                  Everything you need <br /> to succeed
                </h2>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-full border-2"
                  onClick={() => slideTo(currentIndex - 1)}
                  aria-label="Previous"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <Button
                  variant="default"
                  size="icon"
                  className="h-12 w-12 rounded-full border-2"
                  onClick={() => slideTo(currentIndex + 1)}
                  aria-label="Next"
                >
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            </Reveal>
          </div>
        </div>

        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background to-transparent z-10" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent z-10" />

          <div
            ref={trackRef}
            className="flex gap-5 overflow-x-hidden py-2 pl-6 lg:pl-14"
          >
            {repeatedFeatures.map((feature, i) => {
              const isActive = i - totalFeatures === currentIndex;
              const realIndex = ((i % totalFeatures) + 1)
                .toString()
                .padStart(2, "0");
              const Icon = feature.icon;

              return (
                <motion.div
                  key={i}
                  ref={(el) => (cardRefs.current[i] = el)}
                  className="shrink-0 w-[300px] sm:w-[340px]"
                  animate={{
                    scale: isActive ? 1 : 0.96,
                    opacity: isActive ? 1 : 0.75,
                  }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div
                    className={`group relative h-[420px] flex flex-col rounded-[1.75rem] bg-card border-2 p-7 transition-all duration-300 overflow-hidden ${
                      isActive
                        ? "border-primary shadow-[8px_8px_0_0_var(--color-primary)]"
                        : "border-border hover:border-primary hover:shadow-[8px_8px_0_0_var(--color-primary)]"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-6">
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-primary/70 border border-border rounded-full px-2.5 py-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                        {feature.tag}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-muted-foreground/60 tabular-nums">
                        {realIndex}
                      </span>
                    </div>

                    <div className="relative mb-6">
                      <div className="absolute inset-0 rounded-2xl bg-accent/40 blur-2xl scale-75 group-hover:scale-100 transition-transform duration-500" />
                      <div className="relative w-14 h-14 rounded-2xl bg-accent/25 border border-accent/50 flex items-center justify-center">
                        <Icon
                          className="w-7 h-7 text-primary"
                          strokeWidth={1.75}
                        />
                      </div>
                    </div>

                    <h3 className="text-xl font-extrabold uppercase tracking-tight leading-[1.15] mb-3">
                      {feature.title}
                      <span className="block mt-2 h-[3px] w-10 bg-primary rounded-full transition-all duration-300 group-hover:w-16" />
                    </h3>

                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.desc}
                    </p>

                    <div className="mt-auto pt-6 flex items-center justify-between border-t border-dashed border-border">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Feature
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary opacity-0 translate-x-[-4px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                        Learn more <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>

                    <div className="pointer-events-none absolute -bottom-12 -right-12 w-32 h-32 rounded-full bg-accent/10 group-hover:bg-accent/20 transition-colors duration-500" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section
        id="roles"
        className="px-6 lg:px-14 py-24 md:py-32 bg-secondary/10 scroll-mt-20"
      >
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-16 max-w-2xl mx-auto">
              <Badge variant="outline" className="mb-4">
                Role-Based Access
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
                The right permissions for everyone
              </h2>
              <p className="text-muted-foreground text-lg">
                One Owner, one Admin, and Members — each with clear
                responsibilities.
              </p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                role: "Owner",
                icon: Crown,
                color: "bg-primary text-primary-foreground",
                desc: "The workspace's single owner. Final say on everything.",
                features: [
                  "Exactly one per workspace",
                  "Transfer ownership to any member",
                  "Promote or demote the Admin",
                  "Manage workspace settings & delete",
                ],
              },
              {
                role: "Admin",
                icon: ShieldCheck,
                color: "bg-accent text-accent-foreground",
                desc: "One admin at a time. Runs day-to-day operations.",
                features: [
                  "At most one per workspace",
                  "Create & manage projects and tasks",
                  "Promote a member to Admin (swap)",
                  "Cannot promote to Owner",
                ],
              },
              {
                role: "Member",
                icon: Users,
                color: "bg-secondary text-secondary-foreground",
                desc: "Focus on the work that's been assigned to you.",
                features: [
                  "Everyone else in the workspace",
                  "View projects & assigned tasks",
                  "Update status and comment on own tasks",
                  "Cannot create tasks or manage members",
                ],
              },
            ].map((r, i) => {
              const Icon = r.icon;
              return (
                <Reveal key={i} delay={i * 0.1}>
                  <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow border-border">
                    <div className={`${r.color} p-6`}>
                      <Icon className="w-8 h-8 mb-4" />
                      <h3 className="text-2xl font-bold">{r.role}</h3>
                      <p className="text-sm opacity-90 mt-2">{r.desc}</p>
                    </div>
                    <CardContent className="p-6">
                      <ul className="space-y-3">
                        {r.features.map((f, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </Reveal>
              );
            })}
          </div>

          <Reveal delay={0.3}>
            <p className="text-center text-sm text-muted-foreground mt-10 max-w-xl mx-auto">
              Role changes are always scoped to a single workspace. Your role
              in one workspace never affects your role in another.
            </p>
          </Reveal>
        </div>
      </section>

      <section id="stats" className="px-6 lg:px-14 py-24 md:py-32 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { value: 50000, suffix: "+", label: "Tasks Completed" },
                { value: 12000, suffix: "+", label: "Active Teams" },
                { value: 99, suffix: "%", label: "Uptime" },
                { value: 4, suffix: ".9", label: "Avg Rating" },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-4xl md:text-5xl font-extrabold text-primary mb-2">
                    <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="px-6 lg:px-14 py-24 md:py-32 bg-secondary/10">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">
                How it works
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
                Get started in three steps
              </h2>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Create your account",
                desc: "Sign up with your email. Your account is ready instantly.",
              },
              {
                step: "02",
                title: "Get invited",
                desc: "An Owner or Admin invites you to their workspace. You'll receive a link.",
              },
              {
                step: "03",
                title: "Start working",
                desc: "See your tasks, update statuses, and collaborate with your team.",
              },
            ].map((s, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div className="relative">
                  <div className="text-6xl font-extrabold text-accent/30 mb-4">
                    {s.step}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{s.title}</h3>
                  <p className="text-muted-foreground">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section
        id="testimonials"
        className="px-6 lg:px-14 py-24 md:py-32 scroll-mt-20"
      >
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">
                Testimonials
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
                Loved by teams worldwide
              </h2>
              <p className="text-muted-foreground text-lg">
                Real teams. Real results.
              </p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Sarah Johnson",
                role: "Product Lead, Vertex",
                initials: "SJ",
                text: "Keystone replaced three tools for us. The role-based permissions are exactly what we needed.",
              },
              {
                name: "Michael Chen",
                role: "CTO, Nimbus",
                initials: "MC",
                text: "The activity feed and real-time updates keep our remote team perfectly in sync.",
              },
              {
                name: "Amelia Rodriguez",
                role: "Founder, Aster",
                initials: "AR",
                text: "Clean, fast, and the API is a dream to work with. Our team adopted it in a single day.",
              },
            ].map((t, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div
                  className={`group relative h-full rounded-[1.75rem] p-8 flex flex-col justify-between overflow-hidden transition-all duration-300 hover:-translate-y-1 ${
                    i === 1
                      ? "bg-primary text-primary-foreground border-2 border-primary shadow-[8px_8px_0_0_var(--color-accent)]"
                      : "bg-card border-2 border-border hover:border-primary shadow-[4px_4px_0_0_transparent] hover:shadow-[8px_8px_0_0_var(--color-primary)]"
                  }`}
                >
                  <Quote className="w-8 h-8 text-accent" />
                  <p
                    className={`my-6 leading-relaxed ${
                      i === 1
                        ? "text-primary-foreground/90 text-lg"
                        : "text-foreground text-base"
                    }`}
                  >
                    "{t.text}"
                  </p>
                  <div
                    className={`flex items-center gap-3 pt-6 border-t ${
                      i === 1
                        ? "border-primary-foreground/20"
                        : "border-dashed border-border"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                        i === 1
                          ? "bg-accent text-accent-foreground"
                          : "bg-accent/25 text-primary"
                      }`}
                    >
                      {t.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{t.name}</p>
                      <p
                        className={`text-xs truncate ${
                          i === 1
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        }`}
                      >
                        {t.role}
                      </p>
                    </div>
                    <div className="ml-auto flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className="w-3.5 h-3.5 fill-accent text-accent"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section
        id="faq"
        className="px-6 lg:px-14 py-24 md:py-32 bg-secondary/10 scroll-mt-20"
      >
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">
                FAQ
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
                Frequently asked questions
              </h2>
            </div>
          </Reveal>

          <div className="space-y-3">
            {[
              {
                q: "Is Keystone free?",
                a: "Yes. Create an account for free and join any workspace you're invited to.",
              },
              {
                q: "How do I get access?",
                a: "Keystone is invite-only. An Owner or Admin of a workspace invites you by email, and you'll receive a link to join.",
              },
              {
                q: "Can I change roles later?",
                a: "Owners and Admins can update member roles at any time from the Team management page. Role changes are always scoped to a single workspace.",
              },
              {
                q: "How secure is my data?",
                a: "We use industry-standard encryption, secure password hashing, and enforce authorization on every API call.",
              },
              {
                q: "Do you support real-time collaboration?",
                a: "Yes. Task updates, comments, and activity feeds are pushed in real-time.",
              },
            ].map((item, i) => (
              <Reveal key={i} delay={i * 0.05}>
                <FAQItem question={item.q} answer={item.a} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 lg:px-14 py-24 md:py-32">
        <Reveal>
          <div className="relative max-w-5xl mx-auto rounded-[2rem] overflow-hidden bg-primary">
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 15% 20%, rgba(224,175,160,0.35), transparent 55%), radial-gradient(circle at 85% 80%, rgba(224,175,160,0.25), transparent 55%)",
              }}
            />
            <div
              aria-hidden
              className="absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage:
                  "radial-gradient(circle, rgba(244,243,238,0.6) 1px, transparent 1px)",
                backgroundSize: "22px 22px",
              }}
            />

            <div className="relative px-8 py-14 md:px-20 md:py-20 text-center space-y-7">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary-foreground/80">
                <Sparkles className="w-3.5 h-3.5" />
                Get started
              </span>

              <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-primary-foreground tracking-tight leading-[1.05]">
                Ready to level up
                <br />
                your team?
              </h2>

              <p className="text-primary-foreground/75 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
                Create your account in seconds. Join a workspace when you're
                invited — and start shipping faster with your team.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Link href="/register" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="h-12 px-8 text-base font-semibold w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90 border border-transparent shadow-lg shadow-accent/20"
                  >
                    Create account <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/login" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 px-8 text-base font-semibold w-full sm:w-auto bg-transparent text-primary-foreground border-primary-foreground/40 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                  >
                    Log in
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 pt-4 text-xs text-primary-foreground/60">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> No credit card
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Free to use
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Invite-only
                  workspaces
                </span>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}

function FAQItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-secondary/5 transition-colors"
      >
        <span className="font-semibold">{question}</span>
        {isOpen ? (
          <Minus className="w-5 h-5 text-accent shrink-0" />
        ) : (
          <Plus className="w-5 h-5 text-accent shrink-0" />
        )}
      </button>
      <div
        className={`grid transition-all duration-300 ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <p className="px-6 pb-6 text-muted-foreground leading-relaxed">
            {answer}
          </p>
        </div>
      </div>
    </Card>
  );
}