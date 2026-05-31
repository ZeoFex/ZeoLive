import { z } from "zod";
import { COUNTRIES, SCHOOL_TYPES, TUTOR_EDUCATION_LEVELS } from "@/lib/constants/registration";

const schoolTypeValues = SCHOOL_TYPES.map((s) => s.value) as [string, ...string[]];
const educationLevelValues = TUTOR_EDUCATION_LEVELS.map((e) => e.value) as [
  string,
  ...string[],
];

const passwordFields = {
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
};

const nameFields = {
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
};

const contactFields = {
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(8, "Enter a valid phone number"),
  country: z.enum(COUNTRIES as unknown as [string, ...string[]], {
    message: "Select your country",
  }),
  regionState: z.string().min(1, "Region or state is required"),
};

const dobField = {
  dateOfBirth: z.string().min(1, "Date of birth is required"),
};

const termsField = {
  acceptTerms: z.literal(true, {
    message: "You must accept the terms and agreements",
  }),
};

export const studentRegistrationSchema = z
  .object({
    ...nameFields,
    ...contactFields,
    ...dobField,
    ...passwordFields,
    schoolType: z.enum(schoolTypeValues),
    schoolName: z.string().optional(),
    schoolRegionState: z.string().optional(),
    ...termsField,
  })
  .superRefine((data, ctx) => {
    if (data.schoolType !== "HOME_SCHOOL") {
      if (!data.schoolName?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "School name is required",
          path: ["schoolName"],
        });
      }
      if (!data.schoolRegionState?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "School region or state is required",
          path: ["schoolRegionState"],
        });
      }
    }
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const tutorRegistrationSchema = z
  .object({
    ...nameFields,
    ...contactFields,
    ...dobField,
    ...passwordFields,
    ...termsField,
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const tutorOnboardingSchema = z.object({
  educationLevel: z.enum(educationLevelValues),
  institutionName: z.string().min(2, "Institution name is required"),
  transcriptUrl: z.string().min(1, "Transcript is required"),
  nationalIdUrl: z.string().min(1, "National ID is required"),
  livePhotoUrl: z.string().min(1, "Live photo is required"),
  certificateUrl: z.string().optional(),
});

export const tutorRecommendationRequestSchema = z.object({
  title: z.enum(["DR", "PROF"]),
  recommenderFirstName: z.string().min(1, "First name is required"),
  recommenderLastName: z.string().min(1, "Last name is required"),
  departmentName: z.string().min(1, "Department name is required"),
  recommenderSchoolName: z
    .string()
    .min(2, "School or institution where they lecture is required"),
  recommenderEmail: z.string().email("Enter a valid email"),
  recommenderPhone: z.string().optional(),
  message: z.string().optional(),
});

export const recommenderSubmissionSchema = z
  .object({
    letterText: z.string().optional(),
    letterUrl: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const text = data.letterText?.trim() ?? "";
    const hasFile = !!data.letterUrl?.trim();

    if (!text && !hasFile) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Write a recommendation or upload a letter (PDF or image)",
        path: ["letterText"],
      });
      return;
    }

    if (text && text.length < 50) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Written recommendation must be at least 50 characters",
        path: ["letterText"],
      });
    }
  });

export type StudentRegistrationInput = z.infer<typeof studentRegistrationSchema>;
export type TutorRegistrationInput = z.infer<typeof tutorRegistrationSchema>;
export type TutorOnboardingInput = z.infer<typeof tutorOnboardingSchema>;
export type TutorRecommendationRequestInput = z.infer<
  typeof tutorRecommendationRequestSchema
>;
