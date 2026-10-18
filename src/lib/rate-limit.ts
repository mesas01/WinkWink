/**
 * Fixed-window rate limiter kept in memory. On serverless platforms each warm instance keeps
 * its own counters, so this bounds abuse per instance; a shared store (Redis/KV) would make it global.
 */
export interface RateLimitRule {
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

export function createRateLimiter(rule: RateLimitRule, maxKeys = 5_000) {
  const buckets = new Map<string, Bucket>();

  function prune(now: number) {
    if (buckets.size < maxKeys) return;
    for (const [key, b] of buckets) if (b.resetAt <= now) buckets.delete(key);
    if (buckets.size >= maxKeys) buckets.clear();
  }

  return function hit(key: string, now: number = Date.now()): RateLimitResult {
    prune(now);
    const current = buckets.get(key);
    const bucket =
      current && current.resetAt > now ? current : { count: 0, resetAt: now + rule.windowMs };
    if (bucket.count >= rule.limit)
      return { allowed: false, remaining: 0, retryAfterMs: bucket.resetAt - now };
    bucket.count += 1;
    buckets.set(key, bucket);
    return { allowed: true, remaining: rule.limit - bucket.count, retryAfterMs: 0 };
  };
}

/** Constant-time string comparison, so an access code cannot be guessed by timing. */
export function safeEqual(a: string, b: string): boolean {
  const len = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}
