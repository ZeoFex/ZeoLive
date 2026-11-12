"use client";

import { useRoomContext } from "@livekit/components-react";
import { RoomEvent, Track, type LocalTrackPublication, type RemoteTrack } from "livekit-client";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { toast } from "sonner";

const MAX_RECORDING_BYTES = 400 * 1024 * 1024;

function pickMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4",
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

function fileTypeForMime(mime: string) {
  return mime.startsWith("video/mp4") ? "video/mp4" : "video/webm";
}

function extensionForMime(mime: string) {
  return mime.startsWith("video/mp4") ? "mp4" : "webm";
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function paintStage(canvas: HTMLCanvasElement, root: HTMLElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const rootRect = root.getBoundingClientRect();
  if (rootRect.width < 2 || rootRect.height < 2) return;

  const scale = Math.min(1, 1280 / rootRect.width);
  const width = Math.max(2, Math.round(rootRect.width * scale));
  const height = Math.max(2, Math.round(rootRect.height * scale));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  ctx.fillStyle = "#0b1220";
  ctx.fillRect(0, 0, width, height);

  const nodes = root.querySelectorAll("canvas, video");
  nodes.forEach((node) => {
    if (!(node instanceof HTMLCanvasElement || node instanceof HTMLVideoElement)) return;
    const rect = node.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return;
    if (rect.bottom < rootRect.top || rect.top > rootRect.bottom) return;
    const x = (rect.left - rootRect.left) * scale;
    const y = (rect.top - rootRect.top) * scale;
    const w = rect.width * scale;
    const h = rect.height * scale;
    try {
      ctx.drawImage(node, x, y, w, h);
    } catch {
      /* frame not ready */
    }
  });
}

export function useClassroomRecorder(options: {
  roomId: string;
  rootRef: RefObject<HTMLElement | null>;
  enabled: boolean;
}) {
  const room = useRoomContext();
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const recordingRef = useRef(false);
  const startedAtRef = useRef(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const stopPromiseRef = useRef<Promise<void> | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!recording) return;
    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAtRef.current) / 1000)));
    }, 500);
    return () => window.clearInterval(timer);
  }, [recording]);

  const uploadRecording = useCallback(
    async (blob: Blob, durationSeconds: number, mime: string) => {
      const ext = extensionForMime(mime);
      const fileName = `lesson-${options.roomId}-${Date.now()}.${ext}`;
      if (blob.size < 1000) {
        throw new Error("The recording was empty");
      }
      if (blob.size > MAX_RECORDING_BYTES) {
        downloadBlob(blob, fileName);
        throw new Error("Recording is over 400MB, so it was downloaded to this device instead");
      }

      const file = new File([blob], fileName, { type: fileTypeForMime(mime) });
      const form = new FormData();
      form.set("file", file);
      form.set("durationSeconds", String(durationSeconds));

      const res = await fetch(`/api/classroom/${options.roomId}/recording`, {
        method: "POST",
        body: form,
        credentials: "same-origin",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        downloadBlob(blob, fileName);
        throw new Error(
          typeof json.error === "string"
            ? `${json.error}. A copy was downloaded to this device.`
            : "Could not save the recording. A copy was downloaded to this device."
        );
      }
      toast.success("Recording saved to this lesson for you, your student, and admins.");
    },
    [options.roomId]
  );

  const stopAndSave = useCallback(async () => {
    if (stopPromiseRef.current) return stopPromiseRef.current;
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;

    const mime = recorder.mimeType || "video/webm";
    const durationSeconds = Math.max(
      1,
      Math.round((Date.now() - startedAtRef.current) / 1000)
    );

    const promise = new Promise<void>((resolve, reject) => {
      recorder.addEventListener(
        "stop",
        () => {
          const blob = new Blob(chunksRef.current, { type: fileTypeForMime(mime) });
          chunksRef.current = [];
          void uploadRecording(blob, durationSeconds, mime).then(resolve).catch(reject);
        },
        { once: true }
      );
      recorder.addEventListener("error", () => reject(new Error("Recording failed")), {
        once: true,
      });
      try {
        recorder.stop();
      } catch (error) {
        reject(error instanceof Error ? error : new Error("Could not stop recording"));
      }
    });

    stopPromiseRef.current = promise.finally(() => {
      cleanupRef.current?.();
      cleanupRef.current = null;
      recorderRef.current = null;
      recordingRef.current = false;
      setRecording(false);
      setElapsedSeconds(0);
      stopPromiseRef.current = null;
    });

    return stopPromiseRef.current;
  }, [uploadRecording]);

  const start = useCallback(async () => {
    if (!options.enabled || recordingRef.current) return;
    const root = options.rootRef.current;
    if (!root) {
      toast.error("The classroom is not ready to record yet");
      return;
    }
    const mime = pickMimeType();
    if (!mime || typeof HTMLCanvasElement.prototype.captureStream !== "function") {
      toast.error("This browser cannot record the classroom. Try Chrome or Edge.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = 1280;
    canvas.height = 720;
    const canvasStream = canvas.captureStream(12);
    const videoTrack = canvasStream.getVideoTracks()[0];
    if (!videoTrack) {
      toast.error("Could not start the classroom recording");
      return;
    }

    const audioContext = new AudioContext();
    await audioContext.resume();
    const destination = audioContext.createMediaStreamDestination();
    const connected = new Set<string>();
    const audioNodes: AudioNode[] = [];

    const addTrack = (track: MediaStreamTrack | undefined) => {
      if (!track || track.readyState === "ended" || connected.has(track.id)) return;
      try {
        const source = audioContext.createMediaStreamSource(new MediaStream([track]));
        source.connect(destination);
        connected.add(track.id);
        audioNodes.push(source);
      } catch {
        /* ignore a track that cannot be mixed */
      }
    };

    const syncAudio = () => {
      addTrack(
        room.localParticipant.getTrackPublication(Track.Source.Microphone)?.track
          ?.mediaStreamTrack
      );
      room.remoteParticipants.forEach((participant) => {
        participant.audioTrackPublications.forEach((publication) => {
          addTrack(publication.track?.mediaStreamTrack);
        });
      });
    };

    const onLocalPublished = (publication: LocalTrackPublication) => {
      if (publication.source === Track.Source.Microphone) {
        addTrack(publication.track?.mediaStreamTrack);
      }
    };
    const onRemoteSubscribed = (track: RemoteTrack) => {
      if (track.kind === Track.Kind.Audio) addTrack(track.mediaStreamTrack);
    };

    syncAudio();
    room.on(RoomEvent.LocalTrackPublished, onLocalPublished);
    room.on(RoomEvent.TrackSubscribed, onRemoteSubscribed);

    const paintTimer = window.setInterval(() => paintStage(canvas, root), 1000 / 12);
    const mixed = new MediaStream([
      videoTrack,
      ...destination.stream.getAudioTracks(),
    ]);

    chunksRef.current = [];
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(mixed, { mimeType: mime, videoBitsPerSecond: 1_200_000 });
    } catch (error) {
      window.clearInterval(paintTimer);
      room.off(RoomEvent.LocalTrackPublished, onLocalPublished);
      room.off(RoomEvent.TrackSubscribed, onRemoteSubscribed);
      audioNodes.forEach((node) => node.disconnect());
      videoTrack.stop();
      void audioContext.close();
      throw error instanceof Error ? error : new Error("Could not start recording");
    }
    recorder.addEventListener("dataavailable", (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    });
    recorder.start(1000);

    const release = () => {
      window.clearInterval(paintTimer);
      room.off(RoomEvent.LocalTrackPublished, onLocalPublished);
      room.off(RoomEvent.TrackSubscribed, onRemoteSubscribed);
      audioNodes.forEach((node) => node.disconnect());
      videoTrack.stop();
      void audioContext.close().catch(() => undefined);
    };
    cleanupRef.current = () => {
      cleanupRef.current = null;
      release();
    };

    recorderRef.current = recorder;
    recordingRef.current = true;
    startedAtRef.current = Date.now();
    setElapsedSeconds(0);
    setRecording(true);
    toast.success("Recording started. Stop it to save this lesson.");
  }, [options.enabled, options.rootRef, room]);

  const toggle = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (recordingRef.current) {
        await stopAndSave();
      } else {
        await start();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the recording");
    } finally {
      setBusy(false);
    }
  }, [busy, start, stopAndSave]);

  useEffect(() => {
    return () => {
      const recorder = recorderRef.current;
      if (recorder && recorder.state === "recording") {
        try {
          recorder.stop();
        } catch {
          /* page is closing */
        }
      }
      cleanupRef.current?.();
    };
  }, []);

  return { recording, busy, elapsedSeconds, toggle, stopAndSave };
}
