"use client";

import { toast } from "sonner";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { FileUpload } from "@/components/shared/file-upload";
import { PasswordInput } from "@/components/shared/password-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function StudentSettingsPage() {
  return (
    <>
      <DashboardHeader title="Settings" subtitle="Manage your profile and preferences" />
      <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FileUpload label="Profile photo" accept="image/*" />
            <div>
              <Label htmlFor="name">Full name</Label>
              <Input id="name" defaultValue="Alex Morgan" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue="alex@email.com" className="mt-1.5" />
            </div>
            <Button onClick={() => toast.success("Profile updated")}>
              Save changes
            </Button>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Change password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Current password</Label>
              <PasswordInput className="mt-1.5" />
            </div>
            <div>
              <Label>New password</Label>
              <PasswordInput className="mt-1.5" />
            </div>
            <Button variant="outline">Update password</Button>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              "Session reminders",
              "New messages",
              "Payment receipts",
              "Marketing emails",
            ].map((label) => (
              <div key={label} className="flex items-center justify-between">
                <Label>{label}</Label>
                <Switch defaultChecked={label !== "Marketing emails"} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
