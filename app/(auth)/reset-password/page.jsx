"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { CheckCircle2 } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset password.");
      setSuccess(true);
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6 text-center"
      >
        <div className="w-14 h-14 mx-auto rounded-full bg-accent/20 flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7 text-accent-foreground" />
        </div>
        <h1 className="text-2xl font-bold">Password reset</h1>
        <p className="text-muted-foreground text-sm">Redirecting you to log in…</p>
      </motion.div>
    );
  }

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-bold">Invalid reset link</h1>
        <p className="text-muted-foreground text-sm">This link is missing a token.</p>
        <Link href="/forgot-password" className="text-accent-foreground hover:underline font-medium">
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
          Set a new password
        </h1>
        <p className="text-muted-foreground">
          Your new password must be different from your previous one.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm password</Label>
          <PasswordInput
            id="confirm"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            autoComplete="new-password"
          />
          <p className="text-xs text-muted-foreground">Must be at least 8 characters long.</p>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Button type="submit" disabled={loading} className="w-full h-12 text-base font-semibold">
          {loading ? "Resetting…" : "Reset password"}
        </Button>
      </form>
    </motion.div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 animate-pulse">
          <div className="h-9 w-64 bg-muted/40 rounded-lg" />
          <div className="h-4 w-80 bg-muted/30 rounded" />
          <div className="space-y-4 pt-4">
            <div className="h-12 bg-muted/30 rounded-lg" />
            <div className="h-12 bg-muted/30 rounded-lg" />
            <div className="h-12 bg-muted/30 rounded-lg" />
          </div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}