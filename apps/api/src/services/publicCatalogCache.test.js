import { describe, expect, it, vi } from 'vitest';
import { createPublicCatalogCache, publicCatalogCacheKey } from './publicCatalogCache.js';

describe('public catalog cache', () => {
  it('coalesces identical requests and protects cached values from mutation', async () => {
    const cache = createPublicCatalogCache();
    const load = vi.fn(async () => [{ id: '9007199254740993' }]);
    const [first, second] = await Promise.all([cache.get('a', load), cache.get('a', load)]);
    first[0].id = 'changed';
    expect(second[0].id).toBe('9007199254740993');
    expect((await cache.get('a', load))[0].id).toBe('9007199254740993');
    expect(load).toHaveBeenCalledTimes(1);
  });
  it('expires, evicts least used entries and does not cache errors', async () => {
    let time = 0;
    const cache = createPublicCatalogCache({ ttlMs: 10, maxEntries: 1, now: () => time });
    const load = vi.fn(async () => ['ok']);
    await cache.get('a', load); time = 11; await cache.get('a', load);
    await cache.get('b', load); await cache.get('a', load);
    expect(load).toHaveBeenCalledTimes(4);
    await expect(cache.get('error', () => Promise.reject(Error('offline')))).rejects.toThrow('offline');
    expect(await cache.get('error', load)).toEqual(['ok']);
  });
  it('limits payload size and never caches precise location or private scenarios', async () => {
    const cache = createPublicCatalogCache({ maxEntryBytes: 10 });
    const load = vi.fn(async () => 'long payload cannot fit');
    await cache.get('a', load); await cache.get('a', load);
    expect(load).toHaveBeenCalledTimes(2);
    expect(publicCatalogCacheKey('searchCatalog', [{ lat: 0, lng: 0 }])).toBeNull();
    expect(publicCatalogCacheKey('listCutoffs', [{ score: 700 }])).toBeNull();
    expect(publicCatalogCacheKey('listCourses', [{ q: 'Medicina', page: 1 }])).toBe(publicCatalogCacheKey('listCourses', [{ page: 1, q: 'Medicina' }]));
  });
});
