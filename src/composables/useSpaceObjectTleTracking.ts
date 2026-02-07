/* Imports ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

import { type Ref, watch } from 'vue';
import { z } from 'zod';

import { useNotify } from '@/composables/useNotify.js';
import { useSpaceObjectCache } from '@/composables/useSpaceObjectCache.js';
import type { SpaceObjectTle } from '@/utilities/application.js';

/* Request tracking ///////////////////////////////////////////////////////////////////////////////////////////////// */

const inflightRequestCache = new Map<number, Promise<SpaceObjectTle | null>>();

const getInflightRequest = (noradId: number) => inflightRequestCache.get(noradId);

const setInflightRequest = (noradId: number, request: Promise<SpaceObjectTle | null>) => {
  inflightRequestCache.set(noradId, request);
};

const clearInflightRequest = (noradId: number) => {
  inflightRequestCache.delete(noradId);
};

/* Fetch //////////////////////////////////////////////////////////////////////////////////////////////////////////// */

const TleSchema = z.tuple([z.string().min(1), z.string().min(1), z.string().min(1)]);

const fetchCelestrakSpaceObjectTle = async (noradId: number): Promise<SpaceObjectTle> => {
  const url = `https://celestrak.org/NORAD/elements/gp.php?CATNR=${noradId}&FORMAT=TLE`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API response not OK for "${noradId}": ${response.statusText}`);
  }

  const rawBody = await response.text();
  if (rawBody === 'No GP data found') {
    throw new Error(`No TLE data found for "${noradId}"`);
  }

  try {
    const lines = rawBody
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const [_name, line1, line2] = TleSchema.parse(lines);

    return {
      noradId,
      line1,
      line2,
    };
  } catch (error) {
    throw new Error(`Failed to parse API response for "${noradId}": ${error}`);
  }
};

/* Compose ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

export const useSpaceObjectTleTracking = (noradIds: Ref<number[]>) => {
  const { notify } = useNotify();

  const { getCachedSpaceObjectTle, setCachedSpaceObjectTle } = useSpaceObjectCache();

  const track = async (noradId: number) => {
    const cachedTle = getCachedSpaceObjectTle(noradId);
    if (cachedTle) {
      return cachedTle;
    }

    const inflightRequest = getInflightRequest(noradId);
    if (inflightRequest) {
      return inflightRequest;
    }

    const makeRequest = async () => {
      try {
        const fetchedTle = await fetchCelestrakSpaceObjectTle(noradId);
        setCachedSpaceObjectTle(noradId, fetchedTle);
        return fetchedTle;
      } catch (error) {
        console.error(error);
        notify('error', 'Failed to load TLE data.');
        return null;
      }
    };

    const request = makeRequest();
    setInflightRequest(noradId, request);
    await request;
    clearInflightRequest(noradId);
  };

  watch(
    () => noradIds.value,
    (newNoradIds) => {
      newNoradIds.forEach((noradId) => {
        track(noradId);
      });
    },
    {
      immediate: true,
    },
  );
};
