"use client";

import { toast } from "sonner";
import { StudentPageHeader } from "@/components/layout/student-page-header";
import { FileUpload } from "@/components/shared/file-upload";
import { PasswordInput } from "@/components/shared/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function StudentSettingsPage() {
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
            <FileUpload label="Profile photo" accept="image/*" />
            <div>
              <Label htmlFor="name" className="text-slate-600">
                Full name
              </Label>
              <Input id="name" defaultValue="Alex Morgan" className="mt-1.5 rounded-xl" />
            </div>
            <div>
              <Label htmlFor="email" className="text-slate-600">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                defaultValue="alex@email.com"
                className="mt-1.5 rounded-xl"
              />
            </div>
            <Button
              className="student-gradient-btn rounded-xl"
              onClick={() => toast.success("Profile updated")}
            >
              Save changes
            </Button>
          </div>
        </div>

        <div className="student-card p-5 sm:p-6">
          <h3 className="font-bold text-slate-900">Change password</h3>
          <div className="mt-5 space-y-4">
            <div>
              <Label className="text-slate-600">Current password</Label>
              <PasswordInput className="mt-1.5 rounded-xl" />
            </div>
            <div>
              <Label className="text-slate-600">New password</Label>
              <PasswordInput className="mt-1.5 rounded-xl" />
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
