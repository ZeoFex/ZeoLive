"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Clock, Wifi, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

interface SessionHeaderProps {
  title: string;
  subject?: string | null;
  elapsedSeconds?: number;
  isReconnecting?: boolean;
  isConnected?: boolean;
  className?: string;
}

export function SessionHeader({
  title,
  subject,
  elapsedSeconds = 0,
  isReconnecting,
  isConnected,
  className,
}: SessionHeaderProps) {
  const [elapsed, setElapsed] = useState(elapsedSeconds);

  useEffect(() => {
    setElapsed(elapsedSeconds);
  }, [elapsedSeconds]);

  useEffect(() => {
    const interval = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timer = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  return (
    <header
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-card/80 px-4 py-3 backdrop-blur-md",
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="truncate text-lg font-semibold text-foreground">{title}</h1>
        {subject && (
          <p className="truncate text-sm text-muted-foreground">{subject}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {isReconnecting ? (
          <Badge variant="secondary" className="gap-1 bg-amber-500/15 text-amber-700 dark:text-amber-300">
            <WifiOff className="h-3 w-3" />
            Reconnecting…
          </Badge>
        ) : isConnected ? (
          <Badge variant="secondary" className="gap-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
            <Wifi className="h-3 w-3" />
            Connected
          </Badge>
        ) : null}

        <Badge variant="outline" className="gap-1 font-mono tabular-nums">
          <Clock className="h-3 w-3" />
          {timer}
        </Badge>
      </div>
    </header>
  );
}
