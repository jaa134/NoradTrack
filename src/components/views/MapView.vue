<script setup lang="ts">
  /* Imports //////////////////////////////////////////////////////////////////////////////////////////////////////// */

  import { Map as OlMap } from 'ol';
  import { defaults as getDefaultInteractions } from 'ol/interaction.js';
  import { Tile as TileLayer } from 'ol/layer.js';
  import { fromLonLat, get as getProjection } from 'ol/proj.js';
  import { XYZ } from 'ol/source.js';
  import View from 'ol/View.js';
  import { onBeforeUnmount, onMounted, ref } from 'vue';

  /* Elements /////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const mapElement = ref<HTMLDivElement>();

  /* Map //////////////////////////////////////////////////////////////////////////////////////////////////////////// */

  let map: OlMap | null = null;

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
      const horizontalLimit = extent[2]! * 1000;
      extent = [-horizontalLimit, extent[1]!, horizontalLimit, extent[3]!];
    }

    // Configure POV
    map.setView(
      new View({
        multiWorld: true,
        projection,
        extent,
        center: fromLonLat([0, 0]),
        zoom: 3,
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
  };

  const destroyMap = () => {
    if (!map) {
      return;
    }

    map.dispose();
    map = null;
  };

  /* Lifecycle ////////////////////////////////////////////////////////////////////////////////////////////////////// */

  onMounted(() => {
    initializeMap();
  });

  onBeforeUnmount(() => {
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
