// app/(auth)/forgot-password/page.jsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/contexts/ToastContext";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");

   
      toast.success(
        `If an account exists for ${email}, a reset link has been sent.`,
        { duration: 6000 }
      );
      setSent(true);
    } catch (err) {
      const message = err.message || "Failed to send reset link.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 text-center"
      >
        <div className="w-14 h-14 mx-auto rounded-full bg-accent/20 flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7 text-accent-foreground" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="text-muted-foreground text-sm">
            We've sent a password reset link to{" "}
            <span className="font-medium text-foreground">{email}</span>.
            The link expires in 15 minutes.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-4 text-xs text-left">
          <p className="text-muted-foreground leading-relaxed">
            <span className="font-medium text-foreground">
              Didn't receive the email?
            </span>{" "}
            Check your spam folder. If it still hasn't arrived, make sure you
            used the email you registered with, then try again.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button
            variant="outline"
            onClick={() => {
              setSent(false);
              setEmail("");
            }}
          >
            Send another link
          </Button>
          <Link href="/login">
            <Button>Back to log in</Button>
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <Link
        href="/login"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" /> Back to log in
      </Link>

      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
          Forgot your password?
        </h1>
        <p className="text-muted-foreground">
          Enter your email and we'll send a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@email.com"
            className="h-12 text-base"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-12 text-base font-semibold"
        >
          {loading ? "Sending…" : "Send reset link"}
        </Button>
      </form>
    </motion.div>
  );
}