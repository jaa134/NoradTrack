/* Imports ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

import Fuse from 'fuse.js';
import { readonly, type Ref, shallowRef, watch } from 'vue';

import { type SpaceObject } from '@/utilities/application.js';
import { CelestrakResponseSchema, type OrbitMeanElementsMessageV3 } from '@/utilities/search.js';

import { useSearchStore } from '@/stores/variants/search.js';

import { useNotify } from '@/composables/useNotify.js';

/* Constants //////////////////////////////////////////////////////////////////////////////////////////////////////// */

const cacheExpirationThreshold = 1000 * 60 * 60 * 24; // 24 hours

const searchDebounceDelay = 250; // 250ms

/* Request tracking ///////////////////////////////////////////////////////////////////////////////////////////////// */

let inflightRequest: Promise<OrbitMeanElementsMessageV3[]> | null = null;

/* Fetch //////////////////////////////////////////////////////////////////////////////////////////////////////////// */

const fetchCelestrakApiData = async (): Promise<OrbitMeanElementsMessageV3[]> => {
  const response = await fetch('https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=json');
  if (!response.ok) {
    throw new Error('Celestrak API response not OK.', { cause: response });
  }

  const rawBody = await response.text();
  if (rawBody === 'No GP data found') {
    return [];
  }

  try {
    const data = JSON.parse(rawBody) as unknown;
    return CelestrakResponseSchema.parse(data);
  } catch (error) {
    throw new Error('Failed to parse Celestrak API response.', { cause: error });
  }
};

/* Filter /////////////////////////////////////////////////////////////////////////////////////////////////////////// */

const filterSpaceObjects = (spaceObjects: SpaceObject[], query: string) => {
  const fuse = new Fuse(spaceObjects, {
    keys: [
      { name: 'name', weight: 1 },
      { name: 'noradId', weight: 0.75 },
      { name: 'objectId', weight: 0.5 },
    ],
    threshold: 0.25,
    includeScore: true,
  });

  const matches = fuse.search(query);

  matches.sort((a, b) => {
    const scoreDiff = (a.score ?? 0) - (b.score ?? 0);
    return scoreDiff !== 0 ? scoreDiff : a.item.name.localeCompare(b.item.name, undefined, { numeric: true });
  });

  return matches.map((entry) => entry.item);
};

/* Compose ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

export const useSpaceObjectSearch = (searchText: Ref<string>) => {
  const { notify } = useNotify();

  const { apiData: cachedApiData, spaceObjects, setCachedApiData } = useSearchStore();

  const results = shallowRef<SpaceObject[]>([]);
  const isLoading = shallowRef(false);
  const isActive = shallowRef(false);

  let requestDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  const search = async (query: string) => {
    isLoading.value = true;

    try {
      let apiData: OrbitMeanElementsMessageV3[];

      if (cachedApiData.value && Date.now() < cachedApiData.value.expirationTimestamp) {
        apiData = cachedApiData.value.data;
      } else {
        inflightRequest ??= fetchCelestrakApiData().finally(() => {
          inflightRequest = null;
        });

        apiData = await inflightRequest;
        setCachedApiData({
          expirationTimestamp: Date.now() + cacheExpirationThreshold,
          data: apiData,
        });
      }

      results.value = filterSpaceObjects(spaceObjects.value ?? [], query);
    } catch (error) {
      console.error(error);
      notify('error', 'Failed to fetch space objects.');
      results.value = [];
    } finally {
      isLoading.value = false;
      isActive.value = true;
    }
  };

  watch(
    () => searchText.value,
    (newSearchText) => {
      if (requestDebounceTimer) {
        clearTimeout(requestDebounceTimer);
        requestDebounceTimer = null;
      }

      if (!newSearchText.trim()) {
        results.value = [];
        isLoading.value = false;
        isActive.value = false;
        return;
      }

      requestDebounceTimer = setTimeout(() => {
        void search(newSearchText);
      }, searchDebounceDelay);
    },
    {
      immediate: true,
    },
  );

  return {
    results: readonly(results),
    isLoading: readonly(isLoading),
    isActive: readonly(isActive),
  };
};
