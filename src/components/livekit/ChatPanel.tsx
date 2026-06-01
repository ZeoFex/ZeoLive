"use client";

import { useChat } from "@livekit/components-react";
import { Send } from "lucide-react";
import { useRef, useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { StoredMessageDto } from "@/lib/messaging";

interface ChatPanelProps {
  className?: string;
  roomId: string;
}

type DisplayMessage = {
  id: string;
  senderLabel: string;
  body: string;
  createdAt: string;
};

export function ChatPanel({ className, roomId }: ChatPanelProps) {
  const { chatMessages, send, isSending } = useChat();
  const [draft, setDraft] = useState("");
  const [archived, setArchived] = useState<StoredMessageDto[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(
          `/api/messages/classroom?roomId=${encodeURIComponent(roomId)}`,
          { credentials: "same-origin" }
        );
        const json = await res.json();
        if (!cancelled && res.ok) {
          setArchived(json.messages ?? []);
        }
      } catch {
        /* non-fatal */
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [roomId]);

  const displayMessages = useMemo(() => {
    const map = new Map<string, DisplayMessage>();

    for (const m of archived) {
      map.set(m.id, {
        id: m.id,
        senderLabel: m.senderName,
        body: m.body,
        createdAt: m.createdAt,
      });
    }

    for (const msg of chatMessages) {
      const clientId =
        msg.id ??
        `${msg.timestamp}-${msg.from?.identity ?? "unknown"}-${msg.message}`;
      if (map.has(clientId)) continue;
      map.set(clientId, {
        id: clientId,
        senderLabel: msg.from?.name ?? msg.from?.identity ?? "Participant",
        body: msg.message,
        createdAt: new Date(msg.timestamp).toISOString(),
      });
    }

    return [...map.values()].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [archived, chatMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages.length]);

  const persistMessage = async (text: string, clientMessageId: string) => {
    try {
      await fetch("/api/messages/classroom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          roomId,
          body: text,
          clientMessageId,
        }),
      });
    } catch {
      /* logged server-side when failing */
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || isSending) return;
    setDraft("");

    const clientMessageId = `lk-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    await send(text);
    void persistMessage(text, clientMessageId);
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
        <p className="text-xs text-muted-foreground">
          Saved for safety review by administrators
        </p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {displayMessages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            No messages yet. Say hello!
          </p>
        ) : (
          displayMessages.map((msg) => (
            <div key={msg.id}>
              <p className="text-xs font-medium text-muted-foreground">
                {msg.senderLabel}
              </p>
              <p className="mt-0.5 rounded-lg bg-muted px-3 py-2 text-sm text-foreground">
                {msg.body}
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
        <Button
          type="submit"
          size="icon"
          disabled={!draft.trim() || isSending}
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </aside>
  );
}
