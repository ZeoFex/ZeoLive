"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { StudentPageHeader } from "@/components/layout/student-page-header";
import { PasswordInput } from "@/components/shared/password-input";
import { ProfilePhotoField } from "@/components/shared/profile-photo-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function StudentSettingsPage() {
  const { data: session, status, update } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [image, setImage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!session?.user) return;
    setName(session.user.name?.trim() ?? "");
    setEmail(session.user.email?.trim() ?? "");
    setImage(session.user.image?.trim() ?? "");
  }, [session?.user]);

  const loadingProfile = status === "loading";

  const handlePhotoUploaded = useCallback(
    async (url: string) => {
      setImage(url);
      await update({ image: url });
    },
    [update]
  );

  const saveProfile = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Full name is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ name: trimmed }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        name?: string;
        image?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "Could not save profile");
      setName(json.name ?? trimmed);
      if (json.image) setImage(json.image);
      await update({ name: json.name ?? trimmed, image: json.image ?? image });
      toast.success("Profile updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <StudentPageHeader
        title="Account settings"
        description="Update your profile, password, and notification preferences."
      />

      <div className="max-w-2xl space-y-5">
        <div className="student-card p-5 sm:p-6">
          <h3 className="font-bold text-slate-900">Profile</h3>
          <div className="mt-5 space-y-4">
            <ProfilePhotoField
              imageUrl={image}
              name={name || session?.user?.name || "Student"}
              onUploaded={handlePhotoUploaded}
            />
            <div>
              <Label htmlFor="name" className="student-label">
                Full name
              </Label>
              <Input
                id="name"
                className="student-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={loadingProfile ? "Loading…" : "Your full name"}
                autoComplete="name"
                disabled={loadingProfile}
              />
            </div>
            <div>
              <Label htmlFor="email" className="student-label">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                className="student-input"
                value={email}
                readOnly
                placeholder={loadingProfile ? "Loading…" : "you@email.com"}
                autoComplete="email"
                disabled={loadingProfile}
              />
              <p className="mt-1 text-xs text-slate-500">
                Email comes from your registration and cannot be changed here.
              </p>
            </div>
            <Button
              className="student-gradient-btn rounded-xl"
              disabled={loadingProfile || saving}
              onClick={() => void saveProfile()}
            >
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>

        <div className="student-card p-5 sm:p-6">
          <h3 className="font-bold text-slate-900">Change password</h3>
          <div className="mt-5 space-y-4">
            <div>
              <Label className="student-label">Current password</Label>
              <PasswordInput
                className="student-input"
                autoComplete="current-password"
                placeholder="Enter current password"
              />
            </div>
            <div>
              <Label className="student-label">New password</Label>
              <PasswordInput
                className="student-input"
                autoComplete="new-password"
                placeholder="Enter new password"
                minLength={8}
              />
            </div>
            <Button variant="outline" className="student-outline-btn rounded-xl">
              Update password
            </Button>
          </div>
        </div>

        <div className="student-card p-5 sm:p-6">
          <h3 className="font-bold text-slate-900">Notifications</h3>
          <div className="mt-5 space-y-4">
            {[
              "Session reminders",
              "New messages",
              "Payment receipts",
              "Marketing emails",
            ].map((label) => (
              <div key={label} className="flex items-center justify-between gap-4">
                <Label className="font-normal text-slate-700">{label}</Label>
                <Switch defaultChecked={label !== "Marketing emails"} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
