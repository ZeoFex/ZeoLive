import {
  Calendar,
  CreditCard,
  PenLine,
  Shield,
  UserCheck,
  Video,
  type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  Video,
  UserCheck,
  Calendar,
  PenLine,
  CreditCard,
  Shield,
};

export function featureIcon(name: string): LucideIcon {
  return MAP[name] ?? Video;
}
