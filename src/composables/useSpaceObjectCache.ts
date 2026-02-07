/* Imports ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

import type { SpaceObject, SpaceObjectTle } from '@/utilities/application';

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

const lookupCachedSpaceObjects = (noradIds: number[]) => {
  return noradIds
    .map((noradId) => lookupCache.get(noradId))
    .filter((spaceObject): spaceObject is SpaceObject => !!spaceObject);
};

const getCachedSpaceObjectTle = (noradId: number) => {
  return tleCache.get(noradId);
};

const setCachedSpaceObjectTle = (noradId: number, tle: SpaceObjectTle) => {
  tleCache.set(noradId, tle);
};

/* Compose ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

export const useSpaceObjectCache = () => ({
  getCachedSearchResults,
  setCachedSearchResults,
  lookupCachedSpaceObjects,
  getCachedSpaceObjectTle,
  setCachedSpaceObjectTle,
});
