"use client";

import { Bell, ChevronDown, Search } from "lucide-react";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AdminTopbarProps {
  title: string;
}

export function AdminTopbar({ title }: AdminTopbarProps) {
  const { data: session } = useSession();
  const displayName = session?.user?.name ?? "Admin";
  const displayImage = session?.user?.image ?? undefined;

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-8">
      <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
        {title}
      </h1>

      <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3">
        <div className="relative hidden max-w-xs flex-1 sm:block lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search..."
            className="admin-search w-full"
            aria-label="Search"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          className="admin-outline-btn relative h-10 w-10 rounded-xl"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4 text-slate-600" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
        </Button>
        <button
          type="button"
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white py-1.5 pl-1.5 pr-2 transition-colors hover:bg-slate-50"
        >
          <Avatar className="h-8 w-8">
            {displayImage && <AvatarImage src={displayImage} alt={displayName} />}
            <AvatarFallback className="bg-violet-100 text-xs font-semibold text-violet-700">
              {displayName[0]?.toUpperCase() ?? "A"}
            </AvatarFallback>
          </Avatar>
          <span className="hidden max-w-[100px] truncate text-sm font-medium text-slate-700 sm:inline">
            {displayName}
          </span>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </button>
      </div>
    </header>
  );
}
