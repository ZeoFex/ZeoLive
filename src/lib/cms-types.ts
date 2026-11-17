import type { FAQ, PricingPlan, Testimonial } from "@/types";

export type CmsHeroCardItem = {
  subject: string;
  time: string;
  tutor: string;
};

export type CmsHeroSlide = {
  eyebrow: string;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
};

export const HERO_SCENES = [
  { id: "classroom", label: "Live classroom" },
  { id: "camera", label: "Video camera" },
  { id: "microphone", label: "Lesson microphone" },
  { id: "notebook", label: "Study notebook" },
  { id: "crosses", label: "Glossy crosses" },
  { id: "orb", label: "Glass orb" },
  { id: "rings", label: "Orbit rings" },
  { id: "knots", label: "Twisted knots" },
  { id: "crystals", label: "Crystal cluster" },
  { id: "off", label: "Hide animation" },
] as const;

export type HeroScene = (typeof HERO_SCENES)[number]["id"];

export function isHeroScene(value: unknown): value is HeroScene {
  return HERO_SCENES.some((scene) => scene.id === value);
}

export type CmsHero = {
  /** Which 3D scene plays at the top of the homepage. */
  scene: HeroScene;
  slides: CmsHeroSlide[];
  /** Auto-advance interval in ms. 0 disables autoplay. */
  autoplayMs: number;
  primaryCta: string;
  primaryCtaHref: string;
  secondaryCta: string;
  secondaryCtaHref: string;
  cardTitle: string;
  cardItems: CmsHeroCardItem[];
  cardFootnote: string;
};

export type CmsStats = {
  tutors: number;
  students: number;
  liveSessions: number;
  successRate: number;
};

export type CmsSectionHeading = {
  title: string;
  description: string;
};

export type CmsShowcasePanel = {
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
};

export type CmsShowcase = CmsSectionHeading & {
  panels: CmsShowcasePanel[];
};

export type CmsFeature = {
  title: string;
  description: string;
  icon: string;
};

export type CmsFeatures = {
  heading: CmsSectionHeading;
  imageSrc: string;
  imageAlt: string;
  /** When set, replaces the side image with an autoplaying video. */
  videoUrl: string;
  videoTitle: string;
  videoPosterSrc: string;
  items: CmsFeature[];
};

export type CmsStep = {
  step: number;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
};

export type CmsHowItWorks = {
  heading: CmsSectionHeading;
  steps: CmsStep[];
};

export type LandingCms = {
  hero: CmsHero;
  stats: CmsStats;
  showcase: CmsShowcase;
  features: CmsFeatures;
  howItWorks: CmsHowItWorks;
  featuredTutors: CmsSectionHeading;
  testimonials: { heading: CmsSectionHeading; items: Testimonial[] };
  pricing: { heading: CmsSectionHeading; plans: PricingPlan[] };
  faq: { heading: CmsSectionHeading; items: FAQ[] };
};

export const CMS_LANDING_KEY = "landing";
