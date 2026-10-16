// components/shared/layout/NoWorkspaceState.jsx
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, LogOut, Mail, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export function NoWorkspaceState() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-background">
      <Card className="max-w-lg w-full p-8 text-center space-y-5">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-accent/25 border border-accent/50 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            You're not in a workspace yet
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Keystone is invite-only. Ask the Owner or Admin of a workspace to
            invite your email. Once they do, you'll be able to join with one
            click.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-left">
          <div className="flex items-start gap-2">
            <Mail className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
            <p className="text-muted-foreground">
              Ask them to invite you from{" "}
              <span className="font-medium text-foreground">
                Team → Invite member
              </span>
              .
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link href="/">
            <Button variant="outline" className="w-full sm:w-auto">
              Back to home
            </Button>
          </Link>
          <Link href="/contact">
            <Button className="w-full sm:w-auto">
              Contact support <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>

        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors pt-2"
        >
          <LogOut className="w-3.5 h-3.5" />
          Log out
        </button>
      </Card>
    </div>
  );
}