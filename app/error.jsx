// app/error.jsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";

export default function GlobalError({ error, reset }) {
  const { status, memberships, loading: authLoading } = useAuth();
  const { currentWorkspace, loading: wsLoading } = useWorkspace();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    console.error("[app/error]", error);
  }, [error]);

  const loading = authLoading || wsLoading;
  const isAuthed = status === "authenticated";

  const resolveHome = () => {
    if (isAuthed) {
      const role = currentWorkspace?.role || memberships?.[0]?.role || null;
      return role ? `/${role}` : "/owner";
    }
    return "/";
  };

  const goHome = () => {
    if (busy) return;
    setBusy(true);
    const target = resolveHome();
    if (typeof window !== "undefined") {
      window.location.href = target;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="max-w-md w-full text-center space-y-5">
        <div className="w-14 h-14 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="w-7 h-7 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="text-sm text-muted-foreground">
            An unexpected error occurred. You can try again, or return to the
            {isAuthed ? " dashboard." : " home page."}
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset}>
            <RefreshCw className="w-4 h-4 mr-2" /> Try again
          </Button>
          <Button variant="outline" onClick={goHome} disabled={loading || busy}>
            {busy ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Redirecting…
              </>
            ) : isAuthed ? (
              "Go to dashboard"
            ) : (
              "Go home"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}