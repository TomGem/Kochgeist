const attempts = new Map<string, { count: number; resetAt: number }>();

/** Returns true if the action should be blocked. */
export function isRateLimited(
  key: string,
  maxAttempts: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || now >= entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count++;
  return entry.count > maxAttempts;
}

export function clearRateLimit(key: string): void {
  attempts.delete(key);
}

// Periodic cleanup of expired entries (every 10 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of attempts) {
    if (now >= entry.resetAt) attempts.delete(key);
  }
}, 10 * 60 * 1000).unref();
