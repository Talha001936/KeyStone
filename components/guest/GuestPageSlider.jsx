// components/guest/GuestPageSlider.jsx
"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { LogoMark } from "@/components/brand/LogoMark";

export function GuestPageSlider() {
  const pathname = usePathname();
  const [transitioning, setTransitioning] = useState(false);
  const [previousPath, setPreviousPath] = useState(pathname);

  useEffect(() => {
    if (pathname === previousPath) return;
    setTransitioning(true);
    const t = setTimeout(() => {
      setTransitioning(false);
      setPreviousPath(pathname);
    }, 900);
    return () => clearTimeout(t);
  }, [pathname, previousPath]);

  return (
    <AnimatePresence>
      {transitioning && (
        <motion.div
          key="sweep"
          initial={{ x: "-100%" }}
          animate={{ x: "0%" }}
          exit={{ x: "100%" }}
          transition={{
            x: { duration: 0.45, ease: [0.76, 0, 0.24, 1] },
          }}
          className="fixed inset-0 z-[60] pointer-events-none"
        >
          <div className="absolute inset-0 bg-primary" />
          <div className="absolute inset-y-0 right-0 w-32 bg-accent" />
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(244,243,238,0.9) 1px, transparent 1px)",
              backgroundSize: "18px 18px",
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
            >
              <LogoMark
                size={48}
                radius="1rem"
                className="bg-accent text-accent-foreground shadow-lg"
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}