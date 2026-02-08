<script setup lang="ts">
  /* Imports //////////////////////////////////////////////////////////////////////////////////////////////////////// */

  import { Map as OlMap } from 'ol';
  import { easeOut } from 'ol/easing.js';
  import Feature from 'ol/Feature.js';
  import Point from 'ol/geom/Point.js';
  import { defaults as getDefaultInteractions } from 'ol/interaction.js';
  import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer.js';
  import Overlay from 'ol/Overlay.js';
  import { fromLonLat, get as getProjection, toLonLat } from 'ol/proj.js';
  import { Vector as VectorSource, XYZ } from 'ol/source.js';
  import { Circle as CircleStyle, Fill, Style } from 'ol/style.js';
  import View from 'ol/View.js';
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

  import { useSpaceObjectCache } from '@/composables/useSpaceObjectCache.js';
  import { useApplicationStore } from '@/stores/variants/application.js';
  import { useMapStore } from '@/stores/variants/map.js';
  import {
    createLabelElement,
    eventHub,
    EventType,
    getSpaceObjectMarker,
    markerColor,
  } from '@/utilities/application.js';

  /* Constants ////////////////////////////////////////////////////////////////////////////////////////////////////// */

  // Main screen space + 5 additional spaces to the left and right
  const horizontalLimitFactor = 11;

  /* Stores ///////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const applicationStore = useApplicationStore();

  const mapStore = useMapStore();

  /* Cache ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const { lookupCachedSpaceObjects, getCachedSpaceObjectTle } = useSpaceObjectCache();

  /* Elements /////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const mapElement = ref<HTMLDivElement>();

  /* Map //////////////////////////////////////////////////////////////////////////////////////////////////////////// */

  let map: OlMap | null = null;

  let markersLayer: VectorLayer<VectorSource<Feature<Point>>> | null = null;

  const initializeMap = () => {
    if (!mapElement.value || map) {
      return;
    }

    // Create map instance
    map = new OlMap({
      target: mapElement.value,
      controls: [],
      interactions: getDefaultInteractions(),
    });

    // Configure scene
    map.setSize([mapElement.value.clientWidth, mapElement.value.clientHeight]);

    // Configure projection extent - allow horizontal panning beyond the projection extent
    const projection = getProjection('EPSG:3857') ?? undefined;
    let extent = projection?.getExtent();
    if (extent) {
      const horizontalLimit = extent[2]! * horizontalLimitFactor;
      extent = [-horizontalLimit, extent[1]!, horizontalLimit, extent[3]!];
    }

    // Configure POV
    map.setView(
      new View({
        multiWorld: true,
        projection,
        extent,
        center: fromLonLat(mapStore.center),
        zoom: mapStore.zoom,
        minZoom: 1,
        maxZoom: 20,
      }),
    );

    // Configure tiles
    const tileLayer = new TileLayer({
      source: new XYZ({
        url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_ShadedRelief_Bathymetry/default/2013-12-01/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpg',
        wrapX: true,
      }),
    });
    map.addLayer(tileLayer);

    // Configure markers
    markersLayer = new VectorLayer({
      source: new VectorSource(),
    });
    map.addLayer(markersLayer);

    // Configure position tracking
    map.on('moveend', () => {
      const view = map?.getView();
      if (!view) {
        return;
      }

      const center = view.getCenter();
      if (center) {
        mapStore.center = toLonLat(center) as [number, number];
      }

      const zoom = view.getZoom();
      if (typeof zoom === 'number') {
        mapStore.zoom = zoom;
      }
    });
  };

  const destroyMap = () => {
    if (!map) {
      return;
    }

    map.dispose();
    map = null;
  };

  /* Object visuals ///////////////////////////////////////////////////////////////////////////////////////////////// */

  const buildMarkerStyle = () => {
    return new Style({
      image: new CircleStyle({
        radius: 6,
        fill: new Fill({ color: markerColor }),
      }),
    });
  };

  /* Selection ////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const selectedSpaceObjects = computed(() => lookupCachedSpaceObjects(Array.from(applicationStore.selectedNoradIds)));

  const updateMarkers = (date: Date) => {
    if (!markersLayer) {
      return;
    }

    const source = markersLayer.getSource();
    if (!source) {
      return;
    }

    source.clear();
    map?.getOverlays().clear();

    selectedSpaceObjects.value.forEach((spaceObject) => {
      const marker = getSpaceObjectMarker(spaceObject, getCachedSpaceObjectTle, date);
      if (!marker) {
        return;
      }

      const feature = new Feature<Point>();
      feature.setId(spaceObject.noradId);
      feature.setGeometry(new Point(fromLonLat([marker.longitude, marker.latitude])));
      feature.setStyle(buildMarkerStyle());
      source.addFeature(feature);

      for (let i = 0; i < horizontalLimitFactor; i++) {
        const longitudeOffset = (i - Math.floor(horizontalLimitFactor / 2)) * 360;
        const adjustedLongitude = marker.longitude + longitudeOffset;
        const overlay = new Overlay({
          element: createLabelElement(marker.name),
          positioning: 'center-center',
          stopEvent: false,
        });
        overlay.setPosition(fromLonLat([adjustedLongitude, marker.latitude]));
        map?.addOverlay(overlay);
      }
    });
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

  const zoom = (getZoomLevel: (view: View) => number | null | undefined, center: boolean = false) => {
    const currentView = map?.getView();
    if (!currentView) {
      return;
    }

    const zoomLevel = getZoomLevel(currentView);
    if (typeof zoomLevel !== 'number') {
      return;
    }

    currentView.animate({
      center: center ? [0, 0] : undefined,
      zoom: zoomLevel,
      duration: 500,
      easing: easeOut,
    });
  };

  const fitToScreen = () => {
    const getZoomLevel = (view: View) => {
      return view.getConstrainedZoom(view.getMinZoom());
    };
    zoom(getZoomLevel, true);
  };

  const zoomIn = () => {
    const getZoomLevel = (view: View) => {
      const currentZoom = view.getZoom();
      if (typeof currentZoom !== 'number') {
        return null;
      }
      return view.getConstrainedZoom(currentZoom + 1);
    };
    zoom(getZoomLevel);
  };

  const zoomOut = () => {
    const getZoomLevel = (view: View) => {
      const currentZoom = view.getZoom();
      if (typeof currentZoom !== 'number') {
        return null;
      }
      return view.getConstrainedZoom(currentZoom - 1);
    };
    zoom(getZoomLevel);
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

  /* Lifecycle ////////////////////////////////////////////////////////////////////////////////////////////////////// */

  onMounted(() => {
    initializeMap();
    registerEventHandlers();
    startAnimation();
  });

  onBeforeUnmount(() => {
    stopAnimation();
    unregisterEventHandlers();
    destroyMap();
  });
</script>

<template>
  <div class="map-view">
    <div
      ref="mapElement"
      class="map"
    ></div>
  </div>
</template>

<style scoped>
  .map {
    width: 100%;
    height: 100%;
    cursor: grab;
  }
</style>
