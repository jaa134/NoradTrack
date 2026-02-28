/* Imports ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

import { compressToUTF16, decompressFromUTF16 } from 'lz-string';
import { computed, ref } from 'vue';

import { type SpaceObject } from '@/utilities/application.js';
import { type OrbitMeanElementsMessageV3 } from '@/utilities/search.js';
import { createStore } from '@/utilities/store.js';

/* Types //////////////////////////////////////////////////////////////////////////////////////////////////////////// */

interface CachedApiData {
  expirationTimestamp: number;
  data: OrbitMeanElementsMessageV3[];
}

/* Constants //////////////////////////////////////////////////////////////////////////////////////////////////////// */

const name = 'search';
const version = 3;

/* Store //////////////////////////////////////////////////////////////////////////////////////////////////////////// */

const _useSearchStore = createStore(
  name,
  version,
  () => {
    const searchText = ref('YAM-');
    const apiData = ref<string | null>(null);

    return {
      searchText,
      apiData,
    };
  },
  {
    persist: [
      {
        storage: localStorage,
        pick: ['searchText', 'apiData'],
      },
    ],
  },
);

/* Proxy //////////////////////////////////////////////////////////////////////////////////////////////////////////// */

export const useSearchStore = () => {
  const store = _useSearchStore();

  const searchText = computed({
    get: () => {
      return store.searchText;
    },
    set: (value) => {
      store.searchText = value;
    },
  });

  const parsedApiData = ref<CachedApiData | null>(
    store.apiData ? (JSON.parse(decompressFromUTF16(store.apiData)) as CachedApiData) : null,
  );

  const apiData = computed<CachedApiData | null>({
    get: () => {
      return parsedApiData.value;
    },
    set: (value) => {
      parsedApiData.value = value;
      store.apiData = compressToUTF16(JSON.stringify(value));
    },
  });

  const spaceObjects = computed<SpaceObject[] | null>(() => {
    if (!apiData.value) {
      return null;
    }

    return apiData.value.data.map((omm) => ({
      name: omm.OBJECT_NAME,
      noradId: omm.NORAD_CAT_ID,
      objectId: omm.OBJECT_ID,
      classification: omm.CLASSIFICATION_TYPE,
      meanMotion: omm.MEAN_MOTION,
      omm,
    }));
  });

  const spaceObjectsLookupMap = computed<Record<string, SpaceObject>>(() => {
    if (!spaceObjects.value) {
      return {};
    }

    return spaceObjects.value.reduce<Record<string, SpaceObject>>((acc, spaceObject) => {
      acc[spaceObject.noradId] = spaceObject;
      return acc;
    }, {});
  });

  return {
    searchText,
    apiData,
    spaceObjects,
    spaceObjectsLookupMap,
  };
};
