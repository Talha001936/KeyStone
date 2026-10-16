// components/shared/profile/ProfilePage.jsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChevronDown, KeyRound } from "lucide-react";
import { PageHeader } from "@/components/shared/ui/PageHeader";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { api } from "@/lib/api";

export function ProfilePage({ roleLabel }) {
  const { user, refresh } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [savingProfile, setSavingProfile] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const initials = (user?.name || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const profileDirty =
    name !== (user?.name || "") || email !== (user?.email || "");

  const onSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await api.patch("/api/auth/me", { name, email });
      await refresh();
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err?.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const onSavePassword = async () => {
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setSavingPassword(true);
    try {
      await api.post("/api/auth/change-password", {
        currentPassword,
        newPassword,
      });
      toast.success("Password updated");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPassword(false);
    } catch (err) {
      toast.error(err?.message || "Failed to update password");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="Profile"
        description="Your personal information and security settings."
      />

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-accent text-accent-foreground text-xl font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold">{user?.name}</h2>
                <Badge variant={roleLabel === "Owner" ? "default" : "outline"}>
                  {roleLabel}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {user?.email}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-5">
          <div>
            <h2 className="text-sm font-semibold">Personal information</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Update your name and email.
            </p>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11"
            />
          </div>
          <Button
            onClick={onSaveProfile}
            disabled={!profileDirty || savingProfile}
            className="h-10"
          >
            {savingProfile ? "Saving…" : "Save changes"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold">Password</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Change your password regularly.
              </p>
            </div>
            <Button
              variant="outline"
              className="h-10 shrink-0"
              onClick={() => setShowPassword((s) => !s)}
            >
              <KeyRound className="w-4 h-4 mr-2" />
              Change password
              <ChevronDown
                className={`w-4 h-4 ml-2 transition-transform ${
                  showPassword ? "rotate-180" : ""
                }`}
              />
            </Button>
          </div>

          <AnimatePresence initial={false}>
            {showPassword && (
              <motion.div
                key="password-form"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <Separator className="my-6" />
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="current">Current password</Label>
                    <PasswordInput
                      id="current"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new">New password</Label>
                    <PasswordInput
                      id="new"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Must be at least 8 characters.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm">Confirm new password</Label>
                    <PasswordInput
                      id="confirm"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={onSavePassword}
                      disabled={savingPassword}
                      className="h-10"
                    >
                      {savingPassword ? "Updating…" : "Update password"}
                    </Button>
                    <Button
                      variant="outline"
                      className="h-10"
                      onClick={() => setShowPassword(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}