"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Shield,
  Zap,
  Users,
  CheckCircle2,
  Mail,
  Lock,
  UserPlus,
  LogIn,
} from "lucide-react";
import { LogoMark } from "@/components/brand/LogoMark";

function AuthIllustration() {
  return (
    <div className="relative w-full max-w-sm mx-auto">
      <div className="absolute inset-0 bg-accent/20 blur-3xl rounded-full scale-90" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.15 }}
        className="relative"
      >
        <div className="relative bg-card border border-border rounded-2xl shadow-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-[10px] font-bold">
                  K
                </span>
              </div>
              <div>
                <p className="text-[10px] font-semibold leading-none">
                  Website Redesign
                </p>
                <p className="text-[8px] text-muted-foreground mt-0.5">
                  3 columns · 7 tasks
                </p>
              </div>
            </div>
            <div className="flex -space-x-1.5">
              {["JD", "AS", "MK"].map((i) => (
                <div
                  key={i}
                  className="w-5 h-5 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[7px] font-bold"
                >
                  {i}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { title: "To Do", color: "bg-muted-foreground/60", items: 3 },
              { title: "Progress", color: "bg-accent", items: 2 },
              { title: "Done", color: "bg-primary", items: 2 },
            ].map((col) => (
              <div key={col.title} className="space-y-1.5">
                <div className="flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${col.color}`} />
                  <span className="text-[8px] font-medium">{col.title}</span>
                </div>
                {Array.from({ length: col.items }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-muted/40 rounded-md p-1.5 space-y-1"
                  >
                    <div className="h-1 w-3/4 bg-foreground/20 rounded-full" />
                    <div className="h-1 w-1/2 bg-foreground/10 rounded-full" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="absolute -left-3 -top-4 bg-card border rounded-xl shadow-lg px-3 py-2 flex items-center gap-2"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
          <div>
            <p className="text-[9px] font-bold leading-none">+78 tasks</p>
            <p className="text-[8px] text-muted-foreground mt-0.5">
              completed
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="absolute -right-3 -bottom-4 bg-card border rounded-xl shadow-lg px-3 py-2 flex items-center gap-2"
        >
          <Users className="w-3.5 h-3.5 text-accent" />
          <div>
            <p className="text-[9px] font-bold leading-none">12 members</p>
            <p className="text-[8px] text-muted-foreground mt-0.5">
              active now
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

/**
 * Keys here are the *public* pathnames (no route group).
 * The `(auth)` group does not appear in `usePathname()`.
 */
const pageContent = {
  "/login": {
    icon: LogIn,
    badge: "Welcome back",
    title: "Log in to your workspace",
    description:
      "Pick up right where you left off. Your projects, tasks, and teammates are waiting.",
    bullets: [
      "Real-time task updates",
      "Collaborate with your team",
      "Track progress across projects",
    ],
  },
  "/register": {
    icon: UserPlus,
    badge: "Get started",
    title: "Create your workspace",
    description:
      "Set up your account in under a minute. You'll be the Owner of a private workspace, ready for your team.",
    bullets: [
      "Free to use",
      "Unlimited projects & tasks",
      "Invite your team",
    ],
  },
  "/forgot-password": {
    icon: Mail,
    badge: "Recovery",
    title: "Let's get you back in",
    description:
      "Enter the email you signed up with, and we'll send a secure link to reset your password.",
    bullets: [
      "Secure reset link",
      "Expires in 15 minutes",
      "Check your spam folder",
    ],
  },
  "/reset-password": {
    icon: Lock,
    badge: "New password",
    title: "Choose a new password",
    description:
      "Make it strong and unique. Your new password should be at least 8 characters long.",
    bullets: [
      "Use a mix of letters & numbers",
      "Avoid common words",
      "Never reuse old passwords",
    ],
  },
  "/set-password": {
    icon: Lock,
    badge: "You're invited",
    title: "Set up your access",
    description:
      "Choose a password and you're in. Your team is waiting inside the workspace.",
    bullets: [
      "Secure account setup",
      "Takes less than a minute",
      "Join your team instantly",
    ],
  },
};

const FALLBACK = pageContent["/login"];

export default function AuthLayout({ children }) {
  const pathname = usePathname();
  const content = pageContent[pathname] || FALLBACK;
  const PageIcon = content.icon;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-10 bg-background relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute top-[8%] left-[12%] w-[380px] h-[380px] rounded-full bg-accent/35 blur-[120px]" />
        <div className="absolute bottom-[6%] right-[10%] w-[440px] h-[440px] rounded-full bg-muted/60 blur-[130px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-secondary/20 blur-[140px]" />
        <div className="absolute inset-0 bg-background/40" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-6xl rounded-[2rem] border border-border/70 bg-card/85 backdrop-blur-2xl shadow-[0_30px_90px_-30px_rgba(70,63,58,0.35)] overflow-hidden"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[2rem] ring-1 ring-inset ring-white/40"
        />

        <div className="relative grid lg:grid-cols-2">
          {/* ===== LEFT: Brand panel ===== */}
          <div className="relative hidden lg:flex flex-col justify-between p-10 xl:p-12 bg-secondary/10 overflow-hidden border-r border-border/60">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 right-0 w-72 h-72 bg-accent/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-72 h-72 bg-secondary/20 rounded-full blur-3xl" />
            </div>

            <Link href="/" className="relative flex items-center gap-2.5 w-fit">
              <motion.div
                whileHover={{ rotate: -6, scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <LogoMark size={40} />
              </motion.div>
              <span className="text-2xl font-bold tracking-tight">
                Keystone
              </span>
            </Link>

            <div className="relative flex-1 flex flex-col items-center justify-center py-8">
              <AuthIllustration />

              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-center mt-8 max-w-md"
              >
                <div className="inline-flex items-center gap-2 rounded-full border border-accent bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent-foreground mb-4">
                  <PageIcon className="w-3.5 h-3.5" />
                  {content.badge}
                </div>

                <h2 className="text-2xl xl:text-3xl font-extrabold tracking-tight mb-3">
                  {content.title}
                </h2>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  {content.description}
                </p>

                <ul className="mt-6 space-y-2 text-left inline-block">
                  {content.bullets.map((bullet, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                      {bullet}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>

            <div className="relative flex items-center justify-center gap-5 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-accent" /> Secure
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-accent" /> Fast
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-accent" /> Team-ready
              </div>
            </div>
          </div>

          {/* ===== RIGHT: Form ===== */}
          <div className="relative flex items-center justify-center p-6 sm:p-10 lg:p-12">
            <div className="w-full max-w-md">
              <Link
                href="/"
                className="lg:hidden relative flex items-center gap-2.5 w-fit mb-8"
              >
                <LogoMark size={40} />
                <span className="text-2xl font-bold tracking-tight">
                  Keystone
                </span>
              </Link>

              {children}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}