<script setup lang="ts">
  /* Imports //////////////////////////////////////////////////////////////////////////////////////////////////////// */

  import { computed } from 'vue';

  import { useApplicationStore } from '@/stores/variants/application.js';

  import LocationServicesDialog from '@/components/common/LocationServicesDialog.vue';
  import SettingsDialog from '@/components/common/SettingsDialog.vue';
  import ObjectSelectionControls from '@/components/controls/ObjectSelectionControls.vue';
  import SettingsControls from '@/components/controls/SettingsControls.vue';
  import ZoomControls from '@/components/controls/ZoomControls.vue';
  import ErrorView from '@/components/views/ErrorView.vue';
  import LoadingView from '@/components/views/LoadingView.vue';

  /* Constants ////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const transitionName = 'fade-in-slow';

  /* Stores ///////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const applicationStore = useApplicationStore();

  /* Controls /////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const showControls = computed(() => !applicationStore.routerLoading && !applicationStore.routerError);
</script>

<template>
  <div class="app">
    <Transition :name="transitionName">
      <ObjectSelectionControls
        v-show="showControls"
        class="controls"
      />
    </Transition>
    <Transition :name="transitionName">
      <SettingsControls
        v-show="showControls"
        class="controls"
      />
    </Transition>
    <Transition :name="transitionName">
      <ZoomControls
        v-show="showControls"
        class="controls"
      />
    </Transition>

    <RouterView v-slot="{ Component }">
      <Transition
        :name="transitionName"
        mode="out-in"
      >
        <LoadingView v-if="applicationStore.routerLoading" />
        <ErrorView
          v-else-if="applicationStore.routerError"
          :error="applicationStore.routerError"
        />
        <component
          :is="Component"
          v-else
        />
      </Transition>
    </RouterView>

    <SettingsDialog v-model="applicationStore.showSettingsDialog" />
    <LocationServicesDialog v-model="applicationStore.showLocationServicesDialog" />
  </div>
</template>

<style scoped>
  .app {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .controls {
    --controls-edge-offset: var(--ja-spacing-2x-large);
    --controls-spacer: var(--ja-spacing-medium);

    position: absolute;
    z-index: 10;
  }

  .object-selection-controls {
    top: var(--controls-edge-offset);
    left: var(--controls-edge-offset);
    bottom: var(--controls-edge-offset);
  }

  .settings-controls {
    top: var(--controls-edge-offset);
    right: var(--controls-edge-offset);
  }

  .zoom-controls {
    bottom: var(--controls-edge-offset);
    right: var(--controls-edge-offset);
  }

  .loading-view,
  .error-view,
  .map-view,
  .globe-view {
    z-index: 0;
    width: 100%;
    height: 100%;
  }

  @media (max-width: 768px) {
    .controls {
      --controls-edge-offset: var(--ja-spacing-medium);
    }
  }

  @keyframes loading-sweep {
    0% {
      left: -25%;
    }
    100% {
      left: 125%;
    }
  }

  @keyframes fade-in {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }
</style>
