// app/(guest)/faq/page.jsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Reveal } from "@/components/landing/Reveal";
import { GuestHero } from "@/components/guest/GuestHero";
import { Plus, Minus, ArrowRight, MessageCircle } from "lucide-react";

const SECTIONS = [
  {
    title: "Getting started",
    items: [
      {
        q: "How do I create a Keystone account?",
        a: "Click 'Get Started' anywhere on the site, or go to the Register page directly. Enter your name, email, and a password (at least 8 characters). Your account is ready immediately.",
      },
      {
        q: "How do I get access to a workspace?",
        a: "Keystone is invite-only. An Owner or Admin of an existing workspace invites you by email. You'll receive a link with a token — click it, set up your credentials if you're new, and you'll be added to the workspace automatically.",
      },
      {
        q: "What happens if I register but I'm not invited to any workspace?",
        a: "You'll see a welcome card explaining that you aren't part of any workspace yet. The card stays until an Owner or Admin invites you. You won't have access to any dashboard content until then.",
      },
    ],
  },
  {
    title: "Roles & permissions",
    items: [
      {
        q: "What roles exist in a workspace?",
        a: "Three: Owner (exactly one), Admin (at most one), and Member (everyone else). Each workspace's roles are independent — your role in one workspace doesn't affect your role in another.",
      },
      {
        q: "Can an Admin promote a Member to Owner?",
        a: "No. Only the current Owner can transfer ownership, and doing so swaps roles — the target becomes Owner, and the previous Owner becomes Admin.",
      },
      {
        q: "How does an Admin promote a Member to Admin?",
        a: "It's a role swap. The Member becomes the new Admin, and the current Admin becomes a Member. This keeps exactly one Admin per workspace at all times.",
      },
      {
        q: "Can I change my own role?",
        a: "No. Only the Owner and Admin can change other members' roles, and they cannot change their own — you have to be promoted or demoted by someone else.",
      },
    ],
  },
  {
    title: "Tasks & collaboration",
    items: [
      {
        q: "Who can create tasks?",
        a: "Owners and Admins. Members cannot create tasks — they work on tasks assigned to them.",
      },
      {
        q: "Can Members comment on tasks?",
        a: "Yes, if the task is assigned to them. They can also update the status of their own tasks. Owners and Admins can comment on any task in their workspace.",
      },
      {
        q: "What happens to comments when a task is deleted?",
        a: "They're removed along with the task. Deleting a task is permanent and cannot be undone.",
      },
      {
        q: "Do task updates happen in real-time?",
        a: "Yes. Status changes, new comments, and activity updates are pushed to connected clients instantly.",
      },
    ],
  },
  {
    title: "Security",
    items: [
      {
        q: "How are passwords stored?",
        a: "Passwords are hashed with scrypt and a random per-user salt. Plaintext passwords never touch the database or logs.",
      },
      {
        q: "How is authorization enforced?",
        a: "Every API endpoint checks your session and your active membership in the target workspace. Client-side UI is a convenience only — the server is the authority.",
      },
      {
        q: "Can I use the same email across multiple workspaces?",
        a: "Yes. Your account is global, but your memberships are per-workspace. You can be an Owner in one workspace, an Admin in another, and a Member in a third.",
      },
    ],
  },
];

function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="overflow-hidden border-border transition-colors hover:border-primary/40">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 p-6 text-left hover:bg-secondary/5 transition-colors"
      >
        <span className="font-semibold">{question}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="shrink-0"
        >
          {open ? (
            <Minus className="w-5 h-5 text-accent" />
          ) : (
            <Plus className="w-5 h-5 text-accent" />
          )}
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-6 text-muted-foreground leading-relaxed">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

export default function FAQPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <GuestHero
        badge="FAQ"
        title="Frequently asked questions"
        highlight="asked questions"
        description="Answers to the questions we hear most often. Can't find what you're looking for? Reach out on the contact page."
      />

      <section className="px-6 lg:px-14 py-24">
        <div className="max-w-3xl mx-auto space-y-12">
          {SECTIONS.map((section, i) => (
            <Reveal key={i} delay={i * 0.05}>
              <div>
                <h2 className="text-xl font-bold tracking-tight mb-4">
                  {section.title}
                </h2>
                <div className="space-y-3">
                  {section.items.map((item, j) => (
                    <FAQItem key={j} question={item.q} answer={item.a} />
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="px-6 lg:px-14 pb-24">
        <Reveal>
          <div className="max-w-3xl mx-auto text-center space-y-5 rounded-3xl border border-border bg-card p-10">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-accent/25 border border-accent/50 flex items-center justify-center">
              <MessageCircle
                className="w-6 h-6 text-primary"
                strokeWidth={1.75}
              />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              Still have questions?
            </h2>
            <p className="text-muted-foreground">We&apos;re happy to help.</p>
            <Link href="/contact">
              <Button size="lg" className="h-12 px-8 mt-2">
                Contact us <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </Reveal>
      </section>
    </motion.div>
  );
}