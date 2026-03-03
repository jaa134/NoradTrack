/* Imports ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

import Fuse from 'fuse.js';
import { computed, type Ref, ref, watch } from 'vue';

import { type SpaceObject } from '@/utilities/application.js';
import { CelestrakResponseSchema, type OrbitMeanElementsMessageV3 } from '@/utilities/search.js';

import { useSearchStore } from '@/stores/variants/search.js';

import { useNotify } from '@/composables/useNotify.js';

/* Constants //////////////////////////////////////////////////////////////////////////////////////////////////////// */

const cacheExpirationThreshold = 1000 * 60 * 60 * 24; // 24 hours

const searchDebounceDelay = 250; // 250ms

/* Request tracking ///////////////////////////////////////////////////////////////////////////////////////////////// */

const inflightRequest = ref<Promise<OrbitMeanElementsMessageV3[]> | null>(null);

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
    const parsedData = CelestrakResponseSchema.parse(data);
    return parsedData.sort((a, b) => b.NORAD_CAT_ID - a.NORAD_CAT_ID);
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

  watch(
    searchText,
    async () => {
      if (inflightRequest.value || (cachedApiData.value && Date.now() <= cachedApiData.value.expirationTimestamp)) {
        return;
      }

      try {
        inflightRequest.value ??= fetchCelestrakApiData().finally(() => {
          inflightRequest.value = null;
        });

        const apiData = await inflightRequest.value;
        setCachedApiData({
          expirationTimestamp: Date.now() + cacheExpirationThreshold,
          data: apiData,
        });
      } catch (error) {
        console.error(error);
        notify('error', 'Failed to fetch space objects.');
        setCachedApiData(null);
      }
    },
    {
      immediate: true,
    },
  );

  const debouncedSearchText = ref(searchText.value);
  let searchTextTimeout: ReturnType<typeof setTimeout>;

  watch(searchText, (newSearchText) => {
    clearTimeout(searchTextTimeout);

    if (!newSearchText) {
      debouncedSearchText.value = newSearchText;
      return;
    }

    searchTextTimeout = setTimeout(() => {
      debouncedSearchText.value = newSearchText;
    }, searchDebounceDelay);
  });

  const results = computed(() => {
    if (!spaceObjects.value) {
      return [];
    }

    if (!debouncedSearchText.value) {
      return spaceObjects.value;
    }

    return filterSpaceObjects(spaceObjects.value, debouncedSearchText.value);
  });

  // TODO: is loading not going to false???
  const isLoading = computed(() => !!inflightRequest.value);

  return {
    results,
    isLoading,
  };
};
