const STORAGE_KEY = "zoelive-admin-notifications-read";

export function getReadNotificationIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

export function markNotificationRead(id: string) {
  const read = getReadNotificationIds();
  read.add(id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...read]));
}

export function markNotificationsRead(ids: string[]) {
  const read = getReadNotificationIds();
  for (const id of ids) read.add(id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...read]));
}

export function pruneStaleReadIds(validIds: string[]) {
  const valid = new Set(validIds);
  const read = getReadNotificationIds();
  const pruned = [...read].filter((id) => valid.has(id));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
}
