import { NextResponse } from "next/server";
import { getPublicPlatformStatus } from "@/lib/platform-settings";

export async function GET() {
  try {
    const status = await getPublicPlatformStatus();
    return NextResponse.json(status);
  } catch {
    return NextResponse.json({
      maintenanceMode: false,
      maintenanceMessage: "",
      allowStudentSignup: true,
      allowTutorSignup: true,
      supportEmail: "",
    });
  }
}
