<script setup lang="ts">
  /* Imports ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

  import { type Feature, type FeatureCollection } from 'geojson';
  import Globe, { type GlobeInstance } from 'globe.gl';
  import {
    AmbientLight,
    DirectionalLight,
    Group,
    Mesh,
    MeshBasicMaterial,
    MeshStandardMaterial,
    SphereGeometry,
  } from 'three';
  import { onBeforeUnmount, onMounted, ref, toRaw, watch } from 'vue';

  import {
    countryGeoJsonColor,
    createLabelElement,
    earthRadius,
    eventHub,
    EventType,
    getSpaceObjectDisplayText,
    getSpaceObjectMarker,
    getUserPositionMarker,
    type Marker,
    propagateOmm,
    type SpaceObjectMarker,
    spaceObjectMarkerColor,
    spaceObjectMarkerFocusColor,
    userPositionMarkerColor,
  } from '@/utilities/application.js';
  import { globeBumpImageUrl, globeSkinSourceMap } from '@/utilities/globe.js';
  import { computeSubSolarPoint } from '@/utilities/solar-terminator.js';

  import { useApplicationStore } from '@/stores/variants/application.js';
  import { useGlobeStore } from '@/stores/variants/globe.js';

  import { useCountriesGeoJson } from '@/composables/useCountriesGeoJson.js';
  import { useSpaceObjectLookup } from '@/composables/useSpaceObjectLookup.js';

  /* Stores ///////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const applicationStore = useApplicationStore();

  const globeStore = useGlobeStore();

  /* Cache ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const lookupSpaceObject = useSpaceObjectLookup();

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
    globe.globeImageUrl(globeSkinSourceMap[globeStore.skin]);
    globe.bumpImageUrl(globeBumpImageUrl);

    // Configure material
    const defaultMaterial = globe.globeMaterial() as MeshStandardMaterial;
    const newMaterial = new MeshStandardMaterial({
      map: defaultMaterial.map,
      bumpMap: defaultMaterial.bumpMap,
      bumpScale: defaultMaterial.bumpScale,
      roughness: 1.0,
      metalness: 0.0,
    });
    newMaterial.emissive.setHex(0x000000);
    newMaterial.emissiveIntensity = 0.2;
    newMaterial.needsUpdate = true;
    globe.globeMaterial(newMaterial);

    // Configure markers
    globe.objectThreeObject((marker) => buildMarkerVisuals(marker as Marker));
    globe.objectLat((marker) => (marker as Marker).latitude);
    globe.objectLng((marker) => (marker as Marker).longitude);
    globe.objectAltitude((marker) => (marker as Marker).altitude / earthRadius);
    globe.objectLabel(() => '');

    // Configure labels
    globe.htmlElementsData([]);
    globe.htmlElement((marker) => createLabelElement((marker as Marker).label));
    globe.htmlLat((marker) => (marker as Marker).latitude);
    globe.htmlLng((marker) => (marker as Marker).longitude);
    globe.htmlAltitude((marker) => (marker as Marker).altitude / earthRadius);

    // Configure countries GeoJSON
    globe.polygonAltitude(0);
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

      globeStore.pov = {
        lat: pov.lat,
        lng: pov.lng,
        altitude: pov.altitude,
      };

      globeStore.zoom = pov.altitude;
    });

    // Configure globe startup
    globe.onGlobeReady(() => {
      updateSolarTerminator(new Date());
      toggleSolarTerminator(applicationStore.showSolarTerminator);
    });
  };

  const destroyGlobe = () => {
    if (!globe) {
      return;
    }

    globe._destructor();
    globe = null;
  };

  /* Camera positioning ///////////////////////////////////////////////////////////////////////////////////////////// */

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

  const moveCameraToNoradId = (noradId: number) => {
    if (!globe) {
      return;
    }

    const spaceObject = lookupSpaceObject(noradId);
    if (!spaceObject) {
      return;
    }

    const propagatedOmm = propagateOmm(spaceObject.omm, new Date());
    if (!propagatedOmm) {
      return;
    }

    globe.pointOfView({ lat: propagatedOmm.latitude, lng: propagatedOmm.longitude }, 500);
  };

  /* Build visuals ////////////////////////////////////////////////////////////////////////////////////////////////// */

  const buildUserPositionMarkerVisuals = () => {
    const userPositionGeometry = new SphereGeometry(1);
    const userPositionMaterial = new MeshBasicMaterial({
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
    const spaceObjectMaterial = new MeshBasicMaterial({
      color: focused ? spaceObjectMarkerFocusColor : spaceObjectMarkerColor,
    });
    const spaceObjectMesh = new Mesh(spaceObjectGeometry, spaceObjectMaterial);

    const clickGeometry = new SphereGeometry(5);
    const clickMaterial = new MeshBasicMaterial({
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

  /* Update solar terminator //////////////////////////////////////////////////////////////////////////////////////// */

  const sunLight = new DirectionalLight(0xffffff, 5);

  const toggleSolarTerminator = (show: boolean) => {
    if (!globe) {
      return;
    }

    const scene = globe.scene();

    if (show) {
      scene.children.forEach((o) => {
        if (o instanceof AmbientLight) {
          o.intensity = 0.25;
        } else if (o instanceof DirectionalLight && o !== sunLight) {
          o.intensity = 0;
        }
      });

      scene.add(sunLight);
      scene.add(sunLight.target);
    } else {
      scene.children.forEach((o) => {
        if (o instanceof AmbientLight) {
          o.intensity = 3;
        } else if (o instanceof DirectionalLight && o !== sunLight) {
          o.intensity = 2;
        }
      });

      scene.remove(sunLight);
      scene.remove(sunLight.target);
    }
  };

  const updateSolarTerminator = (date: Date) => {
    const { latitude, longitude } = computeSubSolarPoint(date);

    // Convert sub-solar lat/lon to Three.js cartesian coordinates (globe.gl convention)
    const phi = ((90 - latitude) * Math.PI) / 180;
    const theta = ((90 - longitude) * Math.PI) / 180;
    const r = 100;

    sunLight.position.set(r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));

    sunLight.target.position.set(0, 0, 0);
    sunLight.target.updateMatrixWorld();
  };

  watch(
    () => applicationStore.showSolarTerminator,
    (newShowSolarTerminator) => {
      updateSolarTerminator(new Date());
      toggleSolarTerminator(newShowSolarTerminator);
    },
  );

  /* Update markers ///////////////////////////////////////////////////////////////////////////////////////////////// */

  const updateMarkers = (date: Date) => {
    if (!globe) {
      return;
    }

    const markers: Marker[] = [];

    if (applicationStore.showUserPosition && applicationStore.userPosition) {
      markers.push(getUserPositionMarker(applicationStore.userPosition));
    }

    for (const noradId of applicationStore.selectedNoradIds) {
      const spaceObject = lookupSpaceObject(noradId);
      if (!spaceObject) {
        continue;
      }

      const marker = getSpaceObjectMarker(spaceObject, date);
      if (!marker) {
        console.error(`Failed to propagate position for ${getSpaceObjectDisplayText(spaceObject)}.`);
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
    (newSelectedNoradIds, oldSelectedNoradIds) => {
      updateMarkers(new Date());

      const addedNoradIds = newSelectedNoradIds.difference(oldSelectedNoradIds);
      const noradIdToView = addedNoradIds.values().next().value;
      if (noradIdToView) {
        moveCameraToNoradId(noradIdToView);
      }
    },
  );

  /* Focus ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const focusNoradId = (noradId: number) => {
    applicationStore.focusedNoradId = noradId;
  };

  watch(
    () => applicationStore.focusedNoradId,
    (newFocusedNoradId) => {
      updateMarkers(new Date());

      if (newFocusedNoradId) {
        moveCameraToNoradId(newFocusedNoradId);
      }
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

  /* Skins ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

  watch(
    () => globeStore.skin,
    (newSkin) => {
      if (!globe) {
        return;
      }

      globe.globeImageUrl(globeSkinSourceMap[newSkin]);
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
        updateSolarTerminator(now);
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
