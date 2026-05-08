const store = new Map<string, number[]>();

const WINDOW_MS = 60_000;

const LIMITS: Record<string, number> = {
  "/api/search/google": 10,
  "/api/search/reddit": 10,
  "/api/generate-reply": 5,
  "/api/backlinks/check": 10,
};

export function rateLimit(req: Request, route: string): { allowed: boolean } {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const max = LIMITS[route] ?? 20;
  const key = `${ip}:${route}`;
  const now = Date.now();
  const timestamps = (store.get(key) ?? []).filter((t) => now - t < WINDOW_MS);

  if (timestamps.length >= max) {
    store.set(key, timestamps);
    return { allowed: false };
  }

  timestamps.push(now);
  store.set(key, timestamps);
  return { allowed: true };
}
