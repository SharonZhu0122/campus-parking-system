// Small in-memory limiter, enough for a single backend instance.
function createLimiter(limit, windowMs) {
  const hits = new Map();

  return {
    allow(key, now = Date.now()) {
      const recent = (hits.get(key) || []).filter((t) => now - t < windowMs);
      if (recent.length >= limit) {
        hits.set(key, recent);
        return false;
      }
      recent.push(now);
      hits.set(key, recent);
      return true;
    },
    // For counting only the attempts that failed: ask first, record after.
    blocked(key, now = Date.now()) {
      const recent = (hits.get(key) || []).filter((t) => now - t < windowMs);
      hits.set(key, recent);
      return recent.length >= limit;
    },
    record(key, now = Date.now()) {
      hits.set(key, [...(hits.get(key) || []), now]);
    },
    clear() {
      hits.clear();
    },
  };
}

module.exports = { createLimiter };
