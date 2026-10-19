"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/ui/ConfirmDialog";
import { useToast } from "@/contexts/ToastContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { api } from "@/lib/api";

export function InviteMemberPage({ role }) {
  const router = useRouter();
  const { currentWorkspace } = useWorkspace();
  const toast = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = name.trim().length >= 2 && /.+@.+\..+/.test(email);

  const onConfirm = async () => {
    setSubmitting(true);
    try {
      const { user, role: assignedRole, setupUrl } = await api.post(
        `/api/${role}/team/invite`,
        {
          name: name.trim(),
          email: email.trim(),
          workspaceId: currentWorkspace.id,
        }
      );
      
      if (setupUrl) {
        toast.success(`Invite link sent to ${user.email} as ${assignedRole}`);
        toast.info(`Dev link: ${setupUrl}`, { duration: 12000 });
      } else {
        toast.success(`Added ${user.email} to the workspace as ${assignedRole}`);
      }
      
      router.push(`/${role}/team`);
    } catch (err) {
      toast.error(err?.message || "Failed to send invite.");
      setSubmitting(false);
      setConfirmOpen(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href={`/${role}/team`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to team
      </Link>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Invite member</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Enter their name and email. They'll get a link to set their password.
        </p>
      </div>


      <Card>
        <CardHeader>
          <CardTitle className="text-base">New member</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jane Doe"
              className="h-11"
              maxLength={80}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">
              The invite link will be sent here if they are a new user.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              disabled={!canSubmit || submitting}
              onClick={() => setConfirmOpen(true)}
              className="h-10"
            >
              <Mail className="w-4 h-4 mr-2" />
              Send invite
            </Button>
            <Button
              variant="outline"
              className="h-10"
              nativeButton={false}
              render={<Link href={`/${role}/team`} />}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(o) => !o && !submitting && setConfirmOpen(false)}
        title="Send invite?"
        description={`Add ${email.trim()} to ${currentWorkspace?.name || "the workspace"}?`}
        confirmLabel={submitting ? "Sending…" : "Send invite"}
        loading={submitting}
        onConfirm={onConfirm}
      />
    </div>
  );
}