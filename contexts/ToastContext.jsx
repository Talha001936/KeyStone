// contexts/ToastContext.jsx
"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/cn";

const ToastContext = createContext(null);

let _id = 0;
const nextId = () => `t_${++_id}`;

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const COLORS = {
  success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700",
  error: "border-destructive/40 bg-destructive/10 text-destructive",
  info: "border-accent/40 bg-accent/10 text-accent-foreground",
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message, { type = "info", duration = 4000 } = {}) => {
      const id = nextId();
      setToasts((prev) => [...prev, { id, message, type }]);
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss]
  );

  const success = useCallback((msg, opts) => toast(msg, { ...opts, type: "success" }), [toast]);
  const error = useCallback((msg, opts) => toast(msg, { ...opts, type: "error" }), [toast]);
  const info = useCallback((msg, opts) => toast(msg, { ...opts, type: "info" }), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, info, dismiss }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const Icon = ICONS[t.type] || ICONS.info;
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                transition={{ duration: 0.18 }}
                className={cn(
                  "flex items-start gap-3 rounded-lg border bg-card p-3 shadow-lg",
                  COLORS[t.type]
                )}
              >
                <Icon className="w-4 h-4 mt-0.5 shrink-0" />
                <p className="text-sm flex-1">{t.message}</p>
                <button
                  onClick={() => dismiss(t.id)}
                  className="text-muted-foreground hover:text-foreground p-0.5"
                  aria-label="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}