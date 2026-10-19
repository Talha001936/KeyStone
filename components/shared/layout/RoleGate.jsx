"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { LogoMark } from "@/components/brand/LogoMark";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

function FullScreenLoader({ label = "Loading…" }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <LogoMark size={40} className="animate-pulse" />
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function AuthErrorState({ onRetry }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md text-center space-y-5">
        <div className="w-14 h-14 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="w-7 h-7 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Couldn&apos;t load your session</h1>
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

export function RoleGate({ role, children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { status, loading: authLoading, refresh } = useAuth();
  const { hasWorkspace, currentWorkspace, loading: wsLoading } = useWorkspace();

  const loading = authLoading || wsLoading;
  const workspaceRole = currentWorkspace?.role;

  const isUnauthenticated = status === "unauthenticated";
  const isError = status === "error";

  const roleMismatch =
    !loading && hasWorkspace && workspaceRole && workspaceRole !== role;

  useEffect(() => {
    if (loading) return;
    if (isUnauthenticated) {
      const next =
        typeof window !== "undefined"
          ? window.location.pathname + window.location.search
          : "";
      router.replace(`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`);
    }
  }, [loading, isUnauthenticated, router]);

  useEffect(() => {
    if (loading) return;
    if (!hasWorkspace) return;
    if (!workspaceRole) return;
    if (roleMismatch) router.replace(`/${workspaceRole}`);
  }, [loading, hasWorkspace, roleMismatch, workspaceRole, router]);

  useEffect(() => {
    const onForbidden = () => {
      if (typeof window === "undefined") return;
      const own = workspaceRole ? `/${workspaceRole}` : "/";
      if (pathname === own || pathname === "/") return;
      router.replace(own);
    };
    window.addEventListener("tf:forbidden", onForbidden);
    return () => window.removeEventListener("tf:forbidden", onForbidden);
  }, [pathname, workspaceRole, router]);

  const showLoader = loading;
  const showError = !loading && isError;
  const showUnauthLoader = !loading && isUnauthenticated;
  const showRoleMismatchLoader = !loading && hasWorkspace && !!roleMismatch;

  const blocked =
    showLoader || showError || showUnauthLoader || showRoleMismatchLoader;

  return (
    <>
      <div
        className={blocked ? "invisible pointer-events-none" : undefined}
        aria-hidden={blocked || undefined}
      >
        {children}
      </div>

      {blocked && (
        <div className="fixed inset-0 z-40 bg-background overflow-y-auto">
          {showLoader && <FullScreenLoader label="Loading…" />}
          {showError && <AuthErrorState onRetry={refresh} />}
          {showUnauthLoader && (
            <FullScreenLoader label="Redirecting to login…" />
          )}
          {showRoleMismatchLoader && <FullScreenLoader label="Redirecting…" />}
        </div>
      )}
    </>
  );
}