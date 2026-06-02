"use client";

import { Smile, Send } from "lucide-react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { EmojiPickerPanel } from "@/components/messaging/emoji-picker-panel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatComposerProps {
  onSend: (text: string) => void | Promise<void>;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}

function ChatComposerInner({
  onSend,
  disabled,
  placeholder = "Type a message…",
  className,
  inputClassName,
}: ChatComposerProps) {
  const [draft, setDraft] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!emojiOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setEmojiOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [emojiOpen]);

  const insertEmoji = useCallback((emoji: string) => {
    setDraft((prev) => prev + emoji);
    inputRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const text = draft.trim();
      if (!text || disabled) return;
      setDraft("");
      await onSend(text);
      inputRef.current?.focus();
    },
    [draft, disabled, onSend]
  );

  const canSend = draft.trim().length > 0 && !disabled;

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("relative flex gap-2 border-t p-3", className)}
    >
      <div className="relative flex min-w-0 flex-1 gap-1" ref={panelRef}>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="shrink-0 text-muted-foreground hover:text-foreground"
          disabled={disabled}
          aria-label="Insert emoji"
          aria-expanded={emojiOpen}
          onClick={() => setEmojiOpen((o) => !o)}
        >
          <Smile className="h-5 w-5" />
        </Button>
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          className={cn(
            "flex h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            inputClassName
          )}
        />
        {emojiOpen ? <EmojiPickerPanel onPick={insertEmoji} /> : null}
      </div>
      <Button type="submit" size="icon" disabled={!canSend} aria-label="Send message">
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
}

export const ChatComposer = memo(ChatComposerInner);
