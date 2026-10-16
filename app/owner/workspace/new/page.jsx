"use client";


import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

export default function NewWorkspacePage() {
  const router = useRouter();
  const toast = useToast();
  const { refresh } = useAuth();

  const [name, setName] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = () => setHasChanges(true);

  const handleCancel = (e) => {
    if (hasChanges) {
      e.preventDefault();
      setConfirmDiscard(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      toast.error("Workspace name must be at least 2 characters.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/owner/workspace", { name: name.trim() });
      await refresh();
      toast.success("Workspace created");
      router.replace("/owner");
      router.refresh();
    } catch (err) {
      toast.error(err?.message || "Failed to create workspace.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Link
        href="/owner/workspace/settings"
        onClick={handleCancel}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">New workspace</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Create a workspace for a different team or project.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-5">
          <div>
            <h2 className="text-sm font-semibold">Workspace details</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Give your new workspace a name.
            </p>
          </div>

          <Separator />

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Workspace name</Label>
              <Input
                id="name"
                placeholder="e.g. Design Lab"
                className="h-11"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  handleChange();
                }}
                required
                maxLength={60}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading} className="h-11 px-6">
                {loading ? "Creating…" : "Create workspace"}
              </Button>
              <Button
                variant="outline"
                type="button"
                className="h-11 px-6"
                onClick={() => {
                  if (hasChanges) setConfirmDiscard(true);
                  else router.back();
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmDiscard}
        onOpenChange={setConfirmDiscard}
        title="Discard changes?"
        description="You have unsaved changes. If you leave now, your workspace details will be lost."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        variant="destructive"
        onConfirm={() => {
          setConfirmDiscard(false);
          router.back();
        }}
      />
    </div>
  );
}