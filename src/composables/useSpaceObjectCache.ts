/* Imports ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

import type { SpaceObject } from '@/utilities/application.js';

/* Cache //////////////////////////////////////////////////////////////////////////////////////////////////////////// */

const seachResultCache = new Map<string, SpaceObject[]>();

const lookupCache = new Map<number, SpaceObject>();

/* Utilities //////////////////////////////////////////////////////////////////////////////////////////////////////// */

const getCachedSearchResults = (key: string) => {
  return seachResultCache.get(key) ?? null;
};

const setCachedSearchResults = (key: string, results: SpaceObject[]) => {
  seachResultCache.set(key, results);

  for (const result of results) {
    lookupCache.set(result.noradId, result);
  }
};

const lookupCachedSpaceObject = (noradId: number) => {
  return lookupCache.get(noradId) ?? null;
};

/* Compose ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

export const useSpaceObjectCache = () => ({
  getCachedSearchResults,
  setCachedSearchResults,
  lookupCachedSpaceObject,
});
