import type { MessageChannel, Role } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { displayUserName } from "@/lib/portal-data";

export type ConversationParticipant = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type ConversationSummary = {
  id: string;
  student: ConversationParticipant;
  tutor: ConversationParticipant;
  lastMessage: string | null;
  lastMessageAt: string | null;
  messageCount: number;
  updatedAt: string;
};

export type StoredMessageDto = {
  id: string;
  body: string;
  channel: MessageChannel;
  senderId: string;
  senderName: string;
  senderRole: Role;
  tutoringSessionId: string | null;
  roomId: string | null;
  sessionTitle: string | null;
  createdAt: string;
};

function toParticipant(user: {
  id: string;
  email: string;
  role: Role;
  firstName: string | null;
  lastName: string | null;
  name: string | null;
}): ConversationParticipant {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    name: displayUserName(user),
  };
}

export async function pairHasTutoringRelationship(
  studentId: string,
  tutorId: string
) {
  const count = await prisma.tutoringSession.count({
    where: { studentId, tutorId },
  });
  return count > 0;
}

export async function getOrCreateConversation(studentId: string, tutorId: string) {
  const existing = await prisma.tutorStudentConversation.findUnique({
    where: { studentId_tutorId: { studentId, tutorId } },
  });
  if (existing) return existing;

  return prisma.tutorStudentConversation.create({
    data: { studentId, tutorId },
  });
}

export async function storeMessage(input: {
  studentId: string;
  tutorId: string;
  senderId: string;
  body: string;
  channel: MessageChannel;
  tutoringSessionId?: string | null;
  clientMessageId?: string | null;
}) {
  const trimmed = input.body.trim();
  if (!trimmed) {
    throw new Error("Message cannot be empty");
  }

  const allowed = await pairHasTutoringRelationship(input.studentId, input.tutorId);
  if (!allowed) {
    throw new Error("No tutoring relationship between these users");
  }

  const conversation = await getOrCreateConversation(input.studentId, input.tutorId);

  if (input.clientMessageId) {
    const dup = await prisma.storedMessage.findUnique({
      where: {
        conversationId_clientMessageId: {
          conversationId: conversation.id,
          clientMessageId: input.clientMessageId,
        },
      },
    });
    if (dup) return dup;
  }

  const message = await prisma.storedMessage.create({
    data: {
      conversationId: conversation.id,
      senderId: input.senderId,
      body: trimmed,
      channel: input.channel,
      tutoringSessionId: input.tutoringSessionId ?? null,
      clientMessageId: input.clientMessageId ?? null,
    },
  });

  await prisma.tutorStudentConversation.update({
    where: { id: conversation.id },
    data: { updatedAt: new Date() },
  });

  return message;
}

export async function listConversationsForUser(userId: string, role: Role) {
  const where =
    role === "STUDENT"
      ? { studentId: userId }
      : role === "TUTOR"
        ? { tutorId: userId }
        : {};

  const rows = await prisma.tutorStudentConversation.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      student: {
        select: {
          id: true,
          email: true,
          role: true,
          firstName: true,
          lastName: true,
          name: true,
        },
      },
      tutor: {
        select: {
          id: true,
          email: true,
          role: true,
          firstName: true,
          lastName: true,
          name: true,
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { body: true, createdAt: true },
      },
      _count: { select: { messages: true } },
    },
  });

  return rows.map((row): ConversationSummary => {
    const last = row.messages[0];
    return {
      id: row.id,
      student: toParticipant(row.student),
      tutor: toParticipant(row.tutor),
      lastMessage: last?.body ?? null,
      lastMessageAt: last?.createdAt.toISOString() ?? null,
      messageCount: row._count.messages,
      updatedAt: row.updatedAt.toISOString(),
    };
  });
}

export async function listAllConversationsForAdmin(search?: string) {
  const rows = await prisma.tutorStudentConversation.findMany({
    where: search
      ? {
          OR: [
            {
              student: {
                OR: [
                  { email: { contains: search, mode: "insensitive" } },
                  { firstName: { contains: search, mode: "insensitive" } },
                  { lastName: { contains: search, mode: "insensitive" } },
                  { name: { contains: search, mode: "insensitive" } },
                ],
              },
            },
            {
              tutor: {
                OR: [
                  { email: { contains: search, mode: "insensitive" } },
                  { firstName: { contains: search, mode: "insensitive" } },
                  { lastName: { contains: search, mode: "insensitive" } },
                  { name: { contains: search, mode: "insensitive" } },
                ],
              },
            },
          ],
        }
      : undefined,
    orderBy: { updatedAt: "desc" },
    include: {
      student: {
        select: {
          id: true,
          email: true,
          role: true,
          firstName: true,
          lastName: true,
          name: true,
        },
      },
      tutor: {
        select: {
          id: true,
          email: true,
          role: true,
          firstName: true,
          lastName: true,
          name: true,
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { body: true, createdAt: true },
      },
      _count: { select: { messages: true } },
    },
  });

  return rows.map((row): ConversationSummary => {
    const last = row.messages[0];
    return {
      id: row.id,
      student: toParticipant(row.student),
      tutor: toParticipant(row.tutor),
      lastMessage: last?.body ?? null,
      lastMessageAt: last?.createdAt.toISOString() ?? null,
      messageCount: row._count.messages,
      updatedAt: row.updatedAt.toISOString(),
    };
  });
}

export async function getConversationForUser(
  conversationId: string,
  userId: string,
  role: Role
) {
  const conversation = await prisma.tutorStudentConversation.findUnique({
    where: { id: conversationId },
    include: {
      student: {
        select: {
          id: true,
          email: true,
          role: true,
          firstName: true,
          lastName: true,
          name: true,
        },
      },
      tutor: {
        select: {
          id: true,
          email: true,
          role: true,
          firstName: true,
          lastName: true,
          name: true,
        },
      },
    },
  });

  if (!conversation) return null;

  if (role === "STUDENT" && conversation.studentId !== userId) return null;
  if (role === "TUTOR" && conversation.tutorId !== userId) return null;

  return conversation;
}

export async function listMessagesForConversation(conversationId: string) {
  const messages = await prisma.storedMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    include: {
      sender: {
        select: {
          id: true,
          role: true,
          email: true,
          firstName: true,
          lastName: true,
          name: true,
        },
      },
      tutoringSession: {
        select: { id: true, roomId: true, title: true },
      },
    },
  });

  return messages.map(
    (m): StoredMessageDto => ({
      id: m.id,
      body: m.body,
      channel: m.channel,
      senderId: m.senderId,
      senderName: displayUserName(m.sender),
      senderRole: m.sender.role,
      tutoringSessionId: m.tutoringSessionId,
      roomId: m.tutoringSession?.roomId ?? null,
      sessionTitle: m.tutoringSession?.title ?? null,
      createdAt: m.createdAt.toISOString(),
    })
  );
}

export async function getConversationByIdForAdmin(conversationId: string) {
  return prisma.tutorStudentConversation.findUnique({
    where: { id: conversationId },
    include: {
      student: {
        select: {
          id: true,
          email: true,
          role: true,
          firstName: true,
          lastName: true,
          name: true,
        },
      },
      tutor: {
        select: {
          id: true,
          email: true,
          role: true,
          firstName: true,
          lastName: true,
          name: true,
        },
      },
    },
  });
}
