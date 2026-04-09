// Map of token -> expiry timestamp (ms). Entries are pruned after they expire.
const blacklist = new Map();

function addToBlacklist(token, exp) {
  if (!token || typeof exp !== 'number' || !isFinite(exp)) return;
  // exp is a JWT Unix timestamp (seconds); convert to ms for Date comparison
  blacklist.set(token, exp * 1000);
}

function isBlacklisted(token) {
  if (!blacklist.has(token)) return false;
  // Treat expired entries as no longer blacklisted (they can't be used anyway)
  if (Date.now() >= blacklist.get(token)) {
    blacklist.delete(token);
    return false;
  }
  return true;
}

// Periodically remove entries whose JWT has already expired
const PRUNE_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
setInterval(() => {
  const now = Date.now();
  for (const [token, expiresAt] of blacklist) {
    if (now >= expiresAt) blacklist.delete(token);
  }
}, PRUNE_INTERVAL_MS).unref(); // unref so the timer doesn't keep the process alive

module.exports = { addToBlacklist, isBlacklisted };
