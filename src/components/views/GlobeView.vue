<script setup lang="ts">
  /* Imports ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

  import type { GlobeInstance } from 'globe.gl';
  import Globe from 'globe.gl';
  import { degreesLat, degreesLong, eciToGeodetic, gstime, propagate, twoline2satrec } from 'satellite.js';
  import { Group, Mesh, MeshLambertMaterial, SphereGeometry } from 'three';
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

  import { useSpaceObjectCache } from '@/composables/useSpaceObjectCache.js';
  import { useApplicationStore } from '@/stores/variants/application.js';
  import { getSpaceObjectDisplayText, type SpaceObject } from '@/utilities/application';

  /* Types ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

  interface Position {
    latitude: number;
    longitude: number;
    altitude: number;
  }

  interface Marker {
    spaceObject: SpaceObject;
    position: Position;
  }

  /* Constants ////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const earthRadiusKm = 6371;

  /* Stores ///////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const applicationStore = useApplicationStore();

  /* Cache ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const { lookupCachedSpaceObjects, getCachedSpaceObjectTle } = useSpaceObjectCache();

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

    // Configure geometry
    globeInstance.objectThreeObject((marker) => createMarkerMesh(marker as Marker));
    globeInstance.objectLat((marker) => (marker as Marker).position.latitude);
    globeInstance.objectLng((marker) => (marker as Marker).position.longitude);
    globeInstance.objectAltitude((marker) => (marker as Marker).position.altitude);

    // Configure labels
    globeInstance.htmlElementsData([]);
    globeInstance.htmlElement((marker) => createMarkerLabel(marker as Marker));
    globeInstance.htmlLat((marker) => (marker as Marker).position.latitude);
    globeInstance.htmlLng((marker) => (marker as Marker).position.longitude);
    globeInstance.htmlAltitude((marker) => (marker as Marker).position.altitude);
  };

  const destroyGlobe = () => {
    if (!globeInstance) {
      return;
    }

    globeInstance._destructor();
    globeInstance = null;
  };

  /* Geometry /////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const createMarkerMesh = (marker: Marker): Group => {
    const group = new Group();

    const spaceObjectGeometry = new SphereGeometry(1);
    const spaceObjectMaterial = new MeshLambertMaterial({
      color: 'palegreen',
      transparent: true,
      opacity: 0.9,
    });
    const visibleMesh = new Mesh(spaceObjectGeometry, spaceObjectMaterial);
    group.add(visibleMesh);

    const hoverGeometry = new SphereGeometry(10);
    const hoverMaterial = new MeshLambertMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const hoverMesh = new Mesh(hoverGeometry, hoverMaterial);
    group.add(hoverMesh);

    return group;
  };

  /* Labels ///////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const createMarkerLabel = (marker: Marker) => {
    const label = document.createElement('div');
    label.textContent = marker.spaceObject.name;
    label.style.position = 'absolute';
    label.style.left = '50%';
    label.style.bottom = '0';
    label.style.transform = 'translate(-50%, -16px)';
    label.style.padding = 'var(--ja-spacing-2x-small) var(--ja-spacing-small)';
    label.style.borderRadius = 'var(--ja-border-radius-large)';
    label.style.background = 'color-mix(in srgb, var(--ja-color-neutral-1000) 75%, transparent)';
    label.style.color = 'var(--ja-color-neutral-0)';
    label.style.fontFamily = 'var(--ja-font-sans)';
    label.style.fontSize = 'var(--ja-font-size-small)';
    label.style.whiteSpace = 'nowrap';

    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    wrapper.style.pointerEvents = 'none';
    wrapper.appendChild(label);
    return wrapper;
  };

  /* Selection ////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const selectedSpaceObjects = computed(() => lookupCachedSpaceObjects(Array.from(applicationStore.selectedNoradIds)));

  const getSpaceObjectMarker = (spaceObject: SpaceObject, date: Date): Marker | null => {
    const spaceObjectTle = getCachedSpaceObjectTle(spaceObject.noradId);
    if (!spaceObjectTle) {
      console.error(`Failed to get TLE lines for ${getSpaceObjectDisplayText(spaceObject)}.`);
      return null;
    }

    const satrec = twoline2satrec(spaceObjectTle.line1, spaceObjectTle.line2);
    const positionAndVelocity = propagate(satrec, date);
    if (!positionAndVelocity?.position) {
      console.error(`Failed to propagate position for ${getSpaceObjectDisplayText(spaceObject)}.`);
      return null;
    }

    const geodetic = eciToGeodetic(positionAndVelocity.position, gstime(date));
    const altitude = Math.max(0, geodetic.height / earthRadiusKm);

    return {
      spaceObject,
      position: {
        latitude: degreesLat(geodetic.latitude),
        longitude: degreesLong(geodetic.longitude),
        altitude,
      },
    };
  };

  const updateGlobeSpaceObjects = (date: Date) => {
    if (!globeInstance) {
      return;
    }

    const objects = selectedSpaceObjects.value
      .map((spaceObject) => getSpaceObjectMarker(spaceObject, date))
      .filter((marker): marker is NonNullable<typeof marker> => !!marker);

    globeInstance.objectsData(objects);
    globeInstance.htmlElementsData(objects);
  };

  watch(
    selectedSpaceObjects,
    () => {
      updateGlobeSpaceObjects(new Date());
    },
    {
      immediate: true,
    },
  );

  /* Animation ////////////////////////////////////////////////////////////////////////////////////////////////////// */

  let animationFrame: number | null = null;

  const startAnimation = () => {
    const tick = () => {
      updateGlobeSpaceObjects(new Date());
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
