// app/not-found.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Loader2 } from "lucide-react";

export default function NotFound() {
  const router = useRouter();
  const { status, memberships, loading: authLoading } = useAuth();
  const { currentWorkspace, loading: wsLoading } = useWorkspace();

  const [busy, setBusy] = useState(false);

  const loading = authLoading || wsLoading;

  const resolveHome = () => {
    if (status === "authenticated") {
      const role =
        currentWorkspace?.role ||
        memberships?.[0]?.role ||
        null;
      if (role) return `/${role}`;
      return "/owner";
    }
    return "/";
  };

  const goHome = () => {
    if (busy) return;
    setBusy(true);
    const target = resolveHome();
    if (typeof window !== "undefined") {
   
      window.location.href = target;
    } else {
      router.push(target);
    }
  };

  const isAuthed = status === "authenticated";
  const buttonLabel = loading
    ? "Loading…"
    : isAuthed
    ? "Go to dashboard"
    : "Go to home page";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="max-w-md w-full text-center space-y-5">
        <p className="text-6xl font-extrabold text-primary">404</p>
        <h1 className="text-2xl font-bold">Page not found</h1>
        <p className="text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button onClick={goHome} disabled={loading || busy}>
            {busy ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Redirecting…
              </>
            ) : (
              buttonLabel
            )}
          </Button>
          {!isAuthed && !loading && (
            <Button
              variant="outline"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.location.href = "/login";
                } else {
                  router.push("/login");
                }
              }}
            >
              Log in
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}