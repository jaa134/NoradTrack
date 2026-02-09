/* Imports ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

import { ref, watch } from 'vue';

import { getUserPosition, UserPosition } from '@/utilities/application.js';
import { createStore } from '@/utilities/store.js';

/* Constants //////////////////////////////////////////////////////////////////////////////////////////////////////// */

const name = 'application';
const version = 0;

/* Store //////////////////////////////////////////////////////////////////////////////////////////////////////////// */

export const useApplicationStore = createStore(
  name,
  version,
  () => {
    const routerLoading = ref(false);
    const routerError = ref<string | null>(null);

    const searchText = ref('YAM-');

    const selectedNoradIds = ref(new Set<number>());
    const focusedNoradId = ref<number | null>(null);

    const showSettingsDialog = ref(false);
    const showUserPosition = ref(true);
    const showCountryGeoJson = ref(false);

    const userPosition = ref<UserPosition | null>(null);
    getUserPosition().then((position) => {
      userPosition.value = position;
    });

    watch(
      selectedNoradIds,
      (newSelectedNoradIds) => {
        if (focusedNoradId.value && !newSelectedNoradIds.has(focusedNoradId.value)) {
          focusedNoradId.value = null;
        }
      },
      {
        deep: true,
      },
    );

    return {
      routerLoading,
      routerError,
      searchText,
      selectedNoradIds,
      focusedNoradId,
      showSettingsDialog,
      showUserPosition,
      showCountryGeoJson,
      userPosition,
    };
  },
  {
    persist: {
      storage: localStorage,
      pick: ['searchText', 'showUserPosition', 'showCountryGeoJson'],
    },
  },
);
