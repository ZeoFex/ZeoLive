export type UserRole = "student" | "tutor" | "admin";

export interface Tutor {
  id: string;
  name: string;
  email: string;
  avatar: string;
  subject: string;
  subjects: string[];
  rating: number;
  reviewCount: number;
  hourlyRate: number;
  available: boolean;
  bio: string;
  experience: number;
  verified: boolean;
}

export interface Session {
  id: string;
  tutorId: string;
  tutorName: string;
  tutorAvatar: string;
  subject: string;
  date: string;
  time: string;
  duration: number;
  status: "upcoming" | "live" | "completed" | "cancelled";
  price: number;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isOwn?: boolean;
}

export interface Conversation {
  id: string;
  participantName: string;
  participantAvatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
  online: boolean;
}

export interface Payment {
  id: string;
  date: string;
  amount: number;
  status: "completed" | "pending" | "failed" | "refunded";
  description: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  avatar: string;
  content: string;
  rating: number;
}

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
  cta: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "active" | "suspended" | "pending";
  joinedAt: string;
}

export interface TutorVerification {
  id: string;
  name: string;
  email: string;
  subjects: string[];
  submittedAt: string;
  certificateUrl: string;
  status: "pending" | "approved" | "rejected";
}
