import type { ConversationSummary, StoredMessageDto } from "@/lib/messaging";

export function buildTranscriptText(
  conversation: ConversationSummary,
  messages: StoredMessageDto[]
) {
  const header = [
    "Zeolive — Conversation transcript (evidence export)",
    `Exported at: ${new Date().toISOString()}`,
    `Conversation ID: ${conversation.id}`,
    `Student: ${conversation.student.name} <${conversation.student.email}>`,
    `Tutor: ${conversation.tutor.name} <${conversation.tutor.email}>`,
    `Message count: ${messages.length}`,
    "",
    "---",
    "",
  ].join("\n");

  const body = messages
    .map((m) => {
      const when = new Date(m.createdAt).toISOString();
      const ctx =
        m.channel === "CLASSROOM"
          ? ` [classroom${m.roomId ? ` · ${m.roomId}` : ""}]`
          : " [direct]";
      return `[${when}] ${m.senderName} (${m.senderRole})${ctx}\n${m.body}`;
    })
    .join("\n\n");

  return `${header}${body}\n`;
}

export function buildTranscriptJson(
  conversation: ConversationSummary,
  messages: StoredMessageDto[]
) {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      conversation,
      messages,
    },
    null,
    2
  );
}
