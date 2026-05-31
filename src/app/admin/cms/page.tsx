"use client";

import { toast } from "sonner";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function AdminCmsPage() {
  return (
    <>
      <AdminPageHeader
        title="CMS"
        description="Manage landing page content and platform stats."
      />

      <div className="max-w-2xl space-y-6">
        <div className="admin-card p-6">
          <h3 className="text-base font-bold text-slate-900">Hero section</h3>
          <div className="mt-5 space-y-4">
            <div>
              <Label className="text-slate-600">Headline</Label>
              <Input
                defaultValue="Learn live with verified tutors"
                className="mt-1.5 rounded-xl"
              />
            </div>
            <div>
              <Label className="text-slate-600">Subtitle</Label>
              <Textarea
                defaultValue="Connect with expert tutors for personalized live sessions."
                className="mt-1.5 rounded-xl"
              />
            </div>
            <Button
              className="admin-gradient-btn rounded-xl"
              onClick={() => toast.success("Content published (mock)")}
            >
              Publish changes
            </Button>
          </div>
        </div>

        <div className="admin-card p-6">
          <h3 className="text-base font-bold text-slate-900">Platform stats</h3>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-slate-600">Tutors count</Label>
              <Input defaultValue="2840" className="mt-1.5 rounded-xl" />
            </div>
            <div>
              <Label className="text-slate-600">Students count</Label>
              <Input defaultValue="12500" className="mt-1.5 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
