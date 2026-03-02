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
const version = 4;

/* Store //////////////////////////////////////////////////////////////////////////////////////////////////////////// */

const _useSearchStore = createStore(
  name,
  version,
  () => {
    const searchText = ref('YAM-');
    const compressedApiData = ref<string | null>(null);

    return {
      searchText,
      compressedApiData,
    };
  },
  {
    persist: [
      {
        storage: localStorage,
        pick: ['searchText', 'compressedApiData'],
      },
    ],
  },
);

/* Proxy //////////////////////////////////////////////////////////////////////////////////////////////////////////// */
// Do this so we can efficiently compress/decompress api data and map it into something more useful

const apiData = ref<CachedApiData | null>(null);

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

  if (!apiData.value && store.compressedApiData) {
    apiData.value = JSON.parse(decompressFromUTF16(store.compressedApiData)) as CachedApiData;
  }

  const setCachedApiData = (value: CachedApiData) => {
    apiData.value = value;
    store.compressedApiData = compressToUTF16(JSON.stringify(value));
  };

  return {
    searchText,
    apiData,
    spaceObjects,
    spaceObjectsLookupMap,
    setCachedApiData,
  };
};
