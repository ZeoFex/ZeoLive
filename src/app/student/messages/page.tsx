"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { chatMessages, conversations } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export default function StudentMessagesPage() {
  const [activeId, setActiveId] = useState(conversations[0]?.id);
  const [typing, setTyping] = useState(false);
  const active = conversations.find((c) => c.id === activeId);

  return (
    <>
      <DashboardHeader title="Messages" subtitle="Chat with your tutors" />
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-full max-w-xs border-r overflow-y-auto hidden md:block">
          {conversations.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveId(c.id)}
              className={cn(
                "flex w-full items-center gap-3 border-b p-4 text-left transition-colors hover:bg-muted/50",
                activeId === c.id && "bg-muted"
              )}
            >
              <div className="relative">
                <Avatar>
                  <AvatarImage src={c.participantAvatar} alt={c.participantName} />
                  <AvatarFallback>{c.participantName[0]}</AvatarFallback>
                </Avatar>
                {c.online && (
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-emerald-500" />
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-between">
                  <p className="font-medium truncate">{c.participantName}</p>
                  {c.unread > 0 && <Badge className="ml-1">{c.unread}</Badge>}
                </div>
                <p className="truncate text-xs text-muted-foreground">{c.lastMessage}</p>
              </div>
            </button>
          ))}
        </aside>

        <div className="flex flex-1 flex-col">
          {active && (
            <div className="flex items-center gap-3 border-b p-4">
              <Avatar>
                <AvatarImage src={active.participantAvatar} alt={active.participantName} />
                <AvatarFallback>{active.participantName[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{active.participantName}</p>
                <p className="text-xs text-muted-foreground">
                  {active.online ? "Online" : "Offline"}
                </p>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex",
                  m.isOwn ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                    m.isOwn
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <p>{m.content}</p>
                  <p className="mt-1 text-xs opacity-70">{m.timestamp}</p>
                </div>
              </div>
            ))}
            {typing && (
              <p className="text-xs text-muted-foreground">
                Sarah Chen is typing…
              </p>
            )}
          </div>

          <form
            className="flex gap-2 border-t p-4"
            onSubmit={(e) => {
              e.preventDefault();
              setTyping(true);
              setTimeout(() => setTyping(false), 2000);
            }}
          >
            <Input placeholder="Type a message..." className="flex-1" />
            <Button type="submit" size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
