/* Imports ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

import { ref, shallowRef, watch } from 'vue';

import { getUserPosition, type UserPosition } from '@/utilities/application.js';
import { createStore } from '@/utilities/store.js';

import { useNotify } from '@/composables/useNotify.js';

/* Constants //////////////////////////////////////////////////////////////////////////////////////////////////////// */

const name = 'application';
const version = 0;

/* Store //////////////////////////////////////////////////////////////////////////////////////////////////////////// */

export const useApplicationStore = createStore(
  name,
  version,
  () => {
    const { notify } = useNotify();

    const routerLoading = ref(false);
    const routerError = ref<string | null>(null);

    const searchText = ref('YAM-');

    const selectedNoradIds = shallowRef<Set<number>>(new Set());
    const focusedNoradId = ref<number | null>(null);

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

    const showSettingsDialog = ref(false);
    const showUserPosition = ref(true);
    const showCountryGeoJson = ref(false);

    const showLocationServicesDialog = ref(true);
    const userPosition = ref<UserPosition | null>(null);

    watch(
      showLocationServicesDialog,
      async (newShowLocationServicesDialog) => {
        if (newShowLocationServicesDialog) {
          return;
        }

        try {
          userPosition.value = await getUserPosition();
        } catch (error) {
          console.error(error);
          notify('error', 'Failed to get your location.');
        }
      },
      {
        immediate: true,
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
      showLocationServicesDialog,
      userPosition,
    };
  },
  {
    persist: [
      {
        storage: localStorage,
        pick: ['searchText', 'showUserPosition', 'showCountryGeoJson'],
      },
      {
        storage: sessionStorage,
        pick: ['showLocationServicesDialog'],
      },
    ],
  },
);
