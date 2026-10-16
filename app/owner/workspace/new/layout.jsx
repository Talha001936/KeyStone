 "use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function NewWorkspaceLayout({ children }) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="h-16 border-b bg-card/70 backdrop-blur-xl flex items-center px-4 lg:px-6 sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-base">T</span>
          </div>
          <span className="hidden md:block text-base font-bold tracking-tight">
            TaskFlow
          </span>
        </Link>
      </header>
      <main className="flex-1">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-8 lg:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}