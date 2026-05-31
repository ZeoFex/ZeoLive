import type {
  AdminUser,
  Conversation,
  FAQ,
  Message,
  Payment,
  PricingPlan,
  Session,
  Testimonial,
  Tutor,
  TutorVerification,
} from "@/types";

export const platformStats = {
  tutors: 2840,
  students: 12500,
  liveSessions: 342,
  successRate: 96,
};

export const featuredTutors: Tutor[] = [
  {
    id: "1",
    name: "Dr. Sarah Chen",
    email: "sarah@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    subject: "Mathematics",
    subjects: ["Mathematics", "Calculus", "Statistics"],
    rating: 4.9,
    reviewCount: 128,
    hourlyRate: 45,
    available: true,
    bio: "PhD in Mathematics with 10+ years teaching experience.",
    experience: 10,
    verified: true,
  },
  {
    id: "2",
    name: "James Wilson",
    email: "james@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=James",
    subject: "Physics",
    subjects: ["Physics", "Chemistry"],
    rating: 4.8,
    reviewCount: 95,
    hourlyRate: 40,
    available: true,
    bio: "Former university lecturer specializing in STEM.",
    experience: 8,
    verified: true,
  },
  {
    id: "3",
    name: "Emily Rodriguez",
    email: "emily@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily",
    subject: "English",
    subjects: ["English", "Literature", "Writing"],
    rating: 5.0,
    reviewCount: 210,
    hourlyRate: 35,
    available: false,
    bio: "Certified ESL instructor and published author.",
    experience: 12,
    verified: true,
  },
  {
    id: "4",
    name: "Michael Park",
    email: "michael@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
    subject: "Computer Science",
    subjects: ["Computer Science", "Python", "Web Development"],
    rating: 4.9,
    reviewCount: 156,
    hourlyRate: 55,
    available: true,
    bio: "Senior software engineer teaching coding fundamentals.",
    experience: 7,
    verified: true,
  },
];

export const allTutors: Tutor[] = [
  ...featuredTutors,
  {
    id: "5",
    name: "Lisa Thompson",
    email: "lisa@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa",
    subject: "Biology",
    subjects: ["Biology", "Anatomy"],
    rating: 4.7,
    reviewCount: 72,
    hourlyRate: 38,
    available: true,
    bio: "Medical student and biology tutor.",
    experience: 4,
    verified: true,
  },
  {
    id: "6",
    name: "David Kim",
    email: "david@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
    subject: "Spanish",
    subjects: ["Spanish", "French"],
    rating: 4.6,
    reviewCount: 45,
    hourlyRate: 30,
    available: true,
    bio: "Native Spanish speaker with language certification.",
    experience: 6,
    verified: false,
  },
];

export const testimonials: Testimonial[] = [
  {
    id: "1",
    name: "Alex Morgan",
    role: "High school student",
    avatar: "",
    content:
      "I meet the same tutor each week for calculus. Having the whiteboard and notes in one place saves us ten minutes every session.",
    rating: 5,
  },
  {
    id: "2",
    name: "Priya Sharma",
    role: "College student",
    avatar: "",
    content:
      "Booking around my lab schedule was straightforward. Cancellations are clear in the policy, which I appreciated before paying.",
    rating: 5,
  },
  {
    id: "3",
    name: "Robert Chen",
    role: "Parent",
    avatar: "",
    content:
      "We use the recording option when my daughter reviews for tests. Support answered a billing question within a day.",
    rating: 5,
  },
];

export const pricingPlans: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    period: "forever",
    description: "Get started with basic learning tools",
    features: [
      "Browse tutors",
      "1 free trial session",
      "Community forums",
      "Basic progress tracking",
    ],
    cta: "Get Started",
  },
  {
    id: "plus",
    name: "Student Plus",
    price: 19,
    period: "month",
    description: "For students taking multiple sessions each month",
    features: [
      "Unlimited bookings",
      "Session recordings (30 days)",
      "Email support",
      "Progress summary per subject",
      "Whiteboard in every session",
      "10% lower booking fee",
    ],
    popular: true,
    cta: "Choose Plus",
  },
  {
    id: "tutor",
    name: "Tutor",
    price: 29,
    period: "month",
    description: "For tutors billing students through ZoeLive",
    features: [
      "Unlimited bookings",
      "Payout history",
      "File uploads for students",
      "Verified profile badge",
      "Public profile page",
      "8% platform fee on payouts",
    ],
    cta: "Apply as tutor",
  },
];

export const faqs: FAQ[] = [
  {
    id: "1",
    question: "How do I book a tutoring session?",
    answer:
      "Browse our verified tutors, select your preferred time slot from their availability calendar, and confirm your booking. You'll receive a link to join the live classroom before the session starts.",
  },
  {
    id: "2",
    question: "Are all tutors verified?",
    answer:
      "Yes. Every tutor on ZoeLive undergoes identity verification and credential review. We verify teaching certificates and conduct background checks before approval.",
  },
  {
    id: "3",
    question: "Can I record my sessions?",
    answer:
      "Student Plus includes recordings stored for 30 days. Either party can decline recording before a session starts.",
  },
  {
    id: "4",
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards, debit cards, PayPal, and Apple Pay. Payments are processed securely through our encrypted payment gateway.",
  },
  {
    id: "5",
    question: "What is your cancellation policy?",
    answer:
      "Cancel up to 24 hours before your session for a full refund. Cancellations within 24 hours may incur a 50% fee. No-shows are non-refundable.",
  },
];

