// components/shared/layout/RoleLayout.jsx
"use client";

import { Suspense } from "react";
import { Navbar } from "@/components/shared/layout/Navbar";
import { Sidebar } from "@/components/shared/layout/Sidebar";

function SidebarSkeleton() {
  return (
    <aside className="hidden lg:flex flex-col w-[260px] border-r bg-card h-[calc(100vh-64px)] sticky top-16">
      <div className="p-5 border-b">
        <div className="h-12 rounded-lg bg-muted/40 animate-pulse" />
      </div>
      <div className="p-3 space-y-1.5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-10 rounded-lg bg-muted/30 animate-pulse" />
        ))}
      </div>
    </aside>
  );
}

export function RoleLayout({ role, children }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex flex-1">
        <Suspense fallback={<SidebarSkeleton />}>
          <Sidebar role={role} />
        </Suspense>
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-8 lg:py-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}