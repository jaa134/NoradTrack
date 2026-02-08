/* Imports ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

import { ref } from 'vue';

import { createStore } from '@/utilities/store.js';

/* Constants //////////////////////////////////////////////////////////////////////////////////////////////////////// */

const name = 'map';
const version = 0;

/* Store //////////////////////////////////////////////////////////////////////////////////////////////////////////// */

export const useMapStore = createStore(
  name,
  version,
  () => {
    const center = ref<[number, number]>([0, 0]);

    const zoom = ref(3);

    return {
      center,
      zoom,
    };
  },
  {
    persist: [
      {
        storage: localStorage,
        pick: ['center', 'zoom'],
      },
    ],
  },
);
