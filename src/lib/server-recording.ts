import {
  EgressClient,
  EncodedFileOutput,
  EncodedFileType,
  S3Upload,
  WebhookConfig,
  type EgressInfo,
} from "livekit-server-sdk";
import { getAppBaseUrl } from "@/lib/app-url";
import { isCloudinaryConfigured, uploadVideo } from "@/lib/cloudinary";
import { getLiveKitServerUrl, isLiveKitConfigured } from "@/lib/livekit";
import { prisma } from "@/lib/prisma";

function liveKitHttpHost() {
  return getLiveKitServerUrl().replace(/^ws/i, "http");
}

function egressClient() {
  if (!isLiveKitConfigured()) {
    throw new Error("LiveKit is not configured");
  }
  return new EgressClient(
    liveKitHttpHost(),
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET
  );
}

function s3Storage() {
  const bucket = process.env.RECORDING_S3_BUCKET?.trim();
  const accessKey = process.env.RECORDING_S3_ACCESS_KEY?.trim();
  const secret = process.env.RECORDING_S3_SECRET?.trim();
  const region = process.env.RECORDING_S3_REGION?.trim();
  if (!bucket || !accessKey || !secret || !region) return null;
  return {
    bucket,
    accessKey,
    secret,
    region,
    endpoint: process.env.RECORDING_S3_ENDPOINT?.trim() || "",
  };
}

function fileOutput(roomId: string) {
  const filepath = `zeolive/${roomId}-${Date.now()}.mp4`;
  const storage = s3Storage();
  if (!storage) {
    return new EncodedFileOutput({
      fileType: EncodedFileType.MP4,
      filepath,
    });
  }
  return new EncodedFileOutput({
    fileType: EncodedFileType.MP4,
    filepath,
    output: {
      case: "s3",
      value: new S3Upload({
        accessKey: storage.accessKey,
        secret: storage.secret,
        region: storage.region,
        bucket: storage.bucket,
        endpoint: storage.endpoint,
        forcePathStyle: Boolean(storage.endpoint),
      }),
    },
  });
}

export async function startServerRecording(roomId: string) {
  const client = egressClient();
  const active = await client.listEgress({ roomName: roomId, active: true });
  for (const egress of active) {
    if (egress.egressId) {
      await client.stopEgress(egress.egressId).catch(() => undefined);
    }
  }

  const info = await client.startRoomCompositeEgress(roomId, fileOutput(roomId), {
    layout: "speaker",
    webhooks: [new WebhookConfig({ url: `${getAppBaseUrl()}/api/livekit/webhook` })],
  });

  return { egressId: info.egressId };
}

function objectKey(file: { location?: string; filename?: string }) {
  const filename = file.filename?.trim() ?? "";
  if (filename && !filename.includes("://")) {
    return filename.replace(/^\/+/, "");
  }
  const location = file.location?.trim() ?? "";
  try {
    const path = decodeURIComponent(new URL(location).pathname.replace(/^\/+/, ""));
    const bucket = process.env.RECORDING_S3_BUCKET?.trim();
    if (bucket && path.startsWith(`${bucket}/`)) return path.slice(bucket.length + 1);
    return path;
  } catch {
    return "";
  }
}

async function fileUrlForEgress(file: { location?: string; filename?: string }) {
  const publicBase = process.env.RECORDING_PUBLIC_BASE_URL?.trim().replace(/\/$/, "");
  const key = objectKey(file);
  if (publicBase && key) return `${publicBase}/${key}`;

  const location = file.location?.trim() || "";
  if (!location) return "";
  if (
    isCloudinaryConfigured() &&
    location.startsWith("http") &&
    !location.includes("res.cloudinary.com")
  ) {
    const uploaded = await uploadVideo(location, "zoelive/recordings");
    return uploaded.secure_url;
  }
  return location;
}

export async function saveCompletedEgress(info: EgressInfo) {
  const roomId = info.roomName?.trim();
  const egressId = info.egressId?.trim();
  if (!roomId || !egressId) return null;

  const session = await prisma.tutoringSession.findUnique({
    where: { roomId },
    select: { id: true, tutorId: true, title: true, subject: true },
  });
  if (!session) return null;

  const fileName = `egress-${egressId}.mp4`;
  const existing = await prisma.sessionRecording.findFirst({
    where: { tutoringSessionId: session.id, fileName },
    select: { id: true },
  });
  if (existing) return existing;

  const file = info.fileResults?.[0];
  if (!file) return null;
  const fileUrl = await fileUrlForEgress(file);
  if (!fileUrl.startsWith("http")) return null;

  const size = Number(file.size || 0);
  return prisma.sessionRecording.create({
    data: {
      tutoringSessionId: session.id,
      uploadedById: session.tutorId,
      title: session.title?.trim() || session.subject?.trim() || "Live lesson recording",
      description: "Recorded by the server",
      fileUrl,
      fileName,
      mimeType: "video/mp4",
      fileSizeBytes: Number.isFinite(size) && size > 0 ? Math.round(size) : 1,
      durationSeconds: file.duration ? Math.max(1, Math.round(Number(file.duration) / 1_000_000_000)) : null,
      source: "EGRESS",
    },
  });
}

export async function stopServerRecording(egressId: string) {
  const client = egressClient();
  let info = await client.stopEgress(egressId);
  for (let attempt = 0; attempt < 4 && !info.fileResults?.length; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const listed = await client.listEgress({ egressId });
    info = listed[0] ?? info;
  }
  const saved = await saveCompletedEgress(info);
  return { saved: Boolean(saved) };
}
