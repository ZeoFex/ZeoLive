"use client";

import { Loader2, Pause, Play, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { StoredMessageDto } from "@/lib/messaging";

interface TranscriptPlaybackProps {
  messages: StoredMessageDto[];
  className?: string;
}

export function TranscriptPlayback({ messages, className }: TranscriptPlaybackProps) {
  const [playing, setPlaying] = useState(false);
  const [index, setIndex] = useState(0);

  const step = useCallback(() => {
    setIndex((i) => {
      if (i >= messages.length - 1) {
        setPlaying(false);
        return i;
      }
      return i + 1;
    });
  }, [messages.length]);

  useEffect(() => {
    if (!playing || messages.length === 0) return;
    const timer = window.setInterval(step, 2200);
    return () => window.clearInterval(timer);
  }, [playing, messages.length, step]);

  if (messages.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        onClick={() => {
          if (playing) {
            setPlaying(false);
          } else {
            if (index >= messages.length - 1) setIndex(0);
            setPlaying(true);
          }
        }}
      >
        {playing ? (
          <>
            <Pause className="mr-2 h-4 w-4" />
            Pause playback
          </>
        ) : (
          <>
            <Play className="mr-2 h-4 w-4" />
            Play transcript
          </>
        )}
      </Button>
      <span className="text-xs text-muted-foreground">
        {playing
          ? `Showing message ${index + 1} of ${messages.length}`
          : "Step through messages in order for review"}
      </span>
    </div>
  );
}

export function useTranscriptHighlightIndex(
  playing: boolean,
  index: number
): number | null {
  return playing ? index : null;
}

export function TranscriptMessageList({
  messages,
  highlightIndex,
  className,
  onRequestDeleteMessage,
  deletingMessageId,
}: {
  messages: StoredMessageDto[];
  highlightIndex?: number | null;
  className?: string;
  onRequestDeleteMessage?: (message: StoredMessageDto) => void;
  deletingMessageId?: string | null;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {messages.map((msg, i) => (
        <div
          key={msg.id}
          id={`msg-${msg.id}`}
          className={cn(
            "group rounded-lg border border-transparent px-3 py-2 transition-colors",
            highlightIndex === i && "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{msg.senderName}</span>
              <span className="capitalize">({msg.senderRole.toLowerCase()})</span>
              <span>·</span>
              <time dateTime={msg.createdAt}>
                {new Date(msg.createdAt).toLocaleString()}
              </time>
              {msg.channel === "CLASSROOM" && (
                <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium uppercase text-emerald-700 dark:text-emerald-300">
                  Classroom
                </span>
              )}
            </div>
            {onRequestDeleteMessage && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8 shrink-0 text-slate-400 opacity-100 hover:bg-red-50 hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                disabled={deletingMessageId === msg.id}
                title="Delete message"
                onClick={() => onRequestDeleteMessage(msg)}
              >
                {deletingMessageId === msg.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {msg.body}
          </p>
        </div>
      ))}
    </div>
  );
}
