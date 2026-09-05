// Process-local cache for public data only. No sessions, scores or coordinates.
export function createPublicCatalogCache({ ttlMs = 120000, maxEntries = 128, maxBytes = 16 * 1024 * 1024, maxEntryBytes = 512 * 1024, now = Date.now } = {}) {
  const entries = new Map();
  const pending = new Map();
  let bytes = 0;
  const remove = key => { const entry = entries.get(key); if (entry) bytes -= entry.bytes; entries.delete(key); };
  return {
    async get(key, loader) {
      const entry = entries.get(key);
      if (entry && entry.expiresAt > now()) {
        entries.delete(key); entries.set(key, entry);
        return structuredClone(entry.value);
      }
      remove(key);
      if (pending.has(key)) return structuredClone(await pending.get(key));
      const request = Promise.resolve().then(loader);
      // Bound in-flight bookkeeping too; rate limiting still protects uncached requests.
      if (pending.size < maxEntries) pending.set(key, request);
      try {
        const value = await request;
        const size = Buffer.byteLength(JSON.stringify(value));
        if (size <= maxEntryBytes && size <= maxBytes) {
          for (const [oldKey, oldEntry] of entries) if (oldEntry.expiresAt <= now()) remove(oldKey);
          while (entries.size >= maxEntries || bytes + size > maxBytes) remove(entries.keys().next().value);
          entries.set(key, { value: structuredClone(value), bytes: size, expiresAt: now() + ttlMs });
          bytes += size;
        }
        return value;
      } finally { if (pending.get(key) === request) pending.delete(key); }
    },
    clear() { entries.clear(); bytes = 0; }
  };
}

const cacheable = new Set(['listInstitutions', 'listCourses', 'searchCatalog', 'searchCatalogMap', 'findInstitution', 'listInstitutionCourses', 'sitemapRecordCount', 'sitemapCoreData']);
export function publicCatalogCacheKey(name, args) {
  if (!cacheable.has(name)) return null;
  if (args.some(arg => arg && typeof arg === 'object' && (arg.lat !== undefined || arg.lng !== undefined))) return null;
  return JSON.stringify([name, args], (_, value) => value && typeof value === 'object' && !Array.isArray(value)
    ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b))) : value);
}
