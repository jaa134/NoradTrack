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
    globeInstance.pointOfView({
      lat: globeStore.pov.lat,
      lng: globeStore.pov.lng,
      altitude: globeStore.zoom,
    });

    // Configure atmosphere
    globeInstance.showAtmosphere(true);
    globeInstance.atmosphereAltitude(0.2);

    // Configure textures
    globeInstance
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png');

    // Configure markers
    globeInstance.objectThreeObject((marker) => buildMarkerVisuals(marker as Marker));
    globeInstance.objectLat((marker) => (marker as Marker).latitude);
    globeInstance.objectLng((marker) => (marker as Marker).longitude);
    globeInstance.objectAltitude((marker) => (marker as Marker).altitude);
    globeInstance.objectLabel(() => '');

    // Configure labels
    globeInstance.htmlElementsData([]);
    globeInstance.htmlElement((marker) => createLabelElement((marker as Marker).name));
    globeInstance.htmlLat((marker) => (marker as Marker).latitude);
    globeInstance.htmlLng((marker) => (marker as Marker).longitude);
    globeInstance.htmlAltitude((marker) => (marker as Marker).altitude);

    // Configure object focus
    globeInstance.onObjectClick((object) => {
      focusNoradId((object as Marker).noradId);
    });

    // Configure POV tracking
    controls.addEventListener('change', () => {
      const pov = globeInstance?.pointOfView();
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
    if (!globeInstance) {
      return;
    }

    globeInstance._destructor();
    globeInstance = null;
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
    if (!globeInstance) {
      return;
    }

    const objects = selectedSpaceObjects.value
      .map((spaceObject) => getSpaceObjectMarker(spaceObject, getCachedSpaceObjectTle, date))
      .filter((marker): marker is NonNullable<typeof marker> => !!marker);

    globeInstance.objectsData(objects);
    globeInstance.htmlElementsData(objects);
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

  /* Lifecycle ////////////////////////////////////////////////////////////////////////////////////////////////////// */

  onMounted(() => {
    initializeGlobe();
    startAnimation();
  });

  onBeforeUnmount(() => {
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
