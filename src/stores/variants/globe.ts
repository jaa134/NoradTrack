/* Imports ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

import { ref } from 'vue';

import { GlobeSkin } from '@/utilities/globe.js';
import { createStore } from '@/utilities/store.js';

/* Constants //////////////////////////////////////////////////////////////////////////////////////////////////////// */

const name = 'globe';
const version = 1;

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

    const skin = ref(GlobeSkin.BlueMarble);

    return {
      pov,
      zoom,
      skin,
    };
  },
  {
    persist: {
      storage: localStorage,
      pick: ['pov', 'zoom', 'skin'],
    },
  },
);
