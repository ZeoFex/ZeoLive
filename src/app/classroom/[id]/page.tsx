"use client";

import { useEffect, useState } from "react";
import {
  Hand,
  MessageSquare,
  Mic,
  MicOff,
  Monitor,
  PenTool,
  PhoneOff,
  Users,
  Video,
  VideoOff,
} from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const participants = [
  { id: "1", name: "Dr. Sarah Chen", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah", host: true },
  { id: "2", name: "Alex Morgan", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex", host: false },
];

const chatMessages = [
  { id: "1", user: "Dr. Sarah Chen", text: "Welcome to today's calculus session!" },
  { id: "2", user: "Alex Morgan", text: "Ready when you are!" },
];

export default function ClassroomPage() {
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex h-screen flex-col bg-slate-950 text-white">
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="font-semibold">Calculus II</span>
          <Badge variant="secondary">Recording</Badge>
          <span className="text-sm text-white/60">{formatTimer(timer)}</span>
        </div>
        <Button variant="destructive" size="sm" asChild>
          <Link href="/student/dashboard">
            <PhoneOff className="mr-2 h-4 w-4" />
            Leave
          </Link>
        </Button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <main className="relative flex flex-1 flex-col p-4">
          {showWhiteboard ? (
            <div className="flex flex-1 items-center justify-center rounded-2xl border border-white/10 bg-white">
              <div className="text-center text-slate-600">
                <PenTool className="mx-auto h-12 w-12" />
                <p className="mt-2 font-medium">Interactive Whiteboard</p>
                <p className="text-sm">Draw and collaborate in real-time</p>
              </div>
            </div>
          ) : (
            <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
              {participants.map((p) => (
                <div
                  key={p.id}
                  className="relative flex aspect-video items-center justify-center overflow-hidden rounded-2xl bg-slate-800"
                >
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={p.avatar} alt={p.name} />
                    <AvatarFallback>{p.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg bg-black/50 px-3 py-1.5 text-sm backdrop-blur">
                    <span>{p.name}</span>
                    {p.host && <Badge className="text-[10px]">Host</Badge>}
                  </div>
                  {(p.id === "2" && cameraOff) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
                      <VideoOff className="h-8 w-8 text-white/50" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <Button
              size="icon"
              variant={muted ? "destructive" : "secondary"}
              className="rounded-full h-12 w-12"
              onClick={() => setMuted(!muted)}
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {muted ? <MicOff /> : <Mic />}
            </Button>
            <Button
              size="icon"
              variant={cameraOff ? "destructive" : "secondary"}
              className="rounded-full h-12 w-12"
              onClick={() => setCameraOff(!cameraOff)}
              aria-label={cameraOff ? "Turn on camera" : "Turn off camera"}
            >
              {cameraOff ? <VideoOff /> : <Video />}
            </Button>
            <Button
              size="icon"
              variant={screenSharing ? "default" : "secondary"}
              className="rounded-full h-12 w-12"
              onClick={() => setScreenSharing(!screenSharing)}
              aria-label="Share screen"
            >
              <Monitor />
            </Button>
            <Button
              size="icon"
              variant={handRaised ? "default" : "secondary"}
              className={cn("rounded-full h-12 w-12", handRaised && "ring-2 ring-amber-400")}
              onClick={() => setHandRaised(!handRaised)}
              aria-label="Raise hand"
            >
              <Hand />
            </Button>
            <Button
              size="icon"
              variant={showWhiteboard ? "default" : "secondary"}
              className="rounded-full h-12 w-12"
              onClick={() => setShowWhiteboard(!showWhiteboard)}
              aria-label="Whiteboard"
            >
              <PenTool />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="rounded-full h-12 w-12"
              onClick={() => setShowChat(!showChat)}
              aria-label="Toggle chat"
            >
              <MessageSquare />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="rounded-full h-12 w-12"
              onClick={() => setShowParticipants(!showParticipants)}
              aria-label="Participants"
            >
              <Users />
            </Button>
          </div>
        </main>

        {(showChat || showParticipants) && (
          <aside className="flex w-full max-w-sm flex-col border-l border-white/10 md:w-80">
            {showParticipants && (
              <div className="border-b border-white/10 p-4">
                <h3 className="mb-3 text-sm font-semibold">Participants ({participants.length})</h3>
                {participants.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 py-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={p.avatar} alt={p.name} />
                      <AvatarFallback>{p.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{p.name}</span>
                  </div>
                ))}
              </div>
            )}
            {showChat && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {chatMessages.map((m) => (
                    <div key={m.id}>
                      <p className="text-xs text-white/50">{m.user}</p>
                      <p className="mt-0.5 rounded-lg bg-white/10 px-3 py-2 text-sm">{m.text}</p>
                    </div>
                  ))}
                </div>
                <form className="flex gap-2 border-t border-white/10 p-4" onSubmit={(e) => e.preventDefault()}>
                  <Input
                    placeholder="Send a message..."
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  />
                  <Button type="submit" size="sm">Send</Button>
                </form>
              </>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
