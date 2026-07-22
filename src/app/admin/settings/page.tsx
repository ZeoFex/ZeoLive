"use client";

import {
  AlertTriangle,
  Database,
  Loader2,
  RefreshCw,
  Save,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { PlatformSettings } from "@/lib/platform-settings-types";
import type { SystemOverview } from "@/lib/platform-settings-types";
import {
  defaultPlatformSettings,
  WIPE_CONFIRM_PHRASE,
} from "@/lib/platform-settings-types";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings>(defaultPlatformSettings());
  const [overview, setOverview] = useState<SystemOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [wipeOpen, setWipeOpen] = useState(false);
  const [wipePhrase, setWipePhrase] = useState("");
  const [wiping, setWiping] = useState(false);
  const [resettingCms, setResettingCms] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings", { credentials: "same-origin" });
      const text = await res.text();
      const json = text
        ? (JSON.parse(text) as {
            settings?: PlatformSettings;
            overview?: SystemOverview;
            error?: string;
          })
        : {};
      if (!res.ok) throw new Error(json.error ?? "Could not load settings");
      if (json.settings) setSettings(json.settings);
      if (json.overview) setOverview(json.overview);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(settings),
      });
      const text = await res.text();
      const json = text
        ? (JSON.parse(text) as { settings?: PlatformSettings; error?: string })
        : {};
      if (!res.ok) throw new Error(json.error ?? "Could not save settings");
      if (json.settings) setSettings(json.settings);
      toast.success("Platform settings saved");
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save settings");
    } finally {
      setSaving(false);
    }
  };

  const resetCms = async () => {
    if (
      !window.confirm(
        "Reset the public landing page CMS to factory defaults? This cannot be undone."
      )
    ) {
      return;
    }
    setResettingCms(true);
    try {
      const res = await fetch("/api/admin/settings/reset-cms", {
        method: "POST",
        credentials: "same-origin",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Reset failed");
      toast.success(json.message ?? "Landing CMS reset");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Reset failed");
    } finally {
      setResettingCms(false);
    }
  };

  const runWipe = async () => {
    setWiping(true);
    try {
      const res = await fetch("/api/admin/settings/wipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ confirmPhrase: wipePhrase }),
      });
      const text = await res.text();
      const json = text
        ? (JSON.parse(text) as { error?: string; message?: string; deletedUsers?: number })
        : {};
      if (!res.ok) throw new Error(json.error ?? "Wipe failed");
      toast.success(json.message ?? "Platform data wiped");
      setWipeOpen(false);
      setWipePhrase("");
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Wipe failed");
    } finally {
      setWiping(false);
    }
  };

  const patch = (partial: Partial<PlatformSettings>) =>
    setSettings((s) => ({ ...s, ...partial }));

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-10 w-10 animate-spin text-sky-500" />
      </div>
    );
  }

  return (
    <>
      <AdminPageHeader
        title="Platform settings"
        description="Superadmin controls for access, registrations, sessions, and destructive data actions."
        actions={
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => void load()}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button
              type="button"
              className="admin-gradient-btn rounded-xl"
              disabled={saving}
              onClick={() => void save()}
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save changes
            </Button>
          </div>
        }
      />

      {overview && (
        <div className="admin-card mb-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Students", value: overview.students },
            { label: "Tutors", value: overview.tutors },
            { label: "Sessions", value: overview.sessions },
            { label: "Messages", value: overview.messages },
            { label: "Conversations", value: overview.conversations },
            { label: "Pending tutor reviews", value: overview.pendingTutors },
            { label: "Admins", value: overview.admins },
            { label: "Sub-admins", value: overview.subadmins },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {item.label}
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="admin-card space-y-5 p-5">
          <div>
            <h3 className="font-semibold text-slate-900">Maintenance mode</h3>
            <p className="mt-1 text-sm text-slate-500">
              Blocks students and tutors from the app. Admins can still sign in.
            </p>
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="maintenance">Enable maintenance</Label>
            <Switch
              id="maintenance"
              checked={settings.maintenanceMode}
              onCheckedChange={(v) => patch({ maintenanceMode: v })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maintenance-msg">Public message</Label>
            <Textarea
              id="maintenance-msg"
              rows={3}
              className="admin-textarea"
              value={settings.maintenanceMessage}
              onChange={(e) => patch({ maintenanceMessage: e.target.value })}
            />
          </div>
        </section>

        <section className="admin-card space-y-5 p-5">
          <div>
            <h3 className="font-semibold text-slate-900">Registration</h3>
            <p className="mt-1 text-sm text-slate-500">
              Control who can create new accounts on the platform.
            </p>
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="student-signup">Allow student signup</Label>
            <Switch
              id="student-signup"
              checked={settings.allowStudentSignup}
              onCheckedChange={(v) => patch({ allowStudentSignup: v })}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="tutor-signup">Allow tutor applications</Label>
            <Switch
              id="tutor-signup"
              checked={settings.allowTutorSignup}
              onCheckedChange={(v) => patch({ allowTutorSignup: v })}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="notify-tutor">Email admins on new tutor application</Label>
            <Switch
              id="notify-tutor"
              checked={settings.notifyAdminsOnNewTutorApplication}
              onCheckedChange={(v) => patch({ notifyAdminsOnNewTutorApplication: v })}
            />
          </div>
        </section>

        <section className="admin-card space-y-5 p-5">
          <div>
            <h3 className="font-semibold text-slate-900">Classroom & sessions</h3>
            <p className="mt-1 text-sm text-slate-500">
              Live classroom chat and join windows for scheduled sessions.
            </p>
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="classroom-chat">Persist classroom chat</Label>
            <Switch
              id="classroom-chat"
              checked={settings.classroomChatEnabled}
              onCheckedChange={(v) => patch({ classroomChatEnabled: v })}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="auto-ratings">Auto-seed tutor ratings on homepage</Label>
            <Switch
              id="auto-ratings"
              checked={settings.autoSeedTutorRatings}
              onCheckedChange={(v) => patch({ autoSeedTutorRatings: v })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="join-early">Student early join (minutes)</Label>
              <Input
                id="join-early"
                type="number"
                min={0}
                max={120}
                className="admin-input"
                value={settings.sessionJoinEarlyMinutes}
                onChange={(e) =>
                  patch({ sessionJoinEarlyMinutes: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="join-late">Join window after start (minutes)</Label>
              <Input
                id="join-late"
                type="number"
                min={0}
                max={120}
                className="admin-input"
                value={settings.sessionJoinLateMinutes}
                onChange={(e) =>
                  patch({ sessionJoinLateMinutes: Number(e.target.value) })
                }
              />
            </div>
          </div>
        </section>

        <section className="admin-card space-y-5 p-5">
          <div>
            <h3 className="font-semibold text-slate-900">Support & uploads</h3>
            <p className="mt-1 text-sm text-slate-500">
              Shown on maintenance page and used for document upload limits.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="support-email">Support email</Label>
            <Input
              id="support-email"
              type="email"
              className="admin-input"
              value={settings.supportEmail}
              onChange={(e) => patch({ supportEmail: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-phone">Contact phone (optional)</Label>
            <Input
              id="contact-phone"
              className="admin-input"
              value={settings.contactPhone}
              onChange={(e) => patch({ contactPhone: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="max-upload">Max upload size (MB)</Label>
            <Input
              id="max-upload"
              type="number"
              min={1}
              max={50}
              className="admin-input"
              value={settings.maxUploadSizeMb}
              onChange={(e) => patch({ maxUploadSizeMb: Number(e.target.value) })}
            />
          </div>
        </section>
      </div>

      <section className="admin-card mt-6 space-y-4 p-5">
        <div className="flex items-start gap-3">
          <Database className="mt-0.5 h-5 w-5 text-blue-600" />
          <div>
            <h3 className="font-semibold text-slate-900">Content management</h3>
            <p className="mt-1 text-sm text-slate-500">
              Reset marketing copy without deleting users. Use CMS for full edits.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          disabled={resettingCms}
          onClick={() => void resetCms()}
        >
          {resettingCms ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Reset landing CMS to defaults
        </Button>
      </section>

      <section className="admin-card mt-6 border-red-200 bg-red-50/40 p-5">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 text-red-600" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-900">Danger zone</h3>
            <p className="mt-1 text-sm text-red-800/90">
              Permanently deletes all students, tutors, sub-admins, sessions, messages,
              conversations, tutor verification data, and CMS entries. Your superadmin
              account is preserved. This cannot be undone.
            </p>
            <Button
              type="button"
              variant="destructive"
              className="mt-4 rounded-xl"
              onClick={() => {
                setWipePhrase("");
                setWipeOpen(true);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Wipe entire platform data
            </Button>
          </div>
        </div>
      </section>

      <Dialog open={wipeOpen} onOpenChange={setWipeOpen}>
        <DialogContent className="max-w-md border-red-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Wipe all platform data?
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 pt-2 text-left text-sm text-slate-600">
                <p>
                  This will permanently remove every user except you, all tutoring
                  sessions, messages, tutor profiles, student profiles, and stored CMS
                  content. Landing page and settings will reset to defaults.
                </p>
                <p className="font-medium text-red-700">
                  Type{" "}
                  <code className="rounded bg-red-100 px-1.5 py-0.5 text-xs">
                    {WIPE_CONFIRM_PHRASE}
                  </code>{" "}
                  to confirm.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <Input
            value={wipePhrase}
            onChange={(e) => setWipePhrase(e.target.value)}
            placeholder={WIPE_CONFIRM_PHRASE}
            className="admin-input border-red-200 focus-visible:ring-red-500"
            autoComplete="off"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => setWipeOpen(false)}
              disabled={wiping}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="rounded-xl"
              disabled={wiping || wipePhrase.trim() !== WIPE_CONFIRM_PHRASE}
              onClick={() => void runWipe()}
            >
              {wiping ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Yes, wipe everything
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
