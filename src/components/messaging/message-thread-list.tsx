"use client";

import { Loader2, Trash2 } from "lucide-react";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import type { StoredMessageDto } from "@/lib/messaging";
import { cn } from "@/lib/utils";

type MessageBubbleProps = {
  msg: StoredMessageDto;
  isOwn: boolean;
  deleting: boolean;
  onDelete: (msg: StoredMessageDto) => void;
};

const MessageBubble = memo(function MessageBubble({
  msg,
  isOwn,
  deleting,
  onDelete,
}: MessageBubbleProps) {
  return (
    <div className={cn("group flex gap-2", isOwn ? "flex-row-reverse" : "flex-row")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3 py-2",
          isOwn ? "bg-primary text-primary-foreground" : "bg-muted"
        )}
      >
        {!isOwn && (
          <p className="text-[10px] font-medium opacity-80">
            {msg.senderName}
            {msg.channel === "CLASSROOM" && " · classroom"}
          </p>
        )}
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.body}</p>
      </div>
      {isOwn && (
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8 shrink-0 self-end opacity-0 group-hover:opacity-100 focus:opacity-100"
          disabled={deleting}
          title="Delete message"
          onClick={() => onDelete(msg)}
        >
          {deleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      )}
    </div>
  );
});

type MessageThreadListProps = {
  messages: StoredMessageDto[];
  currentUserId?: string;
  loading?: boolean;
  deletingMessageId: string | null;
  onRequestDelete: (msg: StoredMessageDto) => void;
};

function MessageThreadListInner({
  messages,
  currentUserId,
  loading,
  deletingMessageId,
  onRequestDelete,
}: MessageThreadListProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground">No messages yet.</p>
    );
  }

  return (
    <>
      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          msg={msg}
          isOwn={Boolean(currentUserId && msg.senderId === currentUserId)}
          deleting={deletingMessageId === msg.id}
          onDelete={onRequestDelete}
        />
      ))}
    </>
  );
}

export const MessageThreadList = memo(MessageThreadListInner);
