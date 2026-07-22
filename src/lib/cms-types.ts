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

export type CmsHero = {
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
