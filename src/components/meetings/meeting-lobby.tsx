"use client";

import { Loader2, Mic, MicOff, Video, VideoOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const DEVICE_KEY = "ztl-join-devices";

export function MeetingLobby({
  roomId,
  meetingTitle,
}: {
  roomId: string;
  meetingTitle?: string;
}) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [name, setName] = useState("");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [deviceNote, setDeviceNote] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function openDevices() {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      if (!micOn && !camOn) return;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: micOn,
          video: camOn,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current && camOn) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
        setDeviceNote("");
      } catch {
        if (cancelled) return;
        if (camOn) setCamOn(false);
        if (micOn) setMicOn(false);
        setDeviceNote("The browser blocked the camera or microphone. You can still join with them off.");
      }
    }

    void openDevices();

    return () => {
      cancelled = true;
    };
  }, [micOn, camOn]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const trimmed = name.trim().replace(/\s+/g, " ");
  const nameReady = trimmed.length >= 2 && trimmed.length <= 40;

  async function join() {
    if (!nameReady || busy) return;
    setBusy(true);
    setError("");
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    try {
      sessionStorage.setItem(DEVICE_KEY, JSON.stringify({ audio: micOn, video: camOn }));
      const res = await fetch(`/api/join/${roomId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ displayName: trimmed }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof json.error === "string" ? json.error : "Could not join this meeting");
      }
      router.push(typeof json.classroomPath === "string" ? json.classroomPath : `/classroom/${roomId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not join this meeting");
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F3F8FC]">
      <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-[#00aeef]/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-[#0066CC]/15 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-lg flex-col items-center justify-center px-5 py-12">
        <div className="flex items-center gap-3">
          <Logo href="/" size="lg" variant="mark" />
          <span className="text-2xl font-extrabold tracking-tight text-[#0B4F8A]">ZTL</span>
        </div>

        <div className="mt-8 w-full rounded-[28px] border border-white bg-white px-6 py-8 shadow-[0_24px_60px_-28px_rgba(0,84,166,0.45)] sm:px-8">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0066CC]">
            Live classroom
          </p>
          <h1 className="mt-2 text-center text-2xl font-bold tracking-tight text-slate-900">
            Join this meeting
          </h1>
          {meetingTitle ? (
            <p className="mt-1 text-center text-base font-semibold text-[#0B4F8A]">{meetingTitle}</p>
          ) : null}

          <div className="relative mx-auto mt-6 aspect-video w-full overflow-hidden rounded-2xl bg-slate-900">
            <video
              ref={videoRef}
              muted
              playsInline
              className={`h-full w-full object-cover ${camOn ? "" : "hidden"}`}
              style={{ transform: "scaleX(-1)" }}
            />
            {!camOn ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15 text-2xl font-semibold">
                  {(trimmed.charAt(0) || "?").toUpperCase()}
                </div>
                <p className="mt-3 text-sm text-white/80">Camera is off</p>
              </div>
            ) : null}
          </div>

          <div className="mt-4 flex justify-center gap-3">
            <Button
              type="button"
              size="icon"
              variant={micOn ? "secondary" : "destructive"}
              className="h-12 w-12 rounded-full"
              onClick={() => setMicOn((on) => !on)}
              aria-pressed={micOn}
              aria-label={micOn ? "Turn microphone off" : "Turn microphone on"}
            >
              {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </Button>
            <Button
              type="button"
              size="icon"
              variant={camOn ? "secondary" : "destructive"}
              className="h-12 w-12 rounded-full"
              onClick={() => setCamOn((on) => !on)}
              aria-pressed={camOn}
              aria-label={camOn ? "Turn camera off" : "Turn camera on"}
            >
              {camOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </Button>
          </div>
          {deviceNote ? <p className="mt-3 text-center text-xs text-slate-500">{deviceNote}</p> : null}

          <label className="mt-6 block text-sm font-medium text-slate-800" htmlFor="meeting-display-name">
            What name should we show?
          </label>
          <p className="mt-1 text-sm text-slate-500">Everyone in the meeting will see this name.</p>
          <Input
            id="meeting-display-name"
            className="mt-2 h-11 rounded-xl"
            value={name}
            maxLength={40}
            placeholder="For example, Ama"
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void join();
            }}
          />

          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

          <Button
            type="button"
            className="mt-5 h-11 w-full rounded-xl bg-[#0066CC] text-white hover:bg-[#0054a6]"
            disabled={!nameReady || busy}
            onClick={() => void join()}
          >
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Join
          </Button>
        </div>
      </div>
    </div>
  );
}
