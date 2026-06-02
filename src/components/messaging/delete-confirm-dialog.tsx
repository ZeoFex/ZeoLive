"use client";

import { AlertTriangle, Loader2, Mail, MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type DeleteMessageTarget = {
  type: "message";
  messageId: string;
  senderName: string;
  bodyPreview: string;
};

export type DeleteConversationTarget = {
  type: "conversation";
  conversationId: string;
  studentName: string;
  studentEmail: string;
  tutorName: string;
  tutorEmail: string;
  messageCount: number;
};

export type DeleteConfirmTarget = DeleteMessageTarget | DeleteConversationTarget;

interface DeleteConfirmDialogProps {
  target: DeleteConfirmTarget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}

export function DeleteConfirmDialog({
  target,
  open,
  onOpenChange,
  onConfirm,
  loading,
}: DeleteConfirmDialogProps) {
  const isConversation = target?.type === "conversation";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-w-md gap-0 overflow-hidden p-0",
          isConversation && "border-red-200"
        )}
        onPointerDownOutside={(e) => loading && e.preventDefault()}
      >
        <div
          className={cn(
            "px-6 pb-2 pt-6",
            isConversation ? "bg-gradient-to-b from-red-50 to-white" : "bg-gradient-to-b from-amber-50 to-white"
          )}
        >
          <div
            className={cn(
              "mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full",
              isConversation ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"
            )}
          >
            {isConversation ? (
              <Trash2 className="h-7 w-7" />
            ) : (
              <MessageSquare className="h-7 w-7" />
            )}
          </div>
          <DialogHeader className="space-y-2 text-center sm:text-center">
            <DialogTitle className="text-xl">
              {isConversation ? "Delete entire conversation?" : "Delete this message?"}
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 text-sm text-slate-600">
                {target?.type === "message" && (
                  <>
                    <p>
                      This will permanently remove one message from{" "}
                      <span className="font-medium text-slate-900">{target.senderName}</span>.
                      It will no longer appear in exports or transcripts.
                    </p>
                    <blockquote className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-slate-800">
                      <p className="line-clamp-3 whitespace-pre-wrap text-sm">
                        {target.bodyPreview}
                      </p>
                    </blockquote>
                  </>
                )}
                {target?.type === "conversation" && (
                  <>
                    <p>
                      All <strong>{target.messageCount}</strong> messages between these
                      accounts will be permanently deleted, including classroom chat
                      stored for review.
                    </p>
                    <div className="space-y-2 rounded-xl border border-red-100 bg-white p-3 text-left">
                      <div className="flex items-start gap-2 text-xs">
                        <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <div>
                          <p className="font-medium text-slate-900">{target.studentName}</p>
                          <p className="text-slate-500">{target.studentEmail}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-xs">
                        <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <div>
                          <p className="font-medium text-slate-900">{target.tutorName}</p>
                          <p className="text-slate-500">{target.tutorEmail}</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                <p className="flex items-center justify-center gap-1.5 text-xs font-medium text-red-600">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  This action cannot be undone
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t bg-slate-50/80 px-6 py-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            disabled={loading}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="rounded-xl"
            disabled={loading}
            onClick={() => void onConfirm()}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            {isConversation ? "Delete conversation" : "Delete message"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
