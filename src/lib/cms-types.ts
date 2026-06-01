import type { FAQ, PricingPlan, Testimonial } from "@/types";

export type CmsHero = {
  eyebrow: string;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  primaryCta: string;
  primaryCtaHref: string;
  secondaryCta: string;
  secondaryCtaHref: string;
  cardTitle: string;
  cardItems: { subject: string; time: string; tutor: string }[];
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

export type CmsShowcase = CmsSectionHeading & {
  imageSrc: string;
  imageAlt: string;
};

export type CmsFeature = {
  title: string;
  description: string;
  icon: string;
};

export type CmsStep = {
  step: number;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
};

export type LandingCms = {
  hero: CmsHero;
  stats: CmsStats;
  showcase: CmsShowcase;
  features: { heading: CmsSectionHeading; items: CmsFeature[] };
  howItWorks: { heading: CmsSectionHeading; steps: CmsStep[] };
  featuredTutors: CmsSectionHeading;
  testimonials: { heading: CmsSectionHeading; items: Testimonial[] };
  pricing: { heading: CmsSectionHeading; plans: PricingPlan[] };
  faq: { heading: CmsSectionHeading; items: FAQ[] };
};

export const CMS_LANDING_KEY = "landing";
