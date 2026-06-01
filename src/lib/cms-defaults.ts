import type { LandingCms } from "@/lib/cms-types";
import { BRAND_NAME } from "@/lib/brand";
import { faqs, pricingPlans, testimonials } from "@/lib/mock-data";
import { siteImages } from "@/lib/site-images";

export function defaultLandingCms(): LandingCms {
  return {
    hero: {
      eyebrow: `${BRAND_NAME} — online tutoring for students and tutors`,
      title: "Live lessons with tutors you can trust",
      description: `${BRAND_NAME} helps you find a tutor, schedule a session, and meet in a shared classroom. No clutter — just teaching, notes, and a clear record of what you covered.`,
      imageSrc: siteImages.hero.src,
      imageAlt: siteImages.hero.alt,
      primaryCta: "Create student account",
      primaryCtaHref: "/signup/student",
      secondaryCta: "Apply as a tutor",
      secondaryCtaHref: "/signup/tutor",
      cardTitle: "Your week",
      cardItems: [
        { subject: "Calculus II", time: "Tomorrow, 10:00 AM", tutor: "Sarah Chen" },
        { subject: "Python basics", time: "Fri, 2:00 PM", tutor: "Michael Park" },
      ],
      cardFootnote: "Sample schedule after sign-in",
    },
    stats: {
      tutors: 2840,
      students: 12500,
      liveSessions: 342,
      successRate: 96,
    },
    showcase: {
      title: "Built for recurring lessons",
      description: `A typical week on ${BRAND_NAME}: live sessions, shared materials, and a clear calendar.`,
      imageSrc: siteImages.classroom.src,
      imageAlt: siteImages.classroom.alt,
    },
    features: {
      heading: {
        title: "What the platform includes",
        description:
          "Built for recurring lessons between the same student and tutor, not one-off video calls.",
      },
      items: [
        {
          icon: "Video",
          title: "Live video sessions",
          description: "Meet in the browser with video, audio, and a shared whiteboard.",
        },
        {
          icon: "UserCheck",
          title: "Tutor verification",
          description: "We review credentials before a tutor profile goes live.",
        },
        {
          icon: "Calendar",
          title: "Scheduling",
          description: "Students book from a tutor's published availability.",
        },
        {
          icon: "PenLine",
          title: "Session notes",
          description: "Optional recordings and materials stay tied to each lesson.",
        },
        {
          icon: "CreditCard",
          title: "Payments",
          description:
            "Students pay per session or on a monthly plan. Tutors see payouts in one place.",
        },
        {
          icon: "Shield",
          title: "Account security",
          description: "Standard encryption for sign-in, payments, and classroom access.",
        },
      ],
    },
    howItWorks: {
      heading: {
        title: "How it works",
        description: "From search to session in three steps.",
      },
      steps: [
        {
          step: 1,
          title: "Find a tutor",
          description: "Browse verified profiles by subject, rate, and reviews.",
          imageSrc: siteImages.steps.browse.src,
          imageAlt: siteImages.steps.browse.alt,
        },
        {
          step: 2,
          title: "Book a time",
          description: "Pick a slot that fits your schedule and confirm the session.",
          imageSrc: siteImages.steps.book.src,
          imageAlt: siteImages.steps.book.alt,
        },
        {
          step: 3,
          title: "Join the classroom",
          description: "Video, chat, and whiteboard in one place — no extra apps.",
          imageSrc: siteImages.steps.join.src,
          imageAlt: siteImages.steps.join.alt,
        },
      ],
    },
    featuredTutors: {
      title: "Top-rated tutors on the platform",
      description:
        "Verified educators with strong student feedback, ready for new bookings.",
    },
    testimonials: {
      heading: {
        title: "What students and parents say",
        description: "Feedback from people using the platform each week.",
      },
      items: testimonials.map((t) => ({
        ...t,
        content: t.content.replace(/Zeolive/g, BRAND_NAME),
      })),
    },
    pricing: {
      heading: {
        title: "Simple pricing",
        description: "Start free. Upgrade when you need more sessions and recordings.",
      },
      plans: pricingPlans.map((p) => ({
        ...p,
        description: p.description.replace(/Zeolive/g, BRAND_NAME),
      })),
    },
    faq: {
      heading: {
        title: "Common questions",
        description: "Policies and features before you book.",
      },
      items: faqs.map((f) => ({
        ...f,
        answer: f.answer.replace(/Zeolive/g, BRAND_NAME),
      })),
    },
  };
}
