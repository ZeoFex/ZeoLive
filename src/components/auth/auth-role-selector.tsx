"use client";

import { GraduationCap, Presentation } from "lucide-react";
import { cn } from "@/lib/utils";

export type AuthRole = "student" | "tutor";

interface AuthRoleSelectorProps {
  value: AuthRole;
  onChange: (role: AuthRole) => void;
  label?: string;
}

export function AuthRoleSelector({
  value,
  onChange,
  label = "Select a role to access tailored features",
}: AuthRoleSelectorProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500">{label}</p>
      <div className="grid grid-cols-2 gap-3">
        <RoleCard
          selected={value === "student"}
          onClick={() => onChange("student")}
          icon={GraduationCap}
          title="I'm a Student"
        />
        <RoleCard
          selected={value === "tutor"}
          onClick={() => onChange("tutor")}
          icon={Presentation}
          title="I'm a Tutor"
        />
      </div>
    </div>
  );
}

function RoleCard({
  selected,
  onClick,
  icon: Icon,
  title,
}: {
  selected: boolean;
  onClick: () => void;
  icon: typeof GraduationCap;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-xl border-2 px-4 py-4 text-left transition-all",
        selected
          ? "border-[#0066CC] bg-[#EFF6FF] shadow-sm"
          : "border-slate-200 bg-white hover:border-slate-300"
      )}
    >
      <span
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2",
          selected ? "border-[#0066CC]" : "border-slate-300"
        )}
      >
        {selected && <span className="h-2 w-2 rounded-full bg-[#0066CC]" />}
      </span>
      <Icon
        className={cn("h-5 w-5 shrink-0", selected ? "text-[#0066CC]" : "text-slate-400")}
      />
      <span
        className={cn(
          "text-sm font-semibold leading-tight",
          selected ? "text-[#0066CC]" : "text-slate-600"
        )}
      >
        {title}
      </span>
    </button>
  );
}
