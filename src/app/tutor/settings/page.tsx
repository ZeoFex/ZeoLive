"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { TutorPageHeader } from "@/components/layout/tutor-page-header";
import { FileUpload } from "@/components/shared/file-upload";
import { ProfilePhotoField } from "@/components/shared/profile-photo-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function TutorSettingsPage() {
  const { data: session, status, update } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [image, setImage] = useState("");
  const [bio, setBio] = useState("");
  const [subjects, setSubjects] = useState("");
  const [hourlyRate, setHourlyRate] = useState("45");
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
      toast.error("Name is required");
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
      toast.success("Profile saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <TutorPageHeader
        title="Settings"
        description="Manage your tutor profile, rates, and certifications."
      />

      <div className="max-w-2xl space-y-6">
        <div className="tutor-card p-5 sm:p-6">
          <h3 className="mb-4 text-base font-bold text-slate-900">Profile</h3>
          <div className="space-y-4">
            <ProfilePhotoField
              imageUrl={image}
              name={name || session?.user?.name || "Tutor"}
              onUploaded={handlePhotoUploaded}
            />
            <div>
              <Label className="tutor-label">Name</Label>
              <Input
                className="tutor-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={loadingProfile ? "Loading…" : "Your name"}
                disabled={loadingProfile}
              />
            </div>
            <div>
              <Label className="tutor-label">Email</Label>
              <Input
                type="email"
                className="tutor-input"
                value={email}
                readOnly
                disabled={loadingProfile}
              />
            </div>
            <div>
              <Label className="tutor-label">Bio</Label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell students about your teaching experience"
                className="tutor-textarea"
              />
            </div>
            <div>
              <Label className="tutor-label">Subjects (comma-separated)</Label>
              <Input
                value={subjects}
                onChange={(e) => setSubjects(e.target.value)}
                placeholder="Mathematics, Calculus, Statistics"
                className="tutor-input"
              />
            </div>
            <div>
              <Label className="tutor-label">Hourly rate ($)</Label>
              <Input
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                className="tutor-input"
              />
            </div>
            <Button
              className="tutor-gradient-btn rounded-xl"
              disabled={loadingProfile || saving}
              onClick={() => void saveProfile()}
            >
              {saving ? "Saving…" : "Save profile"}
            </Button>
          </div>
        </div>

        <div className="tutor-card p-5 sm:p-6">
          <h3 className="mb-4 text-base font-bold text-slate-900">Certifications</h3>
          <FileUpload label="Upload certificate" accept=".pdf,image/*" />
        </div>
      </div>
    </>
  );
}
