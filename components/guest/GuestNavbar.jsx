// components/guest/GuestNavbar.jsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";

const SECTION_LINKS = [
  { id: "features", label: "Features" },
  { id: "roles", label: "Roles" },
  { id: "stats", label: "Why Us" },
  { id: "testimonials", label: "Reviews" },
  { id: "faq", label: "FAQ" },
];

const PAGE_LINKS = [
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

const EASE = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export function GuestNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  const onLanding = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!onLanding) return;
    const onScroll = () => {
      const scrollPos = window.scrollY + 120;
      let current = "";
      for (const link of SECTION_LINKS) {
        const el = document.getElementById(link.id);
        if (el && el.offsetTop <= scrollPos) current = link.id;
      }
      setActiveSection(current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [onLanding]);

  const handleSectionClick = (e, id) => {
    if (!onLanding) {
      e.preventDefault();
      router.push(`/#${id}`);
      return;
    }
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;

    const NAV_OFFSET = 80;
    const targetY =
      el.getBoundingClientRect().top + window.scrollY - NAV_OFFSET;
    const startY = window.scrollY;
    const distance = targetY - startY;
    const duration = 800;
    let startTime;

    const animateScroll = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      window.scrollTo(0, startY + distance * EASE(progress));
      if (progress < 1) requestAnimationFrame(animateScroll);
    };
    requestAnimationFrame(animateScroll);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "h-[76px] bg-background/60 backdrop-blur-2xl border-b border-border/50 shadow-sm"
          : "h-[88px] bg-transparent border-b border-transparent"
      }`}
    >
      <div className="h-full px-6 lg:px-14 flex items-center justify-between max-w-[1600px] mx-auto">
        <motion.div
          whileHover={{ rotate: -3, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 22 }}
        >
          <Logo size="lg" />
        </motion.div>

        <nav className="hidden md:flex gap-9 font-semibold text-[15px] items-center">
          <AnimatePresence mode="wait" initial={false}>
            {onLanding ? (
              <motion.div
                key="sections"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="flex gap-9"
              >
                {SECTION_LINKS.map((link) => {
                  const isActive = activeSection === link.id;
                  return (
                    <a
                      key={link.id}
                      href={`/#${link.id}`}
                      onClick={(e) => handleSectionClick(e, link.id)}
                      className={`relative py-2 transition-colors ${
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground hover:text-primary"
                      }`}
                    >
                      {link.label}
                      {isActive && (
                        <motion.span
                          layoutId="navUnderlineSections"
                          className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-accent rounded-full"
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 35,
                          }}
                        />
                      )}
                    </a>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div
                key="pages"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="flex gap-7"
              >
                {PAGE_LINKS.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`relative py-2 transition-colors ${
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground hover:text-primary"
                      }`}
                    >
                      {link.label}
                      {isActive && (
                        <motion.span
                          layoutId="navUnderlinePages"
                          className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-accent rounded-full"
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 35,
                          }}
                        />
                      )}
                    </Link>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button
              variant="ghost"
              className="font-semibold h-11 px-5 text-[15px] hover:bg-secondary/15"
            >
              Log in
            </Button>
          </Link>
          <Link href="/register">
            <Button className="font-semibold h-11 px-6 text-[15px] shadow-sm">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}