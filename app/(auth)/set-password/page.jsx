"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { useToast } from "@/contexts/ToastContext";
import { Loader2, CheckCircle2 } from "lucide-react";

function SetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const token = params.get("token") || "";

  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  const [success, setSuccess] = useState(false);
  const [autoJoining, setAutoJoining] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Missing invite token.");
      setLoading(false);
      return;
    }
    fetch(`/api/auth/set-password?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setInvite(d.invite);
        
        // If they already have an account, automatically join them!
        if (d.invite.hasPassword) {
          autoJoin();
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const autoJoin = async () => {
    setAutoJoining(true);
    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to join workspace.");

      setSuccess(true);
      toast.success("Joined workspace successfully.");
      
      setTimeout(() => {
        router.replace(`/login?email=${encodeURIComponent(data.email)}`);
      }, 2000);
    } catch (err) {
      setError(err.message);
      setAutoJoining(false);
    }
  };

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

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to join workspace.");

      setSuccess(true);
      toast.success("Password set! Joined workspace.");
      
      setTimeout(() => {
        router.replace(`/login?email=${encodeURIComponent(data.email)}`);
      }, 2000);
      
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  if (loading || autoJoining) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 text-sm text-muted-foreground py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p>{autoJoining ? "Adding you to the workspace…" : "Verifying invite…"}</p>
      </div>
    );
  }

  if (error && (!invite || !success)) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-bold">Invalid invite</h1>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Link href="/login" className="text-sm text-accent-foreground hover:underline font-medium">
          Go to log in
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-6 text-center py-12"
      >
        <div className="w-16 h-16 mx-auto rounded-full bg-accent/20 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-accent-foreground" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight">Welcome aboard!</h1>
          <p className="text-muted-foreground text-lg">
            You've been successfully added to <strong>{invite.workspaceName}</strong>.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Redirecting you to the login page…
          </p>
        </div>
      </motion.div>
    );
  }

  // If we reach here, they are a new user and need to set a password.
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Set your password</h1>
        <p className="text-muted-foreground">
          Welcome, <strong>{invite.name}</strong>. You've been invited to <strong>{invite.workspaceName}</strong> as <strong>{invite.role}</strong>.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={invite.email} disabled className="h-12 text-base bg-muted" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
          <p className="text-xs text-muted-foreground">Must be at least 8 characters long.</p>
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
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Button type="submit" disabled={submitting} className="w-full h-12 text-base font-semibold">
          {submitting ? "Joining…" : "Set Password & Join"}
        </Button>
      </form>
    </motion.div>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground py-12">Loading…</div>}>
      <SetPasswordForm />
    </Suspense>
  );
}