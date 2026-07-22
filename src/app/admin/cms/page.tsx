"use client";

import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { defaultLandingCms } from "@/lib/cms-defaults";
import type {
  CmsHeroCardItem,
  CmsHeroSlide,
  CmsShowcasePanel,
  CmsStep,
  LandingCms,
} from "@/lib/cms-types";

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

  const patchHeroSlide = (index: number, patch: Partial<CmsHeroSlide>) =>
    setCms((c) => ({
      ...c,
      hero: {
        ...c.hero,
        slides: c.hero.slides.map((slide, i) =>
          i === index ? { ...slide, ...patch } : slide
        ),
      },
    }));

  const addHeroSlide = () =>
    setCms((c) => ({
      ...c,
      hero: {
        ...c.hero,
        slides: [
          ...c.hero.slides,
          {
            eyebrow: "New slide",
            title: "Headline for this banner",
            description: "Short supporting line that slides with the image.",
            imageSrc: "/images/hero.jpg",
            imageAlt: "Hero banner image",
          },
        ],
      },
    }));

  const removeHeroSlide = (index: number) =>
    setCms((c) => ({
      ...c,
      hero: {
        ...c.hero,
        slides: c.hero.slides.filter((_, i) => i !== index),
      },
    }));

  const patchCardItem = (index: number, patch: Partial<CmsHeroCardItem>) =>
    setCms((c) => ({
      ...c,
      hero: {
        ...c.hero,
        cardItems: c.hero.cardItems.map((item, i) =>
          i === index ? { ...item, ...patch } : item
        ),
      },
    }));

  const addCardItem = () =>
    setCms((c) => ({
      ...c,
      hero: {
        ...c.hero,
        cardItems: [
          ...c.hero.cardItems,
          { subject: "New subject", time: "Mon, 10:00 AM", tutor: "Tutor name" },
        ],
      },
    }));

  const removeCardItem = (index: number) =>
    setCms((c) => ({
      ...c,
      hero: {
        ...c.hero,
        cardItems: c.hero.cardItems.filter((_, i) => i !== index),
      },
    }));

  const patchShowcasePanel = (index: number, patch: Partial<CmsShowcasePanel>) =>
    setCms((c) => ({
      ...c,
      showcase: {
        ...c.showcase,
        panels: c.showcase.panels.map((panel, i) =>
          i === index ? { ...panel, ...patch } : panel
        ),
      },
    }));

  const addShowcasePanel = () =>
    setCms((c) => ({
      ...c,
      showcase: {
        ...c.showcase,
        panels: [
          ...c.showcase.panels,
          {
            title: "New panel",
            description: "Describe this highlight.",
            imageSrc: "/images/classroom.jpg",
            imageAlt: "Homepage showcase image",
          },
        ],
      },
    }));

  const removeShowcasePanel = (index: number) =>
    setCms((c) => ({
      ...c,
      showcase: {
        ...c.showcase,
        panels: c.showcase.panels.filter((_, i) => i !== index),
      },
    }));

  const patchStep = (index: number, patch: Partial<CmsStep>) =>
    setCms((c) => ({
      ...c,
      howItWorks: {
        ...c.howItWorks,
        steps: c.howItWorks.steps.map((step, i) =>
          i === index ? { ...step, ...patch } : step
        ),
      },
    }));

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
        title="CMS — Landing page"
        description="Edit homepage sections one tab at a time, then publish when ready."
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

      <Tabs defaultValue="hero" className="w-full">
        <TabsList className="admin-tabs-list">
          <TabsTrigger value="hero" className="admin-tabs-trigger">
            Hero banner
          </TabsTrigger>
          <TabsTrigger value="schedule" className="admin-tabs-trigger">
            Schedule card
          </TabsTrigger>
          <TabsTrigger value="stats" className="admin-tabs-trigger">
            Stats
          </TabsTrigger>
          <TabsTrigger value="features" className="admin-tabs-trigger">
            Features
          </TabsTrigger>
          <TabsTrigger value="showcase" className="admin-tabs-trigger">
            Showcase
          </TabsTrigger>
          <TabsTrigger value="how-it-works" className="admin-tabs-trigger">
            How it works
          </TabsTrigger>
          <TabsTrigger value="tutors" className="admin-tabs-trigger">
            Tutors
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hero" className="admin-tabs-content">
          <div className="admin-card space-y-4 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Hero banner carousel</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Full-bleed slides with image + sliding copy. CTAs stay shared across slides.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                className="admin-gradient-btn rounded-xl"
                onClick={addHeroSlide}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Add slide
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <Label className="admin-label">Autoplay (ms)</Label>
                <Input
                  type="number"
                  min={0}
                  step={500}
                  className="admin-input"
                  value={cms.hero.autoplayMs}
                  onChange={(e) =>
                    patchHero({ autoplayMs: Number(e.target.value) || 0 })
                  }
                />
                <p className="admin-hint">Use 0 to disable autoplay.</p>
              </div>
              <div>
                <Label className="admin-label">Primary CTA label</Label>
                <Input
                  className="admin-input"
                  value={cms.hero.primaryCta}
                  onChange={(e) => patchHero({ primaryCta: e.target.value })}
                />
              </div>
              <div>
                <Label className="admin-label">Primary CTA link</Label>
                <Input
                  className="admin-input"
                  value={cms.hero.primaryCtaHref}
                  onChange={(e) => patchHero({ primaryCtaHref: e.target.value })}
                />
              </div>
              <div>
                <Label className="admin-label">Secondary CTA label</Label>
                <Input
                  className="admin-input"
                  value={cms.hero.secondaryCta}
                  onChange={(e) => patchHero({ secondaryCta: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-4">
                <Label className="admin-label">Secondary CTA link</Label>
                <Input
                  className="admin-input"
                  value={cms.hero.secondaryCtaHref}
                  onChange={(e) => patchHero({ secondaryCtaHref: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {cms.hero.slides.map((slide, index) => (
                <div key={`slide-${index}`} className="admin-field-group">
                  <div className="flex items-center justify-between">
                    <p className="admin-field-group-title">Slide {index + 1}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => removeHeroSlide(index)}
                      disabled={cms.hero.slides.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div>
                    <Label className="admin-label">Eyebrow</Label>
                    <Input
                      className="admin-input"
                      value={slide.eyebrow}
                      onChange={(e) =>
                        patchHeroSlide(index, { eyebrow: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label className="admin-label">Headline</Label>
                    <Input
                      className="admin-input"
                      value={slide.title}
                      onChange={(e) =>
                        patchHeroSlide(index, { title: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label className="admin-label">Description</Label>
                    <Textarea
                      className="admin-textarea"
                      rows={3}
                      value={slide.description}
                      onChange={(e) =>
                        patchHeroSlide(index, { description: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label className="admin-label">Banner image URL</Label>
                    <Input
                      className="admin-input"
                      value={slide.imageSrc}
                      onChange={(e) =>
                        patchHeroSlide(index, { imageSrc: e.target.value })
                      }
                      placeholder="/images/hero.jpg or https://…"
                    />
                  </div>
                  <div>
                    <Label className="admin-label">Image alt text</Label>
                    <Input
                      className="admin-input"
                      value={slide.imageAlt}
                      onChange={(e) =>
                        patchHeroSlide(index, { imageAlt: e.target.value })
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="admin-tabs-content">
          <div className="admin-card space-y-4 p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Hero schedule cards</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Floating sample sessions on the banner (e.g. Calculus II, Python basics).
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                className="admin-gradient-btn rounded-xl"
                onClick={addCardItem}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Add
              </Button>
            </div>
            <div>
              <Label className="admin-label">Card title</Label>
              <Input
                className="admin-input"
                value={cms.hero.cardTitle}
                onChange={(e) => patchHero({ cardTitle: e.target.value })}
              />
            </div>
            {cms.hero.cardItems.map((item, index) => (
              <div key={`card-${index}`} className="admin-field-group">
                <div className="flex items-center justify-between">
                  <p className="admin-field-group-title">Session {index + 1}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => removeCardItem(index)}
                    disabled={cms.hero.cardItems.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div>
                  <Label className="admin-label">Subject</Label>
                  <Input
                    className="admin-input"
                    value={item.subject}
                    onChange={(e) => patchCardItem(index, { subject: e.target.value })}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label className="admin-label">Time</Label>
                    <Input
                      className="admin-input"
                      value={item.time}
                      onChange={(e) => patchCardItem(index, { time: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="admin-label">Tutor</Label>
                    <Input
                      className="admin-input"
                      value={item.tutor}
                      onChange={(e) => patchCardItem(index, { tutor: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            ))}
            <div>
              <Label className="admin-label">Card footnote</Label>
              <Input
                className="admin-input"
                value={cms.hero.cardFootnote}
                onChange={(e) => patchHero({ cardFootnote: e.target.value })}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="stats" className="admin-tabs-content">
          <div className="admin-card space-y-4 p-6">
            <h3 className="text-base font-bold text-slate-900">Platform stats</h3>
            <p className="text-xs text-slate-500">
              Shown on the homepage; live tutor/student counts override these when data exists.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="admin-label">Tutors</Label>
                <Input
                  type="number"
                  className="admin-input"
                  value={cms.stats.tutors}
                  onChange={(e) => patchStats({ tutors: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label className="admin-label">Students</Label>
                <Input
                  type="number"
                  className="admin-input"
                  value={cms.stats.students}
                  onChange={(e) => patchStats({ students: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label className="admin-label">Sessions</Label>
                <Input
                  type="number"
                  className="admin-input"
                  value={cms.stats.liveSessions}
                  onChange={(e) => patchStats({ liveSessions: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label className="admin-label">On-time %</Label>
                <Input
                  type="number"
                  className="admin-input"
                  value={cms.stats.successRate}
                  onChange={(e) => patchStats({ successRate: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="features" className="admin-tabs-content">
          <div className="admin-card space-y-4 p-6">
            <h3 className="text-base font-bold text-slate-900">Features section</h3>
            <p className="text-xs text-slate-500">
              When a video URL is set, it replaces the side picture and autoplays.
            </p>
            <div>
              <Label className="admin-label">Title</Label>
              <Input
                className="admin-input"
                value={cms.features.heading.title}
                onChange={(e) =>
                  setCms((c) => ({
                    ...c,
                    features: {
                      ...c.features,
                      heading: { ...c.features.heading, title: e.target.value },
                    },
                  }))
                }
              />
            </div>
            <div>
              <Label className="admin-label">Description</Label>
              <Textarea
                className="admin-textarea"
                rows={3}
                value={cms.features.heading.description}
                onChange={(e) =>
                  setCms((c) => ({
                    ...c,
                    features: {
                      ...c.features,
                      heading: { ...c.features.heading, description: e.target.value },
                    },
                  }))
                }
              />
            </div>
            <div>
              <Label className="admin-label">Video URL</Label>
              <Input
                className="admin-input"
                value={cms.features.videoUrl}
                onChange={(e) =>
                  setCms((c) => ({
                    ...c,
                    features: { ...c.features, videoUrl: e.target.value },
                  }))
                }
                placeholder="https://youtube.com/watch?v=… or https://….mp4"
              />
              <p className="admin-hint">
                Leave blank to show the fallback side image instead.
              </p>
            </div>
            <div>
              <Label className="admin-label">Video title (optional)</Label>
              <Input
                className="admin-input"
                value={cms.features.videoTitle}
                onChange={(e) =>
                  setCms((c) => ({
                    ...c,
                    features: { ...c.features, videoTitle: e.target.value },
                  }))
                }
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="admin-label">Poster / fallback image URL</Label>
                <Input
                  className="admin-input"
                  value={cms.features.videoPosterSrc || cms.features.imageSrc}
                  onChange={(e) =>
                    setCms((c) => ({
                      ...c,
                      features: {
                        ...c.features,
                        videoPosterSrc: e.target.value,
                        imageSrc: e.target.value,
                      },
                    }))
                  }
                />
              </div>
              <div>
                <Label className="admin-label">Image alt text</Label>
                <Input
                  className="admin-input"
                  value={cms.features.imageAlt}
                  onChange={(e) =>
                    setCms((c) => ({
                      ...c,
                      features: { ...c.features, imageAlt: e.target.value },
                    }))
                  }
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="showcase" className="admin-tabs-content">
          <div className="admin-card space-y-4 p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Showcase panels</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Homepage image cards (classroom, materials, scheduling, etc.).
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                className="admin-gradient-btn rounded-xl"
                onClick={addShowcasePanel}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Add panel
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="admin-label">Section title</Label>
                <Input
                  className="admin-input"
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
                <Label className="admin-label">Section description</Label>
                <Input
                  className="admin-input"
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
            <div className="grid gap-4 lg:grid-cols-3">
              {cms.showcase.panels.map((panel, index) => (
                <div key={`panel-${index}`} className="admin-field-group">
                  <div className="flex items-center justify-between">
                    <p className="admin-field-group-title">Panel {index + 1}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => removeShowcasePanel(index)}
                      disabled={cms.showcase.panels.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div>
                    <Label className="admin-label">Title</Label>
                    <Input
                      className="admin-input"
                      value={panel.title}
                      onChange={(e) =>
                        patchShowcasePanel(index, { title: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label className="admin-label">Description</Label>
                    <Textarea
                      className="admin-textarea"
                      rows={2}
                      value={panel.description}
                      onChange={(e) =>
                        patchShowcasePanel(index, { description: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label className="admin-label">Image URL</Label>
                    <Input
                      className="admin-input"
                      value={panel.imageSrc}
                      onChange={(e) =>
                        patchShowcasePanel(index, { imageSrc: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label className="admin-label">Image alt</Label>
                    <Input
                      className="admin-input"
                      value={panel.imageAlt}
                      onChange={(e) =>
                        patchShowcasePanel(index, { imageAlt: e.target.value })
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="how-it-works" className="admin-tabs-content">
          <div className="admin-card space-y-4 p-6">
            <h3 className="text-base font-bold text-slate-900">How it works</h3>
            <p className="text-xs text-slate-500">
              Section heading and the three step cards. Platform video lives under Features.
            </p>
            <div>
              <Label className="admin-label">Section title</Label>
              <Input
                className="admin-input"
                value={cms.howItWorks.heading.title}
                onChange={(e) =>
                  setCms((c) => ({
                    ...c,
                    howItWorks: {
                      ...c.howItWorks,
                      heading: { ...c.howItWorks.heading, title: e.target.value },
                    },
                  }))
                }
              />
            </div>
            <div>
              <Label className="admin-label">Section description</Label>
              <Textarea
                className="admin-textarea"
                rows={2}
                value={cms.howItWorks.heading.description}
                onChange={(e) =>
                  setCms((c) => ({
                    ...c,
                    howItWorks: {
                      ...c.howItWorks,
                      heading: {
                        ...c.howItWorks.heading,
                        description: e.target.value,
                      },
                    },
                  }))
                }
              />
            </div>

            <h4 className="pt-2 text-sm font-semibold text-slate-900">Step images</h4>
            <div className="grid gap-4 lg:grid-cols-3">
              {cms.howItWorks.steps.map((step, index) => (
                <div key={`step-${step.step}`} className="admin-field-group">
                  <p className="admin-field-group-title">Step {step.step}</p>
                  <div>
                    <Label className="admin-label">Title</Label>
                    <Input
                      className="admin-input"
                      value={step.title}
                      onChange={(e) => patchStep(index, { title: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="admin-label">Description</Label>
                    <Textarea
                      className="admin-textarea"
                      rows={2}
                      value={step.description}
                      onChange={(e) => patchStep(index, { description: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="admin-label">Image URL</Label>
                    <Input
                      className="admin-input"
                      value={step.imageSrc}
                      onChange={(e) => patchStep(index, { imageSrc: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="admin-label">Image alt</Label>
                    <Input
                      className="admin-input"
                      value={step.imageAlt}
                      onChange={(e) => patchStep(index, { imageAlt: e.target.value })}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tutors" className="admin-tabs-content">
          <div className="admin-card space-y-4 p-6">
            <h3 className="text-base font-bold text-slate-900">Featured tutors section</h3>
            <div>
              <Label className="admin-label">Title</Label>
              <Input
                className="admin-input"
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
              <Label className="admin-label">Description</Label>
              <Textarea
                className="admin-textarea"
                rows={3}
                value={cms.featuredTutors.description}
                onChange={(e) =>
                  setCms((c) => ({
                    ...c,
                    featuredTutors: {
                      ...c.featuredTutors,
                      description: e.target.value,
                    },
                  }))
                }
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
