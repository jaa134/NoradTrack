/* Imports ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

import { ref } from 'vue';

import { createStore } from '@/utilities/store.js';

/* Constants //////////////////////////////////////////////////////////////////////////////////////////////////////// */

const name = 'application';
const version = 0;

/* Store //////////////////////////////////////////////////////////////////////////////////////////////////////////// */

export const useApplicationStore = createStore(name, version, () => {
  const routerLoading = ref(false);
  const routerError = ref<string | null>(null);

  const currentDateTime = ref(new Date());
  setInterval(() => {
    currentDateTime.value = new Date();
  }, 1000);

  const selectedNoradIds = ref(new Set<number>());

  return {
    routerLoading,
    routerError,
    currentDateTime,
    selectedNoradIds,
  };
});
