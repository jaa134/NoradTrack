<script setup lang="ts">
  /* Imports ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

  import type { Feature, FeatureCollection } from 'geojson';
  import type { GlobeInstance } from 'globe.gl';
  import Globe from 'globe.gl';
  import { Group, Mesh, MeshLambertMaterial, SphereGeometry } from 'three';
  import { onBeforeUnmount, onMounted, ref, toRaw, watch } from 'vue';

  import {
    countryGeoJsonColor,
    createLabelElement,
    eventHub,
    EventType,
    getSpaceObjectMarker,
    getUserPositionMarker,
    Marker,
    SpaceObjectMarker,
    spaceObjectMarkerColor,
    spaceObjectMarkerFocusColor,
    userPositionMarkerColor,
  } from '@/utilities/application.js';

  import { useApplicationStore } from '@/stores/variants/application.js';
  import { useGlobeStore } from '@/stores/variants/globe.js';

  import { useCountriesGeoJson } from '@/composables/useCountriesGeoJson.js';
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
    controls.minDistance = 125;
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
    globe.htmlElement((marker) => createLabelElement((marker as Marker).label));
    globe.htmlLat((marker) => (marker as Marker).latitude);
    globe.htmlLng((marker) => (marker as Marker).longitude);
    globe.htmlAltitude((marker) => (marker as Marker).altitude);

    // Configure countries GeoJSON
    globe.polygonAltitude(0.01);
    globe.polygonCapColor(() => 'rgba(0, 0, 0, 0)');
    globe.polygonSideColor(() => 'rgba(0, 0, 0, 0)');
    globe.polygonStrokeColor(() => countryGeoJsonColor);

    // Configure object focus
    globe.onObjectClick((object) => {
      if ('noradId' in object && typeof object.noradId === 'number') {
        focusNoradId(object.noradId);
      }
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

  const buildUserPositionMarkerVisuals = () => {
    const userPositionGeometry = new SphereGeometry(1);
    const userPositionMaterial = new MeshLambertMaterial({
      color: userPositionMarkerColor,
    });
    const userPositionMesh = new Mesh(userPositionGeometry, userPositionMaterial);

    const group = new Group();
    group.add(userPositionMesh);
    return group;
  };

  const buildSpaceObjectMarkerVisuals = (marker: SpaceObjectMarker) => {
    const focused = applicationStore.focusedNoradId === marker.noradId;

    const spaceObjectGeometry = new SphereGeometry(1);
    const spaceObjectMaterial = new MeshLambertMaterial({
      color: focused ? spaceObjectMarkerFocusColor : spaceObjectMarkerColor,
    });
    const spaceObjectMesh = new Mesh(spaceObjectGeometry, spaceObjectMaterial);

    const clickGeometry = new SphereGeometry(5);
    const clickMaterial = new MeshLambertMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const clickMesh = new Mesh(clickGeometry, clickMaterial);

    const group = new Group();
    group.add(spaceObjectMesh);
    group.add(clickMesh);
    return group;
  };

  const buildMarkerVisuals = (marker: Marker) => {
    if ('noradId' in marker) {
      return buildSpaceObjectMarkerVisuals(marker);
    }

    return buildUserPositionMarkerVisuals();
  };

  /* Update markers ///////////////////////////////////////////////////////////////////////////////////////////////// */

  const updateMarkers = (date: Date) => {
    if (!globe) {
      return;
    }

    let markers: Marker[] = [];

    if (applicationStore.showUserPosition && applicationStore.userPosition) {
      markers.push(getUserPositionMarker(applicationStore.userPosition));
    }

    for (const noradId of applicationStore.selectedNoradIds) {
      const spaceObject = lookupCachedSpaceObject(noradId);
      if (!spaceObject) {
        continue;
      }

      const marker = getSpaceObjectMarker(spaceObject, getCachedSpaceObjectTle, date);
      if (!marker) {
        continue;
      }

      markers.push(marker);
    }

    globe.objectsData(markers);
    globe.htmlElementsData(markers);
  };

  /* Selection ////////////////////////////////////////////////////////////////////////////////////////////////////// */

  watch(
    () => applicationStore.selectedNoradIds,
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

  /* User position ////////////////////////////////////////////////////////////////////////////////////////////////// */

  watch(
    () => applicationStore.showUserPosition,
    () => {
      updateMarkers(new Date());
    },
  );

  /* Countries GeoJSON ////////////////////////////////////////////////////////////////////////////////////////////// */

  const { data: countriesGeoJson } = useCountriesGeoJson();

  const updateCountriesGeoJson = () => {
    if (!globe) {
      return;
    }

    let features: Feature[] = [];
    if (countriesGeoJson.value && applicationStore.showCountryGeoJson) {
      const featureCollection = structuredClone(toRaw(countriesGeoJson.value)) as FeatureCollection;
      features = featureCollection.features;
    }

    globe.polygonsData(features);
  };

  watch([countriesGeoJson, () => applicationStore.showCountryGeoJson], () => {
    updateCountriesGeoJson();
  });

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

  /* Zoom /////////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const zoomStep = 0.3;

  const zoom = (getNewAltitude: (currentAltitude: number) => number) => {
    if (!globe) {
      return {
        lat: globeStore.pov.lat,
        lng: globeStore.pov.lng,
        altitude: globeStore.zoom,
      };
    }

    const pov = globe.pointOfView();
    if (!pov) {
      return {
        lat: globeStore.pov.lat,
        lng: globeStore.pov.lng,
        altitude: globeStore.zoom,
      };
    }

    const newAltitude = getNewAltitude(pov.altitude);

    globe.pointOfView(
      {
        lat: pov.lat,
        lng: pov.lng,
        altitude: newAltitude,
      },
      500,
    );
  };

  const fitToScreen = () => {
    zoom(() => 1.5);
  };

  const zoomIn = () => {
    zoom((altitude) => altitude - zoomStep * altitude);
  };

  const zoomOut = () => {
    zoom((altitude) => altitude + zoomStep * altitude);
  };

  /* Eventing /////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const registerEventHandlers = () => {
    eventHub.on(EventType.FitToScreen, fitToScreen);
    eventHub.on(EventType.ZoomIn, zoomIn);
    eventHub.on(EventType.ZoomOut, zoomOut);
  };

  const unregisterEventHandlers = () => {
    eventHub.off(EventType.FitToScreen, fitToScreen);
    eventHub.off(EventType.ZoomIn, zoomIn);
    eventHub.off(EventType.ZoomOut, zoomOut);
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
    registerEventHandlers();
    watchResize();
    startAnimation();
    updateCountriesGeoJson();
  });

  onBeforeUnmount(() => {
    stopAnimation();
    unwatchResize();
    unregisterEventHandlers();
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
