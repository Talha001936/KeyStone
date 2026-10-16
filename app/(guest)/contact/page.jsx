// app/(guest)/contact/page.jsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Reveal } from "@/components/landing/Reveal";
import { GuestHero } from "@/components/guest/GuestHero";
import {
  Mail,
  MessageSquare,
  Clock,
  CheckCircle2,
  Send,
} from "lucide-react";

const CHANNELS = [
  {
    icon: Mail,
    title: "Email",
    detail: "hello@keystone.app",
    hint: "We reply within 24 hours on weekdays.",
  },
  {
    icon: MessageSquare,
    title: "Support",
    detail: "support@keystone.app",
    hint: "For technical issues and bug reports.",
  },
  {
    icon: Clock,
    title: "Business hours",
    detail: "Mon–Fri · 9am–6pm",
    hint: "Times are shown in your local timezone.",
  },
];

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    await new Promise((r) => setTimeout(r, 700));
    setSending(false);
    setSent(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <GuestHero
        badge="Contact"
        title="Get in touch"
        highlight="in touch"
        description="Have a question, an idea, or a bug to report? We'd love to hear from you."
      />

      <section className="px-6 lg:px-14 py-24">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-4">
            {CHANNELS.map((c, i) => {
              const Icon = c.icon;
              return (
                <Reveal key={i} delay={i * 0.08}>
                  <Card className="group p-6 border-border hover:border-primary transition-all duration-300 hover:-translate-y-1 hover:shadow-[6px_6px_0_0_var(--color-primary)]">
                    <CardContent className="p-0 space-y-2">
                      <div className="relative w-10 h-10 mb-3">
                        <div className="absolute inset-0 rounded-xl bg-accent/40 blur-lg scale-75 group-hover:scale-100 transition-transform duration-500" />
                        <div className="relative w-10 h-10 rounded-xl bg-accent/25 border border-accent/50 flex items-center justify-center">
                          <Icon
                            className="w-5 h-5 text-primary"
                            strokeWidth={1.75}
                          />
                        </div>
                      </div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {c.title}
                      </p>
                      <p className="font-semibold">{c.detail}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {c.hint}
                      </p>
                    </CardContent>
                  </Card>
                </Reveal>
              );
            })}
          </div>

          <Reveal delay={0.15} className="lg:col-span-2">
            <Card className="p-8 border-border">
              <CardContent className="p-0">
                <AnimatePresence mode="wait">
                  {sent ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{
                        duration: 0.4,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="py-16 text-center space-y-4"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 20,
                          delay: 0.1,
                        }}
                        className="w-14 h-14 mx-auto rounded-full bg-accent/20 flex items-center justify-center"
                      >
                        <CheckCircle2 className="w-7 h-7 text-accent-foreground" />
                      </motion.div>
                      <h2 className="text-xl font-bold">Message received</h2>
                      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                        Thanks for reaching out. We&apos;ll get back to you at{" "}
                        <span className="font-medium text-foreground">
                          {email}
                        </span>{" "}
                        within 24 hours.
                      </p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => {
                          setSent(false);
                          setName("");
                          setEmail("");
                          setMessage("");
                        }}
                      >
                        Send another
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.form
                      key="form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onSubmit={handleSubmit}
                      className="space-y-5"
                    >
                      <h2 className="text-xl font-bold mb-1">
                        Send us a message
                      </h2>
                      <p className="text-sm text-muted-foreground mb-4">
                        Fill out the form and we&apos;ll respond as soon as we
                        can.
                      </p>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Name</Label>
                          <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your name"
                            className="h-11"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@email.com"
                            className="h-11"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                          id="message"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="How can we help?"
                          className="min-h-[160px]"
                          required
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={sending}
                        className="h-11 px-6 w-full sm:w-auto"
                      >
                        {sending ? (
                          <>
                            <motion.span
                              animate={{ rotate: 360 }}
                              transition={{
                                repeat: Infinity,
                                duration: 0.8,
                                ease: "linear",
                              }}
                              className="inline-block mr-2"
                            >
                              <Send className="w-4 h-4" />
                            </motion.span>
                            Sending…
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Send message
                          </>
                        )}
                      </Button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </Reveal>
        </div>
      </section>
    </motion.div>
  );
}