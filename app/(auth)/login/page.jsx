"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, Suspense } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft } from "lucide-react";

function safeNext(next) {
  if (typeof next !== "string") return null;
  if (!next.startsWith("/")) return null;
  if (next.startsWith("//")) return null;
  return next;
}

function resolveTarget(user, memberships, next) {
  const primaryRole = memberships?.[0]?.role;
  if (!primaryRole) return "/owner";
  if (next && next.startsWith(`/${primaryRole}`)) return next;
  return `/${primaryRole}`;
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const emailParam = params.get("email") || "";
  const { login, user, memberships, status, loading: authLoading } = useAuth();

  const [email, setEmail] = useState(emailParam);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const wasAuthenticatedRef = useRef(null);

  useEffect(() => {
    if (authLoading) return;
    if (wasAuthenticatedRef.current === null) {
      wasAuthenticatedRef.current = status === "authenticated";
    }
  }, [authLoading, status]);

  useEffect(() => {
    if (authLoading) return;
    if (wasAuthenticatedRef.current !== true) return;
    if (status !== "authenticated" || !user) return;
    router.replace(resolveTarget(user, memberships, next));
    router.refresh();
  }, [authLoading, status, user, memberships, next, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(email, password);

      setEmail("");
      setPassword("");

      const target = resolveTarget(data.user, data.memberships, next);
      router.replace(target);
      router.refresh();
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to home
      </Link>

      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
          Welcome back
        </h1>
        <p className="text-muted-foreground">
          Log in to continue to your workspace.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" autoComplete="on">
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
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            disabled={loading}
          />
          <div className="flex justify-end pt-1">
            <Link
              href="/forgot-password"
              className="text-sm text-accent-foreground hover:underline font-medium"
            >
              Forgot password?
            </Link>
          </div>
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
          {loading ? "Logging in…" : "Log in"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="text-primary font-semibold hover:underline"
        >
          Sign up
        </Link>
      </p>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={<div className="text-sm text-muted-foreground">Loading…</div>}
    >
      <LoginForm />
    </Suspense>
  );
}