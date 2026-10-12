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
    clear() {
      hits.clear();
    },
  };
}

module.exports = { createLimiter };
