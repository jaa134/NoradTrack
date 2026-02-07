/* Imports ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

import '@/styles/index.css';

import FloatingVue from 'floating-vue';
import { createApp } from 'vue';

import App from '@/App.vue';
import router from '@/router/index.js';
import pinia from '@/stores/index.js';
import { useApplicationStore } from '@/stores/variants/application.js';

/* Initialize application /////////////////////////////////////////////////////////////////////////////////////////// */
const bootstrap = () => {
  const app = createApp(App);

  app.use(FloatingVue);
  app.use(router);
  app.use(pinia);

  const applicationStore = useApplicationStore();

  router.beforeEach(() => {
    applicationStore.routerLoading = true;
    applicationStore.routerError = null;
  });

  router.afterEach(() => {
    applicationStore.routerLoading = false;
    applicationStore.routerError = null;
  });

  router.onError((error) => {
    applicationStore.routerLoading = false;
    applicationStore.routerError = error instanceof Error ? error.message : String(error);
  });

  app.mount('body');
};

bootstrap();
