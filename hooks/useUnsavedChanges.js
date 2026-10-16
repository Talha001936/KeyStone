// hooks/useUnsavedChanges.js
"use client";

import { useCallback, useEffect, useState } from "react";

export function useUnsavedChanges() {
  const [hasChanges, setHasChanges] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const guard = useCallback(
    (action) => {
      if (hasChanges) {
        setPendingAction(() => action);
        setDialogOpen(true);
      } else {
        action();
      }
    },
    [hasChanges]
  );

  const confirmDiscard = useCallback(() => {
    setDialogOpen(false);
    const action = pendingAction;
    setPendingAction(null);
    setHasChanges(false);
    if (action) action();
  }, [pendingAction]);

  const cancelDiscard = useCallback(() => {
    setDialogOpen(false);
    setPendingAction(null);
  }, []);

  useEffect(() => {
    if (!hasChanges) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasChanges]);

  return {
    hasChanges,
    setHasChanges,
    dialogOpen,
    confirmDiscard,
    cancelDiscard,
    guard,
  };
}