/** Default tertiary programmes + teachable subjects used for seeding. */
export const DEFAULT_PROGRAMMES = [
  {
    name: "BSc Mathematics",
    subjects: ["Mathematics", "Calculus", "Statistics"],
  },
  {
    name: "BSc Physical Sciences",
    subjects: ["Physics", "Chemistry"],
  },
  {
    name: "BA English",
    subjects: ["English", "Literature", "Writing"],
  },
  {
    name: "BSc Computer Science",
    subjects: ["Computer Science", "Python", "Web Development"],
  },
  {
    name: "BSc Biological Sciences",
    subjects: ["Biology", "Anatomy"],
  },
  {
    name: "BA Modern Languages",
    subjects: ["Spanish", "French"],
  },
  {
    name: "BA History",
    subjects: ["History"],
  },
] as const;

export const MAX_TUTOR_SUBJECTS = 3;

export function slugifyLabel(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
