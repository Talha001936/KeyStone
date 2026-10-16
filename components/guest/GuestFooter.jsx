// components/guest/GuestFooter.jsx
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

const CURRENT_YEAR = new Date().getFullYear();

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Home", href: "/" },
      { label: "About", href: "/about" },
      { label: "FAQ", href: "/faq" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Log in", href: "/login" },
      { label: "Create account", href: "/register" },
      { label: "Forgot password", href: "/forgot-password" },
    ],
  },
];

export function GuestFooter() {
  return (
    <footer className="border-t">
      <div className="max-w-6xl mx-auto px-6 lg:px-14 py-16 grid md:grid-cols-4 gap-10">
        <div className="space-y-4 md:col-span-1">
          <Logo size="lg" />
          <p className="text-sm text-muted-foreground max-w-xs">
            Manage projects with clarity and speed. Invite-only workspaces for
            modern teams.
          </p>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-foreground">
              {col.title}
            </h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t">
        <div className="max-w-6xl mx-auto px-6 lg:px-14 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>© {CURRENT_YEAR} Keystone. All rights reserved.</span>
          <span>Built for modern teams.</span>
        </div>
      </div>
    </footer>
  );
}