"use client";

import { toast } from "sonner";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { FileUpload } from "@/components/shared/file-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function TutorSettingsPage() {
  return (
    <>
      <DashboardHeader title="Settings" subtitle="Manage your tutor profile" />
      <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FileUpload label="Profile photo" accept="image/*" />
            <div>
              <Label>Name</Label>
              <Input defaultValue="Dr. Sarah Chen" className="mt-1.5" />
            </div>
            <div>
              <Label>Bio</Label>
              <Textarea
                defaultValue="PhD in Mathematics with 10+ years teaching experience."
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Subjects (comma-separated)</Label>
              <Input defaultValue="Mathematics, Calculus, Statistics" className="mt-1.5" />
            </div>
            <div>
              <Label>Hourly rate ($)</Label>
              <Input type="number" defaultValue={45} className="mt-1.5" />
            </div>
            <Button onClick={() => toast.success("Profile saved")}>Save profile</Button>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Certifications</CardTitle>
          </CardHeader>
          <CardContent>
            <FileUpload label="Upload certificate" accept=".pdf,image/*" />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
