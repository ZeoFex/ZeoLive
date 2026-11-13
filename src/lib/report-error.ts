export function reportError(scope: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[zeolive] ${scope}: ${message}`);
  const webhook = process.env.ERROR_WEBHOOK_URL?.trim();
  if (!webhook) return;
  void fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scope, message, at: new Date().toISOString() }),
  }).catch(() => undefined);
}
