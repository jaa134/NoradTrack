/* Imports ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

import { createPinia } from 'pinia';
import { createPersistedState } from 'pinia-plugin-persistedstate';

import { getStorageKey } from '@/utilities/store.js';

/* Initialize /////////////////////////////////////////////////////////////////////////////////////////////////////// */

const pinia = createPinia();

const persistedState = createPersistedState({
  storage: localStorage,
  key: getStorageKey,
});

pinia.use(persistedState);

export default pinia;
