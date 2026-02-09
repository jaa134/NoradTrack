/* Imports ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

import { ref } from 'vue';

import { createStore } from '@/utilities/store.js';

/* Constants //////////////////////////////////////////////////////////////////////////////////////////////////////// */

const name = 'globe';
const version = 0;

/* Store //////////////////////////////////////////////////////////////////////////////////////////////////////////// */

export const useGlobeStore = createStore(
  name,
  version,
  () => {
    const pov = ref({
      lat: 39.6,
      lng: -98.5,
      altitude: 1.5,
    });

    const zoom = ref(1.5);

    return {
      pov,
      zoom,
    };
  },
  {
    persist: {
      storage: localStorage,
      pick: ['pov', 'zoom'],
    },
  },
);
