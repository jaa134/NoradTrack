<script setup lang="ts">
  /* Imports ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

  import type { GlobeInstance } from 'globe.gl';
  import Globe from 'globe.gl';
  import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

  import { useSpaceObjectCache } from '@/composables/useSpaceObjectCache.js';
  import { useApplicationStore } from '@/stores/variants/application.js';

  /* Stores ///////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const applicationStore = useApplicationStore();

  /* Cache ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const { lookupSpaceObjects } = useSpaceObjectCache();

  /* Elements /////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const globeElement = ref<HTMLDivElement>();

  /* Globe ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

  let globeInstance: GlobeInstance | null;

  const initializeGlobe = () => {
    if (!globeElement.value || globeInstance) {
      return;
    }

    // Create globe instance
    globeInstance = new Globe(globeElement.value, {
      rendererConfig: {
        alpha: true,
        antialias: true,
      },
    });

    // Configure interactions and controls
    globeInstance.enablePointerInteraction(true);
    const controls = globeInstance.controls();
    controls.enableZoom = true;
    controls.minDistance = 100;
    controls.maxDistance = 500;
    controls.enablePan = false;
    controls.enableRotate = true;
    controls.autoRotate = false;

    // Configure scene
    globeInstance.width(globeElement.value.clientWidth);
    globeInstance.height(globeElement.value.clientHeight);
    globeInstance.backgroundColor('rgba(0,0,0,0)');

    // Configure POV
    globeInstance.pointOfView({ lat: 39.6, lng: -98.5, altitude: 1.5 });

    // Configure atmosphere
    globeInstance.showAtmosphere(true);
    globeInstance.atmosphereAltitude(0.2);

    // Configure textures
    globeInstance
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png');
  };

  const destroyGlobe = () => {
    if (!globeInstance) {
      return;
    }

    globeInstance._destructor();
    globeInstance = null;
  };

  /* Selection ////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const selectedNoradIds = computed(() => applicationStore.selectedNoradIds);

  // TODO: render selected space objects on the globe

  /* Lifecycle ////////////////////////////////////////////////////////////////////////////////////////////////////// */

  onMounted(() => {
    initializeGlobe();
  });

  onBeforeUnmount(() => {
    destroyGlobe();
  });
</script>

<template>
  <div class="globe-view">
    <div
      ref="globeElement"
      class="globe"
    ></div>
  </div>
</template>

<style scoped>
  .globe {
    width: 100%;
    height: 100%;
    cursor: grab;
  }
</style>
