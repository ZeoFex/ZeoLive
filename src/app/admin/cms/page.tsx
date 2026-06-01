"use client";

import { Loader2, Save } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { defaultLandingCms } from "@/lib/cms-defaults";
import type { LandingCms } from "@/lib/cms-types";

export default function AdminCmsPage() {
  const [cms, setCms] = useState<LandingCms>(defaultLandingCms());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/cms", { credentials: "same-origin" });
      const text = await res.text();
      const json = text ? (JSON.parse(text) as { cms?: LandingCms; error?: string }) : {};
      if (!res.ok) throw new Error(json.error ?? "Could not load CMS");
      if (json.cms) setCms(json.cms);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load CMS");
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
      const res = await fetch("/api/admin/cms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ cms }),
      });
      const text = await res.text();
      const json = text ? (JSON.parse(text) as { error?: string }) : {};
      if (!res.ok) throw new Error(json.error ?? "Could not save");
      toast.success("Landing page published");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const patchHero = (patch: Partial<LandingCms["hero"]>) =>
    setCms((c) => ({ ...c, hero: { ...c.hero, ...patch } }));

  const patchStats = (patch: Partial<LandingCms["stats"]>) =>
    setCms((c) => ({ ...c, stats: { ...c.stats, ...patch } }));

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <>
      <AdminPageHeader
        title="CMS — Landing page"
        description="Edit homepage copy, stats, and section headings. Tutor cards load from approved profiles with high ratings."
        actions={
          <Button
            type="button"
            className="admin-gradient-btn rounded-xl"
            onClick={() => void save()}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Publish changes
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="admin-card space-y-4 p-6">
          <h3 className="text-base font-bold text-slate-900">Hero</h3>
          <div>
            <Label>Eyebrow</Label>
            <Input
              className="mt-1.5 rounded-xl"
              value={cms.hero.eyebrow}
              onChange={(e) => patchHero({ eyebrow: e.target.value })}
            />
          </div>
          <div>
            <Label>Headline</Label>
            <Input
              className="mt-1.5 rounded-xl"
              value={cms.hero.title}
              onChange={(e) => patchHero({ title: e.target.value })}
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              className="mt-1.5 rounded-xl"
              rows={4}
              value={cms.hero.description}
              onChange={(e) => patchHero({ description: e.target.value })}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Hero image URL</Label>
              <Input
                className="mt-1.5 rounded-xl"
                value={cms.hero.imageSrc}
                onChange={(e) => patchHero({ imageSrc: e.target.value })}
              />
            </div>
            <div>
              <Label>Image alt text</Label>
              <Input
                className="mt-1.5 rounded-xl"
                value={cms.hero.imageAlt}
                onChange={(e) => patchHero({ imageAlt: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="admin-card space-y-4 p-6">
          <h3 className="text-base font-bold text-slate-900">Platform stats</h3>
          <p className="text-xs text-slate-500">
            Shown on the homepage; live tutor/student counts override these when data exists.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Tutors</Label>
              <Input
                type="number"
                className="mt-1.5 rounded-xl"
                value={cms.stats.tutors}
                onChange={(e) => patchStats({ tutors: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Students</Label>
              <Input
                type="number"
                className="mt-1.5 rounded-xl"
                value={cms.stats.students}
                onChange={(e) => patchStats({ students: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Sessions</Label>
              <Input
                type="number"
                className="mt-1.5 rounded-xl"
                value={cms.stats.liveSessions}
                onChange={(e) => patchStats({ liveSessions: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>On-time %</Label>
              <Input
                type="number"
                className="mt-1.5 rounded-xl"
                value={cms.stats.successRate}
                onChange={(e) => patchStats({ successRate: Number(e.target.value) })}
              />
            </div>
          </div>
        </div>

        <div className="admin-card space-y-4 p-6">
          <h3 className="text-base font-bold text-slate-900">Featured tutors section</h3>
          <div>
            <Label>Title</Label>
            <Input
              className="mt-1.5 rounded-xl"
              value={cms.featuredTutors.title}
              onChange={(e) =>
                setCms((c) => ({
                  ...c,
                  featuredTutors: { ...c.featuredTutors, title: e.target.value },
                }))
              }
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              className="mt-1.5 rounded-xl"
              rows={3}
              value={cms.featuredTutors.description}
              onChange={(e) =>
                setCms((c) => ({
                  ...c,
                  featuredTutors: { ...c.featuredTutors, description: e.target.value },
                }))
              }
            />
          </div>
        </div>

        <div className="admin-card space-y-4 p-6">
          <h3 className="text-base font-bold text-slate-900">Showcase strip</h3>
          <div>
            <Label>Title</Label>
            <Input
              className="mt-1.5 rounded-xl"
              value={cms.showcase.title}
              onChange={(e) =>
                setCms((c) => ({
                  ...c,
                  showcase: { ...c.showcase, title: e.target.value },
                }))
              }
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              className="mt-1.5 rounded-xl"
              rows={3}
              value={cms.showcase.description}
              onChange={(e) =>
                setCms((c) => ({
                  ...c,
                  showcase: { ...c.showcase, description: e.target.value },
                }))
              }
            />
          </div>
        </div>
      </div>
    </>
  );
}
