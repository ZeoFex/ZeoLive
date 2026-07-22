import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@/generated/prisma";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and set DATABASE_URL, then restart the dev server."
    );
  }
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

/** Recreate client when schema delegates are missing (stale dev hot-reload cache). */
function getPrismaClient(): PrismaClient {
  const cached = globalForPrisma.prisma;
  if (
    cached?.tutorStudentConversation &&
    cached?.storedMessage &&
    cached?.cmsEntry &&
    cached?.studyMaterial
  ) {
    return cached;
  }
  const client = createPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }
  return client;
}

/**
 * Lazy Prisma access so importing this module does not crash when DATABASE_URL
 * is missing (e.g. homepage CMS fallbacks). First real query still requires env.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrismaClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
