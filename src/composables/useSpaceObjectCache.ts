/* Imports ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

import type { SpaceObject } from '@/utilities/application';

/* Types //////////////////////////////////////////////////////////////////////////////////////////////////////////// */

interface CachedSpaceObject {
  expiresAt: number;
  results: SpaceObject[];
}

/* Constants //////////////////////////////////////////////////////////////////////////////////////////////////////// */

const cacheTtl = 60 * 60 * 1000; // 1 hour

/* Cache //////////////////////////////////////////////////////////////////////////////////////////////////////////// */

const resultsCache = new Map<string, CachedSpaceObject>();

const lookupCache = new Map<number, SpaceObject>();

/* Utilities //////////////////////////////////////////////////////////////////////////////////////////////////////// */

const getResultsCacheKey = (query: string) => query.trim().toLowerCase();

const purgeExpiredCacheResults = () => {
  const now = Date.now();
  for (const [key, entry] of resultsCache.entries()) {
    if (entry.expiresAt <= now) {
      resultsCache.delete(key);
    }
  }
};

const getCachedResults = (key: string) => {
  const cached = resultsCache.get(key);
  return cached?.results ?? null;
};

const setCachedResults = (key: string, results: SpaceObject[]) => {
  resultsCache.set(key, {
    results,
    expiresAt: Date.now() + cacheTtl,
  });

  for (const result of results) {
    lookupCache.set(result.noradId, result);
  }
};

const lookupSpaceObjects = (noradIds: number[]) => {
  return noradIds
    .map((noradId) => lookupCache.get(noradId))
    .filter((spaceObject): spaceObject is SpaceObject => !!spaceObject);
};

/* Compose ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

export const useSpaceObjectCache = () => ({
  getResultsCacheKey,
  purgeExpiredCacheResults,
  getCachedResults,
  setCachedResults,
  lookupSpaceObjects,
});
