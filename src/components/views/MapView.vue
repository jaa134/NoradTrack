<script setup lang="ts">
  /* Imports //////////////////////////////////////////////////////////////////////////////////////////////////////// */

  import type { FeatureCollection } from 'geojson';
  import { Map as OlMap } from 'ol';
  import { easeOut } from 'ol/easing.js';
  import Feature from 'ol/Feature.js';
  import { GeoJSON as GeoJsonFormatter } from 'ol/format.js';
  import { type MultiPolygon } from 'ol/geom.js';
  import Point from 'ol/geom/Point.js';
  import { defaults as getDefaultInteractions } from 'ol/interaction.js';
  import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer.js';
  import Overlay from 'ol/Overlay.js';
  import { fromLonLat, get as getProjection, toLonLat } from 'ol/proj.js';
  import { Vector as VectorSource } from 'ol/source.js';
  import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style.js';
  import View from 'ol/View.js';
  import { onBeforeUnmount, onMounted, ref, toRaw, watch } from 'vue';

  import {
    countryGeoJsonColor,
    createLabelElement,
    eventHub,
    EventType,
    getSpaceObjectMarker,
    getUserPositionMarker,
    type Marker,
    type SpaceObjectMarker,
    spaceObjectMarkerColor,
    spaceObjectMarkerFocusColor,
    userPositionMarkerColor,
  } from '@/utilities/application.js';
  import { horizontalLimitFactor, mapSkinSourceMap } from '@/utilities/map.js';

  import { useApplicationStore } from '@/stores/variants/application.js';
  import { useMapStore } from '@/stores/variants/map.js';

  import { useCountriesGeoJson } from '@/composables/useCountriesGeoJson.js';
  import { useSpaceObjectCache } from '@/composables/useSpaceObjectCache.js';

  /* Stores ///////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const applicationStore = useApplicationStore();

  const mapStore = useMapStore();

  /* Cache ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const { lookupCachedSpaceObject } = useSpaceObjectCache();

  /* Elements /////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const mapElement = ref<HTMLDivElement>();

  /* Map //////////////////////////////////////////////////////////////////////////////////////////////////////////// */

  let map: OlMap | null = null;

  const tileLayer = new TileLayer({ source: mapSkinSourceMap[mapStore.skin] });

  const countryGeoJsonVectorSource = new VectorSource<Feature<MultiPolygon>>();
  const countryGeoJsonLayer = new VectorLayer({ source: countryGeoJsonVectorSource });

  const markersVectorSource = new VectorSource<Feature<Point>>();
  const markersLayer = new VectorLayer({ source: markersVectorSource });

  const initializeMap = () => {
    if (!mapElement.value || map) {
      return;
    }

    // Create map instance
    map = new OlMap({
      target: mapElement.value,
      controls: [],
      interactions: getDefaultInteractions(),
      pixelRatio: 1,
    });

    // Configure scene
    map.setSize([mapElement.value.clientWidth, mapElement.value.clientHeight]);

    // Configure projection extent - allow horizontal panning beyond the projection extent
    const projection = getProjection('EPSG:3857') ?? undefined;
    let extent = projection?.getExtent();
    if (extent) {
      const horizontalLimit = extent[2]! * horizontalLimitFactor; // eslint-disable-line @typescript-eslint/no-non-null-assertion
      extent = [-horizontalLimit, extent[1]!, horizontalLimit, extent[3]!]; // eslint-disable-line @typescript-eslint/no-non-null-assertion
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

    // Configure layers
    map.addLayer(tileLayer);
    map.addLayer(countryGeoJsonLayer);
    map.addLayer(markersLayer);

    // Configure object focus
    map.on('singleclick', (event) => {
      if (!map) {
        return;
      }

      const feature = map.forEachFeatureAtPixel(event.pixel, (feature) => feature);
      if (!feature?.get('interactive')) {
        return;
      }

      focusNoradId(Number(feature.getId()));
    });

    // Configure cursor style
    map.on('pointermove', (event) => {
      if (!map) {
        return;
      }

      const feature = map.forEachFeatureAtPixel(event.pixel, (feature) => feature);
      if (!feature?.get('interactive')) {
        map.getTargetElement().style.cursor = 'grab';
        return;
      }

      map.getTargetElement().style.cursor = 'pointer';
    });

    // Configure position tracking
    map.on('moveend', () => {
      if (!map) {
        return;
      }

      const view = map.getView();

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

  const buildUserPositionMarkerVisuals = () => {
    const userPositionStyle = new Style({
      image: new CircleStyle({
        radius: 6,
        fill: new Fill({ color: userPositionMarkerColor }),
      }),
    });

    return [userPositionStyle];
  };

  const buildSpaceObjectMarkerVisuals = (marker: SpaceObjectMarker) => {
    const focused = applicationStore.focusedNoradId === marker.noradId;

    const spaceObjectStyle = new Style({
      image: new CircleStyle({
        radius: 6,
        fill: new Fill({ color: focused ? spaceObjectMarkerFocusColor : spaceObjectMarkerColor }),
      }),
    });

    const clickStyle = new Style({
      image: new CircleStyle({
        radius: 30,
        fill: new Fill({ color: 'rgba(0, 0, 0, 0)' }),
      }),
    });

    return [spaceObjectStyle, clickStyle];
  };

  /* Update markers ///////////////////////////////////////////////////////////////////////////////////////////////// */

  const createFeatureOverlays = (marker: Marker) => {
    const overlays = [];

    for (let i = 0; i < horizontalLimitFactor; i++) {
      const longitudeOffset = (i - Math.floor(horizontalLimitFactor / 2)) * 360;
      const adjustedLongitude = marker.longitude + longitudeOffset;
      const overlay = new Overlay({
        element: createLabelElement(marker.label),
        positioning: 'center-center',
        stopEvent: false,
      });
      overlay.setPosition(fromLonLat([adjustedLongitude, marker.latitude]));
      overlays.push(overlay);
    }

    return overlays;
  };

  const updateMarkers = (date: Date) => {
    if (!map) {
      return;
    }

    markersVectorSource.clear();
    map.getOverlays().clear();

    if (applicationStore.showUserPosition && applicationStore.userPosition) {
      const marker = getUserPositionMarker(applicationStore.userPosition);

      const geometry = new Point(fromLonLat([marker.longitude, marker.latitude]));

      const feature = new Feature<Point>(geometry);
      feature.setId('user-position');
      feature.setStyle(buildUserPositionMarkerVisuals());
      markersVectorSource.addFeature(feature);

      const overlays = createFeatureOverlays(marker);
      for (const overlay of overlays) {
        map.addOverlay(overlay);
      }
    }

    for (const noradId of applicationStore.selectedNoradIds) {
      const spaceObject = lookupCachedSpaceObject(noradId);
      if (!spaceObject) {
        continue;
      }

      const marker = getSpaceObjectMarker(spaceObject, date);
      if (!marker) {
        continue;
      }

      const geometry = new Point(fromLonLat([marker.longitude, marker.latitude]));

      const feature = new Feature<Point>(geometry);
      feature.setId(spaceObject.noradId);
      feature.set('interactive', true);
      feature.setStyle(buildSpaceObjectMarkerVisuals(marker));
      markersVectorSource.addFeature(feature);

      const overlays = createFeatureOverlays(marker);
      for (const overlay of overlays) {
        map.addOverlay(overlay);
      }
    }
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

  const countryStyle = new Style({
    stroke: new Stroke({
      color: countryGeoJsonColor,
      width: 1,
    }),
  });

  const updateCountriesGeoJson = () => {
    if (!map) {
      return;
    }

    countryGeoJsonVectorSource.clear();

    if (!countriesGeoJson.value || !applicationStore.showCountryGeoJson) {
      return;
    }

    const featureCollection = structuredClone(toRaw(countriesGeoJson.value)) as FeatureCollection;
    const features = new GeoJsonFormatter<Feature<MultiPolygon>>().readFeatures(featureCollection, {
      dataProjection: 'EPSG:4326',
      featureProjection: map.getView().getProjection(),
    });

    for (const feature of features) {
      feature.setStyle(countryStyle);
      countryGeoJsonVectorSource.addFeature(feature);
    }
  };

  watch([countriesGeoJson, () => applicationStore.showCountryGeoJson], () => {
    updateCountriesGeoJson();
  });

  /* Skins ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

  watch(
    () => mapStore.skin,
    (newSkin) => {
      tileLayer.setSource(mapSkinSourceMap[newSkin]);
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

  const zoomStep = 1;

  const zoom = (getZoomLevel: (view: View) => number | null | undefined, center = false) => {
    if (!map) {
      return;
    }

    const currentView = map.getView();

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
      return view.getConstrainedZoom(currentZoom + zoomStep);
    };
    zoom(getZoomLevel);
  };

  const zoomOut = () => {
    const getZoomLevel = (view: View) => {
      const currentZoom = view.getZoom();
      if (typeof currentZoom !== 'number') {
        return null;
      }
      return view.getConstrainedZoom(currentZoom - zoomStep);
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

  /* Resize ///////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const resizeObserver = new ResizeObserver(() => {
    if (!map || !mapElement.value) {
      return;
    }

    map.setSize([mapElement.value.clientWidth, mapElement.value.clientHeight]);
  });

  const watchResize = () => {
    if (!mapElement.value) {
      return;
    }

    resizeObserver.observe(mapElement.value);
  };

  const unwatchResize = () => {
    resizeObserver.disconnect();
  };

  /* Lifecycle ////////////////////////////////////////////////////////////////////////////////////////////////////// */

  onMounted(() => {
    initializeMap();
    registerEventHandlers();
    watchResize();
    startAnimation();
    updateCountriesGeoJson();
  });

  onBeforeUnmount(() => {
    stopAnimation();
    unwatchResize();
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
