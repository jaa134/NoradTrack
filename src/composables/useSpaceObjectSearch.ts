/* Imports ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

import Fuse from 'fuse.js';
import { readonly, type Ref, shallowRef, watch } from 'vue';
import { z } from 'zod';

import type { SpaceObject } from '@/utilities/application.js';

import { useNotify } from '@/composables/useNotify.js';
import { useSpaceObjectCache } from '@/composables/useSpaceObjectCache.js';

/* Constants //////////////////////////////////////////////////////////////////////////////////////////////////////// */

const searchDebounceDelay = 250; // 250ms

/* Utilities //////////////////////////////////////////////////////////////////////////////////////////////////////// */

const getCacheKey = (query: string) => query.trim().toLowerCase();

/* Request tracking ///////////////////////////////////////////////////////////////////////////////////////////////// */

const inflightRequestCache = new Map<string, Promise<SpaceObject[]>>();

const getInflightRequest = (cacheKey: string) => inflightRequestCache.get(cacheKey);

const setInflightRequest = (cacheKey: string, request: Promise<SpaceObject[]>) => {
  inflightRequestCache.set(cacheKey, request);
};

const clearInflightRequest = (cacheKey: string) => {
  inflightRequestCache.delete(cacheKey);
};

/* Fetch //////////////////////////////////////////////////////////////////////////////////////////////////////////// */

const OrbitMeanElementsMessageV3Schema = z.object({
  OBJECT_NAME: z.string(),
  OBJECT_ID: z.string(),
  EPOCH: z.string(),
  MEAN_MOTION: z.number(),
  ECCENTRICITY: z.number(),
  INCLINATION: z.number(),
  RA_OF_ASC_NODE: z.number(),
  ARG_OF_PERICENTER: z.number(),
  MEAN_ANOMALY: z.number(),
  EPHEMERIS_TYPE: z.literal(0),
  CLASSIFICATION_TYPE: z.enum(['U', 'C']),
  NORAD_CAT_ID: z.number(),
  ELEMENT_SET_NO: z.number(),
  REV_AT_EPOCH: z.number(),
  BSTAR: z.number(),
  MEAN_MOTION_DOT: z.number(),
  MEAN_MOTION_DDOT: z.number(),
});

type OrbitMeanElementsMessageV3 = z.infer<typeof OrbitMeanElementsMessageV3Schema>;

const CelestrakResponseSchema = z.array(OrbitMeanElementsMessageV3Schema);

const mapCelestrakResult = (omm: OrbitMeanElementsMessageV3): SpaceObject => {
  return {
    name: omm.OBJECT_NAME,
    noradId: omm.NORAD_CAT_ID,
    objectId: omm.OBJECT_ID,
    classification: omm.CLASSIFICATION_TYPE,
    meanMotion: omm.MEAN_MOTION,
    omm,
  };
};

const fetchCelestrakSpaceObjects = async (query: string): Promise<SpaceObject[]> => {
  const normalizedQuery = query.trim();
  const isNumericQuery = /^[0-9]+$/.test(normalizedQuery);
  const searchParam = isNumericQuery ? `CATNR=${normalizedQuery}` : `NAME=${encodeURIComponent(normalizedQuery)}`;
  const url = `https://celestrak.org/NORAD/elements/gp.php?${searchParam}&FORMAT=JSON`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API response not OK for "${query}": ${response.statusText}`);
  }

  const rawBody = await response.text();
  if (rawBody === 'No GP data found') {
    return [];
  }

  try {
    const data = JSON.parse(rawBody) as unknown;
    const parsedData = CelestrakResponseSchema.parse(data);
    return parsedData.map((entry) => mapCelestrakResult(entry));
  } catch (error) {
    throw new Error(`Failed to parse API response for "${query}": ${JSON.stringify(error, null, 2)}`, {
      cause: error,
    });
  }
};

/* Sort ///////////////////////////////////////////////////////////////////////////////////////////////////////////// */

const sortResults = (results: SpaceObject[], query: string) => {
  const fuse = new Fuse(results, {
    keys: ['name', 'noradId'],
    threshold: 1,
  });
  return fuse.search(query).map((entry) => entry.item);
};

/* Compose ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

export const useSpaceObjectSearch = (searchText: Ref<string>) => {
  const { notify } = useNotify();

  const { getCachedSearchResults, setCachedSearchResults } = useSpaceObjectCache();

  const results = shallowRef<SpaceObject[]>([]);
  const isLoading = shallowRef(false);

  let requestCounter = 0;
  let requestDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  const search = async (query: string) => {
    const cacheKey = getCacheKey(query);
    if (!cacheKey) {
      return [];
    }

    const cachedSearchResults = getCachedSearchResults(cacheKey);
    if (cachedSearchResults) {
      return cachedSearchResults;
    }

    const inflightRequest = getInflightRequest(cacheKey);
    if (inflightRequest) {
      return inflightRequest;
    }

    const makeRequest = async () => {
      try {
        const fetchedResults = await fetchCelestrakSpaceObjects(query);
        const sortedResults = sortResults(fetchedResults, query);
        setCachedSearchResults(cacheKey, sortedResults);
        return sortedResults;
      } catch (error) {
        console.error(error);
        notify('error', 'Failed to search objects.');
        return [];
      }
    };

    const request = makeRequest();
    setInflightRequest(cacheKey, request);
    const result = await request;
    clearInflightRequest(cacheKey);
    return result;
  };

  watch(
    () => searchText.value,
    (newSearchText) => {
      if (requestDebounceTimer) {
        clearTimeout(requestDebounceTimer);
      }

      requestCounter += 1;
      const currentRequestId = requestCounter;

      requestDebounceTimer = setTimeout(async () => {
        isLoading.value = true;
        const newResults = await search(newSearchText);
        if (requestCounter === currentRequestId) {
          results.value = newResults;
          isLoading.value = false;
        }
      }, searchDebounceDelay);
    },
    {
      immediate: true,
    },
  );

  return {
    results: readonly(results),
    isLoading: readonly(isLoading),
  };
};
