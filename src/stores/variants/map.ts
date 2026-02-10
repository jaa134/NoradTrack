/* Imports ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

import { ref } from 'vue';

import { MapSkin } from '@/utilities/map.js';
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

    const skin = ref(MapSkin.BlueMarble);

    return {
      center,
      zoom,
      skin,
    };
  },
  {
    persist: {
      storage: localStorage,
      pick: ['center', 'zoom', 'skin'],
    },
  },
);
