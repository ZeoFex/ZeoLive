/** Local marketing images (served from /public/images) */

export const siteImages = {
  hero: {
    src: "/images/hero.jpg",
    alt: "Tutor and student in an online lesson",
  },
  classroom: {
    src: "/images/classroom.jpg",
    alt: "Video call on a laptop during a tutoring session",
  },
  study: {
    src: "/images/study.jpg",
    alt: "Student working on a laptop",
  },
  schedule: {
    src: "/images/schedule.jpg",
    alt: "Calendar and planner for scheduling sessions",
  },
  steps: {
    browse: {
      src: "/images/step-browse.jpg",
      alt: "Browsing study materials",
    },
    book: {
      src: "/images/step-book.jpg",
      alt: "Planning a session",
    },
    join: {
      src: "/images/step-join.jpg",
      alt: "Collaborating in a group session",
    },
  },
} as const;

export const tutorPhotos: Record<string, { src: string; alt: string }> = {
  "1": { src: "/images/tutor-1.jpg", alt: "Dr. Sarah Chen" },
  "2": { src: "/images/tutor-2.jpg", alt: "James Wilson" },
  "3": { src: "/images/tutor-3.jpg", alt: "Emily Rodriguez" },
  "4": { src: "/images/tutor-4.jpg", alt: "Michael Park" },
};

export const testimonialPhotos: Record<string, { src: string; alt: string }> = {
  "1": { src: "/images/testimonial-1.jpg", alt: "Alex Morgan" },
  "2": { src: "/images/testimonial-2.jpg", alt: "Priya Sharma" },
  "3": { src: "/images/testimonial-3.jpg", alt: "Robert Chen" },
};
