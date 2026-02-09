/* Imports ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

import { ref, watch } from 'vue';

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
    };
  },
  {
    persist: {
      storage: localStorage,
      pick: ['searchText'],
    },
  },
);
