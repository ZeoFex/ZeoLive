"use client";

import { Bell, LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  userName?: string;
  userAvatar?: string;
}

export function DashboardHeader({
  title,
  subtitle,
  userName,
  userAvatar,
}: DashboardHeaderProps) {
  const { data: session } = useSession();
  const displayName = userName ?? session?.user?.name ?? "Account";
  const displayImage = userAvatar ?? session?.user?.image ?? undefined;

  return (
    <header className="flex items-center justify-between border-b bg-background/80 px-4 py-4 backdrop-blur-sm sm:px-6 lg:px-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Sign out"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-5 w-5" />
        </Button>
        <Avatar>
          {displayImage && <AvatarImage src={displayImage} alt={displayName} />}
          <AvatarFallback>{displayName[0]}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
