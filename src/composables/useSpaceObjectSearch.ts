/* Imports ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

import Fuse from 'fuse.js';
import { readonly, type Ref, shallowRef, watch } from 'vue';
import { z } from 'zod';

import { useNotify } from '@/composables/useNotify.js';
import { useSpaceObjectCache } from '@/composables/useSpaceObjectCache.js';
import type { SpaceObject } from '@/utilities/application';

/* Constants //////////////////////////////////////////////////////////////////////////////////////////////////////// */

const searchDebounceDelay = 250; // 250ms

/* Requests ///////////////////////////////////////////////////////////////////////////////////////////////////////// */

const inflightRequests = new Map<string, Promise<SpaceObject[]>>();

const getInflightRequest = (normalizedQuery: string) => inflightRequests.get(normalizedQuery);

const setInflightRequest = (normalizedQuery: string, request: Promise<SpaceObject[]>) => {
  inflightRequests.set(normalizedQuery, request);
};

const clearInflightRequest = (normalizedQuery: string) => {
  inflightRequests.delete(normalizedQuery);
};

/* Fetch //////////////////////////////////////////////////////////////////////////////////////////////////////////// */

const CelestrakEntrySchema = z.looseObject({
  OBJECT_NAME: z.string(),
  NORAD_CAT_ID: z.coerce.number(),
  TLE_LINE1: z.string().nullable().optional(),
  TLE_LINE2: z.string().nullable().optional(),
  OBJECT_ID: z.string().nullable().optional(),
  EPOCH: z.string().nullable().optional(),
  MEAN_MOTION: z.coerce.number().nullable().optional(),
  INCLINATION: z.coerce.number().nullable().optional(),
  ECCENTRICITY: z.coerce.number().nullable().optional(),
  ARG_OF_PERICENTER: z.coerce.number().nullable().optional(),
  RA_OF_ASC_NODE: z.coerce.number().nullable().optional(),
  MEAN_ANOMALY: z.coerce.number().nullable().optional(),
  CLASSIFICATION_TYPE: z.string().nullable().optional(),
  REV_AT_EPOCH: z.coerce.number().nullable().optional(),
  BSTAR: z.coerce.number().nullable().optional(),
});

const CelestrakResponseSchema = z
  .union([z.array(CelestrakEntrySchema), CelestrakEntrySchema])
  .transform((value) => (Array.isArray(value) ? value : [value]));

type CelestrakEntry = z.infer<typeof CelestrakEntrySchema>;

const mapCelestrakResult = (entry: CelestrakEntry): SpaceObject => {
  const name = entry.OBJECT_NAME;
  const noradId = entry.NORAD_CAT_ID;
  const tleLine1 = entry.TLE_LINE1;
  const tleLine2 = entry.TLE_LINE2;

  const tleLines = [tleLine1, tleLine2].filter((line) => typeof line === 'string') as string[];

  return {
    name,
    noradId,
    tle: tleLines.join('\n'),
    info: {
      objectId: entry.OBJECT_ID ?? null,
      epoch: entry.EPOCH ?? null,
      meanMotion: entry.MEAN_MOTION ?? null,
      inclination: entry.INCLINATION ?? null,
      eccentricity: entry.ECCENTRICITY ?? null,
      argumentOfPerigee: entry.ARG_OF_PERICENTER ?? null,
      rightAscension: entry.RA_OF_ASC_NODE ?? null,
      meanAnomaly: entry.MEAN_ANOMALY ?? null,
      classification: entry.CLASSIFICATION_TYPE ?? null,
      revAtEpoch: entry.REV_AT_EPOCH ?? null,
      bStar: entry.BSTAR ?? null,
      source: 'celestrak',
    },
  };
};

const fetchCelestrakObjects = async (query: string) => {
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
    const data = JSON.parse(rawBody);
    const parsedData = CelestrakResponseSchema.parse(data);
    return parsedData.map((entry) => mapCelestrakResult(entry));
  } catch (error) {
    throw new Error(`Failed to parse API response for "${query}": ${error}`);
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

  const { getResultsCacheKey, purgeExpiredCacheResults, getCachedResults, setCachedResults } = useSpaceObjectCache();

  const results = shallowRef<SpaceObject[]>([]);
  const isLoading = shallowRef(false);

  let requestCounter = 0;
  let requestDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  const searchObjects = async (query: string) => {
    const cacheKey = getResultsCacheKey(query);
    if (!cacheKey) {
      return [];
    }

    purgeExpiredCacheResults();

    const cachedResults = getCachedResults(cacheKey);
    if (cachedResults) {
      return cachedResults;
    }

    const inflightRequest = getInflightRequest(cacheKey);
    if (inflightRequest) {
      return inflightRequest;
    }

    const makeRequest = async () => {
      try {
        const fetchedResults = await fetchCelestrakObjects(query);
        const sortedResults = sortResults(fetchedResults, query);
        setCachedResults(cacheKey, sortedResults);
        return sortedResults;
      } catch (error) {
        console.error(error);
        notify('error', 'Failed to search objects.');
        return [];
      }
    };

    const request = makeRequest();

    setInflightRequest(cacheKey, request);

    try {
      return await request;
    } finally {
      clearInflightRequest(cacheKey);
    }
  };

  watch(
    () => searchText.value,
    async (newSearchText) => {
      if (requestDebounceTimer) {
        clearTimeout(requestDebounceTimer);
      }

      requestCounter += 1;
      const currentRequestId = requestCounter;

      requestDebounceTimer = setTimeout(async () => {
        isLoading.value = true;
        const newResults = await searchObjects(newSearchText);
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
