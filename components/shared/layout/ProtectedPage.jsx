// components/shared/layout/ProtectedPage.jsx
"use client";

import { motion } from "framer-motion";
import { useRequireRole } from "@/hooks/useRequireRole";
import { NoWorkspaceState } from "@/components/shared/layout/NoWorkspaceState";
import { LogoMark } from "@/components/brand/LogoMark";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

function PageLoader({ label = "Loading…" }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <LogoMark size={40} className="animate-pulse" />
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function PageError({ onRetry }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="max-w-md text-center space-y-5">
        <div className="w-14 h-14 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="w-7 h-7 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Couldn't load your session</h1>
          <p className="text-sm text-muted-foreground">
            There was a problem reaching the server. Please try again.
          </p>
        </div>
        <Button onClick={onRetry}>
          <RefreshCw className="w-4 h-4 mr-2" /> Retry
        </Button>
      </div>
    </div>
  );
}

export function ProtectedPage({ role, children }) {
  const { refresh } = useAuth();
  const {
    ready,
    loading,
    isError,
    isUnauthenticated,
    noWorkspace,
    roleMismatch,
  } = useRequireRole(role);

  // Keep the loader up during resolution AND while a mismatch is queued.
  if (loading || isUnauthenticated || roleMismatch) {
    return <PageLoader label="Loading…" />;
  }

  if (isError) return <PageError onRetry={refresh} />;
  if (noWorkspace) return <NoWorkspaceState />;
  if (!ready) return <PageLoader label="Redirecting…" />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}