<script setup lang="ts">
  /* Imports ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

  import type { GlobeInstance } from 'globe.gl';
  import Globe from 'globe.gl';
  import { Group, Mesh, MeshLambertMaterial, SphereGeometry } from 'three';
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

  import {
    createLabelElement,
    getSpaceObjectMarker,
    Marker,
    markerColor,
    markerFocusColor,
    SpaceObject,
  } from '@/utilities/application.js';

  import { useApplicationStore } from '@/stores/variants/application.js';
  import { useGlobeStore } from '@/stores/variants/globe.js';

  import { useSpaceObjectCache } from '@/composables/useSpaceObjectCache.js';

  /* Stores ///////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const applicationStore = useApplicationStore();

  const globeStore = useGlobeStore();

  /* Cache ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const { lookupCachedSpaceObject, getCachedSpaceObjectTle } = useSpaceObjectCache();

  /* Elements /////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const globeElement = ref<HTMLDivElement>();

  /* Globe ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

  let globe: GlobeInstance | null;

  const initializeGlobe = () => {
    if (!globeElement.value || globe) {
      return;
    }

    // Create globe instance
    globe = new Globe(globeElement.value, {
      rendererConfig: {
        alpha: true,
        antialias: true,
      },
    });

    // Configure interactions and controls
    globe.enablePointerInteraction(true);
    const controls = globe.controls();
    controls.enableZoom = true;
    controls.minDistance = 100;
    controls.maxDistance = 500;
    controls.enablePan = false;
    controls.enableRotate = true;
    controls.autoRotate = false;

    // Configure scene
    globe.width(globeElement.value.clientWidth);
    globe.height(globeElement.value.clientHeight);
    globe.backgroundColor('rgba(0,0,0,0)');

    // Configure POV
    globe.pointOfView({
      lat: globeStore.pov.lat,
      lng: globeStore.pov.lng,
      altitude: globeStore.zoom,
    });

    // Configure atmosphere
    globe.showAtmosphere(true);
    globe.atmosphereAltitude(0.2);

    // Configure textures
    globe
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png');

    // Configure markers
    globe.objectThreeObject((marker) => buildMarkerVisuals(marker as Marker));
    globe.objectLat((marker) => (marker as Marker).latitude);
    globe.objectLng((marker) => (marker as Marker).longitude);
    globe.objectAltitude((marker) => (marker as Marker).altitude);
    globe.objectLabel(() => '');

    // Configure labels
    globe.htmlElementsData([]);
    globe.htmlElement((marker) => createLabelElement((marker as Marker).name));
    globe.htmlLat((marker) => (marker as Marker).latitude);
    globe.htmlLng((marker) => (marker as Marker).longitude);
    globe.htmlAltitude((marker) => (marker as Marker).altitude);

    // Configure object focus
    globe.onObjectClick((object) => {
      focusNoradId((object as Marker).noradId);
    });

    // Configure POV tracking
    controls.addEventListener('change', () => {
      if (!globe) {
        return;
      }

      const pov = globe.pointOfView();
      if (!pov) {
        return;
      }

      globeStore.pov = {
        lat: pov.lat,
        lng: pov.lng,
        altitude: pov.altitude,
      };

      globeStore.zoom = pov.altitude;
    });
  };

  const destroyGlobe = () => {
    if (!globe) {
      return;
    }

    globe._destructor();
    globe = null;
  };

  /* Object visuals ///////////////////////////////////////////////////////////////////////////////////////////////// */

  const buildMarkerVisuals = (marker: Marker) => {
    const focused = applicationStore.focusedNoradId === marker.noradId;

    const spaceObjectGeometry = new SphereGeometry(1);
    const spaceObjectMaterial = new MeshLambertMaterial({
      color: focused ? markerFocusColor : markerColor,
    });
    const visibleMesh = new Mesh(spaceObjectGeometry, spaceObjectMaterial);

    const clickGeometry = new SphereGeometry(5);
    const clickMaterial = new MeshLambertMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const clickMesh = new Mesh(clickGeometry, clickMaterial);

    const group = new Group();
    group.add(visibleMesh);
    group.add(clickMesh);
    return group;
  };

  /* Selection ////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const selectedSpaceObjects = computed(() =>
    Array.from(applicationStore.selectedNoradIds)
      .map((noradId) => lookupCachedSpaceObject(noradId))
      .filter((spaceObject): spaceObject is SpaceObject => !!spaceObject),
  );

  const updateMarkers = (date: Date) => {
    if (!globe) {
      return;
    }

    const objects = selectedSpaceObjects.value
      .map((spaceObject) => getSpaceObjectMarker(spaceObject, getCachedSpaceObjectTle, date))
      .filter((marker): marker is NonNullable<typeof marker> => !!marker);

    globe.objectsData(objects);
    globe.htmlElementsData(objects);
  };

  watch(
    selectedSpaceObjects,
    () => {
      updateMarkers(new Date());
    },
    {
      immediate: true,
    },
  );

  /* Focus ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const focusNoradId = (noradId: number) => {
    applicationStore.focusedNoradId = noradId;
  };

  watch(
    () => applicationStore.focusedNoradId,
    () => {
      updateMarkers(new Date());
    },
  );

  /* Animation ////////////////////////////////////////////////////////////////////////////////////////////////////// */

  let lastRenderTime = 0;
  const renderIntervalMs = 1000;

  let animationFrame: number | null = null;

  const startAnimation = () => {
    const tick = () => {
      const now = new Date();
      const nowTime = now.getTime();
      if (nowTime - lastRenderTime >= renderIntervalMs) {
        lastRenderTime = nowTime;
        updateMarkers(now);
      }
      animationFrame = requestAnimationFrame(tick);
    };
    animationFrame = requestAnimationFrame(tick);
  };

  const stopAnimation = () => {
    if (animationFrame !== null) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
  };

  /* Resize ///////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const resizeObserver = new ResizeObserver(() => {
    if (!globe || !globeElement.value) {
      return;
    }

    globe.width(globeElement.value.clientWidth);
    globe.height(globeElement.value.clientHeight);
  });

  const watchResize = () => {
    if (!globeElement.value) {
      return;
    }

    resizeObserver.observe(globeElement.value);
  };

  const unwatchResize = () => {
    resizeObserver.disconnect();
  };

  /* Lifecycle ////////////////////////////////////////////////////////////////////////////////////////////////////// */

  onMounted(() => {
    initializeGlobe();
    startAnimation();
    watchResize();
  });

  onBeforeUnmount(() => {
    unwatchResize();
    stopAnimation();
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
