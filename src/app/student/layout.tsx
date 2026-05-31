import { StudentShell } from "@/components/layout/student-shell";
import "./student-theme.css";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StudentShell>{children}</StudentShell>;
}
