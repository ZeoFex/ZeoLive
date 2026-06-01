"use client";

import { Loader2, UserRound } from "lucide-react";

export function WaitingRoom() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="relative">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <UserRound className="h-10 w-10 text-primary" />
        </div>
        <Loader2 className="absolute -bottom-1 -right-1 h-8 w-8 animate-spin text-primary" />
      </div>
      <div className="max-w-sm space-y-2">
        <h2 className="text-xl font-semibold text-foreground">
          Waiting for tutor to start the session
        </h2>
        <p className="text-sm text-muted-foreground">
          You are connected. Your tutor will appear here as soon as they join. Please
          keep this tab open.
        </p>
      </div>
    </div>
  );
}
