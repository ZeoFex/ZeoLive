"use client";

import type { ReactNode } from "react";
import { Loader2, Mic, MicOff, Video, VideoOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const DEVICE_KEY = "ztl-join-devices";
const NAME_KEY = "ztl-join-name";

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
  const [micNote, setMicNote] = useState("");
  const [camNote, setCamNote] = useState("");

  useEffect(() => {
    const saved = sessionStorage.getItem(NAME_KEY);
    if (saved) setName(saved);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const owned: MediaStreamTrack[] = [];

    async function openPreview() {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      setMicNote("");
      setCamNote("");

      if (micOn) {
        try {
          const audio = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          if (cancelled) {
            audio.getTracks().forEach((track) => track.stop());
            return;
          }
          owned.push(...audio.getTracks());
        } catch {
          if (!cancelled) {
            setMicOn(false);
            setMicNote("The browser blocked the microphone. You can still join with it off.");
          }
        }
      }

      if (camOn) {
        try {
          const video = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
          if (cancelled) {
            video.getTracks().forEach((track) => track.stop());
            return;
          }
          owned.push(...video.getTracks());
          if (videoRef.current) {
            videoRef.current.srcObject = new MediaStream(video.getVideoTracks());
            await videoRef.current.play().catch(() => undefined);
          }
        } catch {
          if (!cancelled) {
            setCamOn(false);
            setCamNote("The browser blocked the camera. You can still join with your face hidden.");
          }
        }
      }

      streamRef.current = new MediaStream(owned);
    }

    void openPreview();

    return () => {
      cancelled = true;
      owned.forEach((track) => track.stop());
    };
  }, [micOn, camOn]);

  const trimmed = name.trim().replace(/\s+/g, " ");
  const nameReady = trimmed.length >= 2 && trimmed.length <= 40;

  async function join() {
    if (!nameReady || busy) return;
    setBusy(true);
    setError("");
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    try {
      sessionStorage.setItem(NAME_KEY, trimmed);
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
    <div className="relative min-h-screen overflow-hidden bg-[#EAF3FB]">
      <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-[#00aeef]/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-[#0066CC]/20 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-4 py-10">
        <div className="mb-6 flex items-center gap-3">
          <Logo href="/" size="lg" variant="mark" />
          <span className="text-2xl font-extrabold tracking-tight text-[#0B4F8A]">ZTL</span>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-white bg-white shadow-[0_30px_80px_-36px_rgba(0,84,166,0.55)]">
          <div className="grid md:grid-cols-[1.15fr_0.85fr]">
            <div className="bg-[#07111F] p-4 sm:p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7EC8FF]">
                Preview
              </p>
              <div className="relative mt-3 aspect-video overflow-hidden rounded-2xl bg-[#101A2B]">
                <video
                  ref={videoRef}
                  muted
                  playsInline
                  className={cn("h-full w-full object-cover", camOn ? "" : "hidden")}
                  style={{ transform: "scaleX(-1)" }}
                />
                {!camOn ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10 text-3xl font-semibold">
                      {(trimmed.charAt(0) || "?").toUpperCase()}
                    </div>
                    <p className="mt-3 text-sm text-white/75">Your face is hidden</p>
                  </div>
                ) : null}
                <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-black/55 px-3 py-1 text-xs text-white">
                  {micOn ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
                  {micOn ? "Microphone on" : "Microphone off"}
                </div>
              </div>
              {meetingTitle ? (
                <p className="mt-4 text-sm font-medium text-white/80">{meetingTitle}</p>
              ) : null}
            </div>

            <div className="px-5 py-6 sm:px-6">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Join this meeting</h1>
              <p className="mt-1 text-sm text-slate-500">
                You can leave and come back with this link until the tutor ends the meeting.
              </p>

              <label className="mt-5 block text-sm font-semibold text-slate-800" htmlFor="meeting-display-name">
                What name should we use for you?
              </label>
              <Input
                id="meeting-display-name"
                className="mt-2 h-11 rounded-xl"
                value={name}
                maxLength={40}
                placeholder="The name people will see"
                onChange={(event) => setName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void join();
                }}
              />

              <p className="mt-5 text-sm font-semibold text-slate-800">Microphone</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Choice
                  active={micOn}
                  icon={<Mic className="h-4 w-4" />}
                  label="On"
                  onClick={() => setMicOn(true)}
                />
                <Choice
                  active={!micOn}
                  icon={<MicOff className="h-4 w-4" />}
                  label="Off"
                  onClick={() => setMicOn(false)}
                />
              </div>
              {micNote ? <p className="mt-2 text-xs text-slate-500">{micNote}</p> : null}

              <p className="mt-5 text-sm font-semibold text-slate-800">Do you want your face to show?</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Choice
                  active={camOn}
                  icon={<Video className="h-4 w-4" />}
                  label="Show my face"
                  onClick={() => setCamOn(true)}
                />
                <Choice
                  active={!camOn}
                  icon={<VideoOff className="h-4 w-4" />}
                  label="Keep it off"
                  onClick={() => setCamOn(false)}
                />
              </div>
              {camNote ? <p className="mt-2 text-xs text-slate-500">{camNote}</p> : null}

              {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

              <Button
                type="button"
                className="mt-6 h-12 w-full rounded-xl bg-[#0066CC] text-base text-white hover:bg-[#0054a6]"
                disabled={!nameReady || busy}
                onClick={() => void join()}
              >
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Join meeting
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Choice({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-medium transition",
        active
          ? "border-[#0066CC] bg-[#0066CC] text-white"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      )}
      aria-pressed={active}
    >
      {icon}
      {label}
    </button>
  );
}
