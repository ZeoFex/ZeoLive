"use client";

import { useChat } from "@livekit/components-react";
import { Send } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function ChatPanel({ className }: { className?: string }) {
  const { chatMessages, send, isSending } = useChat();
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || isSending) return;
    setDraft("");
    await send(text);
  };

  return (
    <aside
      className={cn(
        "flex w-full flex-col border-border bg-card/50 md:w-80 md:border-l",
        className
      )}
    >
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">Session chat</h2>
        <p className="text-xs text-muted-foreground">Messages are visible to everyone in the room</p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {chatMessages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            No messages yet. Say hello!
          </p>
        ) : (
          chatMessages.map((msg) => (
            <div key={msg.timestamp}>
              <p className="text-xs font-medium text-muted-foreground">
                {msg.from?.name ?? msg.from?.identity ?? "Participant"}
              </p>
              <p className="mt-0.5 rounded-lg bg-muted px-3 py-2 text-sm text-foreground">
                {msg.message}
              </p>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSend}
        className="flex gap-2 border-t border-border p-3"
      >
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Send a message…"
          className="bg-background"
          disabled={isSending}
        />
        <Button type="submit" size="icon" disabled={!draft.trim() || isSending} aria-label="Send message">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </aside>
  );
}
