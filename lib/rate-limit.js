// Best-effort per-instance abuse guard. Use a durable distributed limiter at scale.
const buckets = new Map();
export function allowRequest(req, limit, windowMs = 60000) {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0] :
    req.socket?.remoteAddress || 'anonymous').trim().slice(0, 100);
  const bucketKey = ip + ':' + limit + ':' + windowMs;
  const now = Date.now();
  const bucket = buckets.get(bucketKey);
  if (bucket && now < bucket.until) {
    if (bucket.count >= limit) return false;
    bucket.count++;
  } else {
    buckets.set(bucketKey, {count:1,until:now+windowMs});
  }
  if (buckets.size > 10000) {
    for (const [key,value] of buckets) if (value.until <= now) buckets.delete(key);
  }
  return true;
}
