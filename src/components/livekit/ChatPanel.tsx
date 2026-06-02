"use client";

import { useChat } from "@livekit/components-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChatComposer } from "@/components/messaging/chat-composer";
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

const ClassroomMessageList = memo(function ClassroomMessageList({
  messages,
}: {
  messages: DisplayMessage[];
}) {
  if (messages.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        No messages yet. Say hello!
      </p>
    );
  }

  return (
    <>
      {messages.map((msg) => (
        <div key={msg.id}>
          <p className="text-xs font-medium text-muted-foreground">{msg.senderLabel}</p>
          <p className="mt-0.5 whitespace-pre-wrap rounded-lg bg-muted px-3 py-2 text-sm leading-relaxed text-foreground">
            {msg.body}
          </p>
        </div>
      ))}
    </>
  );
});

export function ChatPanel({ className, roomId }: ChatPanelProps) {
  const { chatMessages, send, isSending } = useChat();
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

  const persistMessage = useCallback(
    async (text: string, clientMessageId: string) => {
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
    },
    [roomId]
  );

  const handleSend = useCallback(
    async (text: string) => {
      if (!text || isSending) return;
      const clientMessageId = `lk-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      await send(text);
      void persistMessage(text, clientMessageId);
    },
    [isSending, persistMessage, send]
  );

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

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          <ClassroomMessageList messages={displayMessages} />
          <div ref={bottomRef} />
        </div>
        <ChatComposer
          onSend={handleSend}
          disabled={isSending}
          placeholder="Send a message…"
          className="border-border"
          inputClassName="bg-background"
        />
      </div>
    </aside>
  );
}
