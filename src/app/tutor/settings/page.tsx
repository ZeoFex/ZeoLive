"use client";

import { toast } from "sonner";
import { TutorPageHeader } from "@/components/layout/tutor-page-header";
import { FileUpload } from "@/components/shared/file-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function TutorSettingsPage() {
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
            <FileUpload label="Profile photo" accept="image/*" />
            <div>
              <Label className="text-slate-700">Name</Label>
              <Input defaultValue="Dr. Sarah Chen" className="mt-1.5 rounded-xl border-slate-200" />
            </div>
            <div>
              <Label className="text-slate-700">Bio</Label>
              <Textarea
                defaultValue="PhD in Mathematics with 10+ years teaching experience."
                className="mt-1.5 rounded-xl border-slate-200"
              />
            </div>
            <div>
              <Label className="text-slate-700">Subjects (comma-separated)</Label>
              <Input
                defaultValue="Mathematics, Calculus, Statistics"
                className="mt-1.5 rounded-xl border-slate-200"
              />
            </div>
            <div>
              <Label className="text-slate-700">Hourly rate ($)</Label>
              <Input type="number" defaultValue={45} className="mt-1.5 rounded-xl border-slate-200" />
            </div>
            <Button
              className="tutor-gradient-btn rounded-xl"
              onClick={() => toast.success("Profile saved")}
            >
              Save profile
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
