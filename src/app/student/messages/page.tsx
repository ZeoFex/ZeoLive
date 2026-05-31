"use client";

import { Suspense, useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { StudentPageHeader } from "@/components/layout/student-page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { chatMessages, conversations } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

function MessagesContent() {
  const [activeId, setActiveId] = useState(conversations[0]?.id);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const active = conversations.find((c) => c.id === activeId);

  const selectConversation = (id: string) => {
    setActiveId(id);
    setMobileShowChat(true);
  };

  return (
    <>
      <StudentPageHeader title="Messages" description="Chat with your tutors." />

      <div className="student-card flex min-h-[min(520px,calc(100dvh-14rem))] flex-col overflow-hidden sm:min-h-[520px] sm:flex-row lg:min-h-[560px]">
        <aside
          className={cn(
            "w-full border-b border-slate-100 sm:max-w-xs sm:border-b-0 sm:border-r",
            mobileShowChat ? "hidden sm:block" : "block"
          )}
        >
          <div className="max-h-[min(280px,40dvh)] overflow-y-auto sm:max-h-none sm:flex-1">
            {conversations.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => selectConversation(c.id)}
                className={cn(
                  "flex w-full items-center gap-3 border-b border-slate-50 p-4 text-left transition-colors hover:bg-slate-50",
                  activeId === c.id && "bg-violet-50/60"
                )}
              >
                <div className="relative shrink-0">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={c.participantAvatar} alt={c.participantName} />
                    <AvatarFallback>{c.participantName[0]}</AvatarFallback>
                  </Avatar>
                  {c.online && (
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-semibold text-slate-900">{c.participantName}</p>
                    {c.unread > 0 && (
                      <Badge className="student-gradient-btn shrink-0 border-0 px-1.5 py-0 text-[10px]">
                        {c.unread}
                      </Badge>
                    )}
                  </div>
                  <p className="truncate text-xs text-slate-500">{c.lastMessage}</p>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col",
            !mobileShowChat && "hidden sm:flex"
          )}
        >
          {active ? (
            <>
              <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 sm:hidden"
                  onClick={() => setMobileShowChat(false)}
                  aria-label="Back to conversations"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Avatar className="h-9 w-9">
                  <AvatarImage src={active.participantAvatar} alt={active.participantName} />
                  <AvatarFallback>{active.participantName[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-slate-900">{active.participantName}</p>
                  <p className="text-xs text-slate-500">
                    {active.online ? "Online" : "Offline"}
                  </p>
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {chatMessages.map((m) => (
                  <div
                    key={m.id}
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                      m.senderId === "student"
                        ? "ml-auto bg-violet-600 text-white"
                        : "bg-slate-100 text-slate-800"
                    )}
                  >
                    {m.content}
                  </div>
                ))}
              </div>

              <div className="flex min-h-0 flex-1 gap-2 border-t border-slate-100 p-3">
                <Input
                  placeholder="Type a message..."
                  className="min-w-0 flex-1 rounded-xl"
                />
                <Button
                  size="icon"
                  className="student-gradient-btn shrink-0 rounded-xl border-0"
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <p className="flex flex-1 items-center justify-center text-sm text-slate-500">
              Select a conversation
            </p>
          )}
        </div>
      </div>
    </>
  );
}

export default function StudentMessagesPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
      <MessagesContent />
    </Suspense>
  );
}