export const studentSessions: Session[] = [
  {
    id: "s1",
    tutorId: "1",
    tutorName: "Dr. Sarah Chen",
    tutorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    subject: "Calculus II",
    date: "2026-05-23",
    time: "10:00 AM",
    duration: 60,
    status: "upcoming",
    price: 45,
  },
  {
    id: "s2",
    tutorId: "4",
    tutorName: "Michael Park",
    tutorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
    subject: "Python Basics",
    date: "2026-05-25",
    time: "2:00 PM",
    duration: 90,
    status: "upcoming",
    price: 82.5,
  },
  {
    id: "s3",
    tutorId: "2",
    tutorName: "James Wilson",
    tutorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=James",
    subject: "Physics",
    date: "2026-05-18",
    time: "4:00 PM",
    duration: 60,
    status: "completed",
    price: 40,
  },
];

export const tutorSessions: Session[] = [
  {
    id: "t1",
    tutorId: "1",
    tutorName: "Alex Student",
    tutorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=AlexSt",
    subject: "Calculus II",
    date: "2026-05-23",
    time: "10:00 AM",
    duration: 60,
    status: "upcoming",
    price: 45,
  },
  {
    id: "t2",
    tutorId: "1",
    tutorName: "Maria Garcia",
    tutorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria",
    subject: "Algebra",
    date: "2026-05-24",
    time: "3:00 PM",
    duration: 60,
    status: "upcoming",
    price: 45,
  },
];

export const conversations: Conversation[] = [
  {
    id: "c1",
    participantName: "Dr. Sarah Chen",
    participantAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    lastMessage: "See you in tomorrow's session!",
    lastMessageTime: "2h ago",
    unread: 2,
    online: true,
  },
  {
    id: "c2",
    participantName: "Michael Park",
    participantAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
    lastMessage: "I've shared the Python exercises.",
    lastMessageTime: "1d ago",
    unread: 0,
    online: false,
  },
  {
    id: "c3",
    participantName: "James Wilson",
    participantAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=James",
    lastMessage: "Great progress on the lab report!",
    lastMessageTime: "3d ago",
    unread: 0,
    online: true,
  },
];

export const chatMessages: Message[] = [
  {
    id: "m1",
    senderId: "1",
    senderName: "Dr. Sarah Chen",
    content: "Hi! Ready for our calculus session tomorrow?",
    timestamp: "10:30 AM",
  },
  {
    id: "m2",
    senderId: "me",
    senderName: "You",
    content: "Yes! I've prepared the integration problems we discussed.",
    timestamp: "10:32 AM",
    isOwn: true,
  },
  {
    id: "m3",
    senderId: "1",
    senderName: "Dr. Sarah Chen",
    content: "Perfect! See you in tomorrow's session!",
    timestamp: "10:35 AM",
  },
];

export const payments: Payment[] = [
  {
    id: "p1",
    date: "2026-05-20",
    amount: 45,
    status: "completed",
    description: "Calculus II with Dr. Sarah Chen",
  },
  {
    id: "p2",
    date: "2026-05-15",
    amount: 19,
    status: "completed",
    description: "Student Plus subscription",
  },
  {
    id: "p3",
    date: "2026-05-10",
    amount: 40,
    status: "completed",
    description: "Physics with James Wilson",
  },
  {
    id: "p4",
    date: "2026-05-05",
    amount: 82.5,
    status: "pending",
    description: "Python Basics with Michael Park",
  },
];

export const adminUsers: AdminUser[] = [
  {
    id: "u1",
    name: "Alex Morgan",
    email: "alex@email.com",
    role: "student",
    status: "active",
    joinedAt: "2026-01-15",
  },
  {
    id: "u2",
    name: "Dr. Sarah Chen",
    email: "sarah@email.com",
    role: "tutor",
    status: "active",
    joinedAt: "2025-11-20",
  },
  {
    id: "u3",
    name: "David Kim",
    email: "david@email.com",
    role: "tutor",
    status: "pending",
    joinedAt: "2026-05-18",
  },
  {
    id: "u4",
    name: "Jane Doe",
    email: "jane@email.com",
    role: "student",
    status: "suspended",
    joinedAt: "2026-03-10",
  },
];

export const tutorVerifications: TutorVerification[] = [
  {
    id: "v1",
    name: "David Kim",
    email: "david@email.com",
    subjects: ["Spanish", "French"],
    submittedAt: "2026-05-18",
    certificateUrl: "/certificate-sample.pdf",
    status: "pending",
  },
  {
    id: "v2",
    name: "Anna Lee",
    email: "anna@email.com",
    subjects: ["Chemistry"],
    submittedAt: "2026-05-17",
    certificateUrl: "/certificate-sample.pdf",
    status: "pending",
  },
  {
    id: "v3",
    name: "Tom Harris",
    email: "tom@email.com",
    subjects: ["History"],
    submittedAt: "2026-05-10",
    certificateUrl: "/certificate-sample.pdf",
    status: "approved",
  },
];

export const earningsData = [
  { month: "Jan", earnings: 1200 },
  { month: "Feb", earnings: 1800 },
  { month: "Mar", earnings: 2100 },
  { month: "Apr", earnings: 1950 },
  { month: "May", earnings: 2400 },
];

export const adminStats = {
  totalUsers: 15340,
  revenue: 284500,
  activeTutors: 2840,
  sessionsToday: 342,
};

export const timeSlots = [
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
];
