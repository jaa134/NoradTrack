/* Imports ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

import type { SpaceObject, SpaceObjectTle } from '@/utilities/application.js';

/* Cache //////////////////////////////////////////////////////////////////////////////////////////////////////////// */

const seachResultCache = new Map<string, SpaceObject[]>();

const lookupCache = new Map<number, SpaceObject>();

const tleCache = new Map<number, SpaceObjectTle>();

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

const getCachedSpaceObjectTle = (noradId: number) => {
  return tleCache.get(noradId) ?? null;
};

const setCachedSpaceObjectTle = (noradId: number, tle: SpaceObjectTle) => {
  tleCache.set(noradId, tle);
};

/* Compose ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

export const useSpaceObjectCache = () => ({
  getCachedSearchResults,
  setCachedSearchResults,
  lookupCachedSpaceObject,
  getCachedSpaceObjectTle,
  setCachedSpaceObjectTle,
});
