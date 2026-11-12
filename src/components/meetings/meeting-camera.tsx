import { Video } from "lucide-react";
import { cn } from "@/lib/utils";

export function MeetingCamera({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,#19b7f5_0%,#0066cc_52%,#004f9a_100%)] text-white shadow-[0_12px_24px_-14px_rgba(0,102,204,0.8)]",
        className
      )}
    >
      <Video className="h-6 w-6" strokeWidth={1.75} />
    </div>
  );
}
