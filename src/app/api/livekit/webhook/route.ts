import { NextResponse } from "next/server";
import { WebhookReceiver } from "livekit-server-sdk";
import { isLiveKitConfigured } from "@/lib/livekit";
import { saveCompletedEgress } from "@/lib/server-recording";

export async function POST(request: Request) {
  if (!isLiveKitConfigured()) {
    return NextResponse.json({ error: "LiveKit is not configured" }, { status: 503 });
  }

  const body = await request.text();
  const receiver = new WebhookReceiver(
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!
  );

  try {
    const event = await receiver.receive(body, request.headers.get("authorization") ?? "");
    if (event.event === "egress_ended" && event.egressInfo) {
      await saveCompletedEgress(event.egressInfo);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("LiveKit webhook:", error);
    return NextResponse.json({ error: "Invalid webhook" }, { status: 401 });
  }
}
