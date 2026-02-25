<script setup lang="ts">
  /* Imports //////////////////////////////////////////////////////////////////////////////////////////////////////// */

  import { PhArrowSquareOut, PhQuestion, PhX } from '@phosphor-icons/vue';
  import {
    degreesLat,
    degreesLong,
    eciToGeodetic,
    gstime,
    json2satrec,
    type Kilometer,
    type KilometerPerSecond,
    propagate,
  } from 'satellite.js';
  import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';

  import {
    flyoverProjectionDurationDays,
    getFlyovers,
    type SpaceObject,
    spaceObjectMarkerFocusColor,
  } from '@/utilities/application.js';

  import { useApplicationStore } from '@/stores/variants/application.js';

  import { useSpaceObjectCache } from '@/composables/useSpaceObjectCache.js';

  import FlyoversDialog from '@/components/common/FlyoversDialog.vue';

  /* Props ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

  export interface SpaceObjectCardProps {
    noradId: number;
  }

  const props = defineProps<SpaceObjectCardProps>();

  /* Emits ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const emit = defineEmits<{
    close: [];
  }>();

  /* Stores ///////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const applicationStore = useApplicationStore();

  /* Lookup ///////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const { lookupCachedSpaceObject } = useSpaceObjectCache();

  const spaceObject = ref<SpaceObject | null>(null);

  watch(
    () => props.noradId,
    (newNoradId) => {
      spaceObject.value = lookupCachedSpaceObject(newNoradId);
    },
    {
      immediate: true,
    },
  );

  /* OMM derivation ///////////////////////////////////////////////////////////////////////////////////////////////// */

  const propagationDate = ref(new Date());
  let propagationInterval: number | null = null;

  onMounted(() => {
    propagationInterval = setInterval(() => {
      propagationDate.value = new Date();
    }, 1000);
  });

  onBeforeUnmount(() => {
    if (propagationInterval !== null) {
      clearInterval(propagationInterval);
    }
  });

  const satrec = computed(() => {
    if (!spaceObject.value) {
      return null;
    }

    return json2satrec(spaceObject.value.omm);
  });

  const ommDerivedData = reactive<{
    longitude: number | null;
    latitude: number | null;
    altitude: Kilometer | null;
    velocity: KilometerPerSecond | null;
  }>({
    longitude: null,
    latitude: null,
    altitude: null,
    velocity: null,
  });

  watch(
    [propagationDate, satrec],
    () => {
      if (!satrec.value) {
        return;
      }

      const propagatedOmm = propagate(satrec.value, propagationDate.value);
      if (!propagatedOmm) {
        ommDerivedData.longitude = null;
        ommDerivedData.latitude = null;
        ommDerivedData.altitude = null;
        ommDerivedData.velocity = null;
        return;
      }

      const geodeticPosition = eciToGeodetic(propagatedOmm.position, gstime(propagationDate.value));
      ommDerivedData.longitude = degreesLong(geodeticPosition.longitude);
      ommDerivedData.latitude = degreesLat(geodeticPosition.latitude);
      ommDerivedData.altitude = geodeticPosition.height;
      ommDerivedData.velocity = Math.sqrt(
        propagatedOmm.velocity.x ** 2 + propagatedOmm.velocity.y ** 2 + propagatedOmm.velocity.z ** 2,
      );
    },
    {
      immediate: true,
    },
  );

  /* Flyover //////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const showFlyoversDialog = ref(false);

  const toggleFlyoversDialog = () => {
    showFlyoversDialog.value = !showFlyoversDialog.value;
  };

  const flyovers = computed(() => {
    if (!spaceObject.value || !applicationStore.userPosition) {
      return [];
    }

    return getFlyovers(spaceObject.value, applicationStore.userPosition);
  });

  const flyoversTooltipContent = computed(() => {
    return `Projecting ${flyovers.value.length} flyovers in the next ${flyoverProjectionDurationDays} days`;
  });

  /* Link /////////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const link = computed(() => {
    let searchTerm = `NORAD ID ${props.noradId}`;
    if (spaceObject.value) {
      searchTerm += ` ${spaceObject.value.name}`;
    }
    return `https://www.google.com/search?q=${encodeURIComponent(searchTerm)}`;
  });

  /* Format ///////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const defaultText = 'Unknown';

  const isBlank = (value: unknown) => {
    return value === null || value === undefined || value === '';
  };

  const formatText = (value: string | null | undefined) => {
    if (isBlank(value)) {
      return defaultText;
    }

    return value;
  };

  const formatNumber = (value: number | null | undefined, digits = 2, unit?: string) => {
    if (isBlank(value)) {
      return defaultText;
    }

    const parsedValue = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(parsedValue)) {
      return defaultText;
    }

    const formatted = parsedValue.toFixed(digits);
    return unit ? `${formatted} ${unit}` : formatted;
  };

  const formatLatitude = (value: number | null) => {
    if (typeof value !== 'number') {
      return defaultText;
    }

    const unit = value > 0 ? 'N' : 'S';
    return `${Math.abs(value).toFixed(0)}° ${unit}`;
  };

  const formatLongitude = (value: number | null) => {
    if (typeof value !== 'number') {
      return defaultText;
    }

    const unit = value > 0 ? 'E' : 'W';
    return `${Math.abs(value).toFixed(0)}° ${unit}`;
  };
</script>

<template>
  <div
    v-if="spaceObject"
    class="space-object-card"
  >
    <button
      class="close"
      @click="emit('close')"
    >
      <PhX weight="bold" />
    </button>

    <Transition
      name="fade"
      mode="out-in"
    >
      <div
        :key="spaceObject.noradId"
        class="content"
      >
        <div class="header">
          <div class="title">{{ spaceObject.name }}</div>
          <a
            v-tooltip.top="'Learn more'"
            class="link"
            :href="link"
            target="_blank"
            rel="noopener noreferrer"
          >
            <PhArrowSquareOut weight="bold" />
          </a>
        </div>
        <div class="grid">
          <div class="item">
            <span class="label">Norad ID</span>
            <span class="value">{{ spaceObject.noradId }}</span>
          </div>
          <div class="item">
            <span class="label">Object ID</span>
            <span class="value">{{ formatText(spaceObject.objectId) }}</span>
          </div>
          <div class="item">
            <span class="label">Class</span>
            <span class="value">{{ formatText(spaceObject.classification) }}</span>
          </div>
          <div class="item">
            <span class="label">Mean motion</span>
            <span class="value">{{ formatNumber(spaceObject.meanMotion, 2, 'rev/day') }}</span>
          </div>
          <div class="item">
            <span class="label">Position</span>
            <span class="value">
              {{ formatLatitude(ommDerivedData.latitude) }}, {{ formatLongitude(ommDerivedData.longitude) }}
            </span>
          </div>
          <div class="item">
            <span class="label">Altitude</span>
            <span class="value">{{ formatNumber(ommDerivedData.altitude, 0, 'km') }}</span>
          </div>
          <div class="item">
            <span class="label">Velocity</span>
            <span class="value">{{ formatNumber(ommDerivedData.velocity, 2, 'km/s') }}</span>
          </div>
          <div class="item">
            <span class="label">Flyovers</span>
            <span
              v-if="applicationStore.userPosition"
              class="value"
            >
              <button
                v-tooltip.top="flyoversTooltipContent"
                @click="toggleFlyoversDialog"
              >
                {{ flyovers.length }} projected
              </button>
            </span>
            <span
              v-else
              class="value"
            >
              <span>{{ defaultText }}</span>
              <PhQuestion
                v-tooltip="{
                  content: 'Enable location services to see flyovers',
                  placement: 'top',
                  triggers: ['hover', 'click'],
                }"
              />
            </span>
          </div>
        </div>
      </div>
    </Transition>

    <FlyoversDialog
      v-model="showFlyoversDialog"
      :space-object="spaceObject"
      :flyovers="flyovers"
    />
  </div>
</template>

<style scoped>
  .space-object-card {
    --space-object-card-columns-count: 4;

    position: relative;
    width: 480px;
    padding: var(--ja-spacing-small) var(--ja-spacing-large) var(--ja-spacing-large) var(--ja-spacing-large);
    border: 3px solid v-bind('spaceObjectMarkerFocusColor');
    border-radius: var(--ja-border-radius-x-large);
    background-color: var(--ja-control-background-color);
    box-shadow: var(--ja-control-box-shadow);
  }

  .close {
    position: absolute;
    top: var(--ja-spacing-small);
    right: var(--ja-spacing-small);
    padding: var(--ja-spacing-2x-small);
    border: none;
    border-radius: var(--ja-border-radius-circle);
    background-color: transparent;
    color: var(--ja-control-color);
    font-size: var(--ja-font-size-medium);

    &:hover {
      background-color: var(--ja-control-background-color-hover);
      color: var(--ja-color-neutral-500);
    }
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: var(--ja-spacing-x-small);
    padding: 0 var(--ja-spacing-3x-large) var(--ja-spacing-x-small) 0;
  }

  .title {
    font-size: var(--ja-font-size-large);
    font-weight: var(--ja-font-weight-bold);
    color: var(--ja-color-neutral-800);
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }

  .link {
    flex: 0 0 auto;
    margin-bottom: var(--ja-spacing-3x-small);
    padding: var(--ja-spacing-3x-small);
    font-size: var(--ja-font-size-large);
    color: var(--ja-color-primary-600);

    &:hover {
      color: var(--ja-color-primary-500);
    }
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(var(--space-object-card-columns-count), auto);
    gap: var(--ja-spacing-small) 0;
  }

  .item {
    display: flex;
    flex-direction: column;
  }

  .label {
    font-size: var(--ja-font-size-x-small);
    letter-spacing: var(--ja-letter-spacing-loose);
    text-transform: uppercase;
    color: var(--ja-color-neutral-500);
  }

  .value {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: var(--ja-spacing-2x-small);
    font-size: var(--ja-font-size-small);
    line-height: var(--ja-line-height-dense);
    color: var(--ja-color-neutral-800);

    button {
      margin: 0;
      padding: 0;
      outline-offset: 2px;
      border: none;
      background-color: transparent;
      font-weight: var(--ja-font-weight-semibold);
      color: var(--ja-color-primary-500);
      cursor: pointer;
    }
  }

  @media (max-width: 460px) {
    .space-object-card {
      --space-object-card-columns-count: 2;

      width: 260px;
      padding-left: var(--ja-spacing-small);
      padding-right: var(--ja-spacing-small);
    }
  }

  @media (min-width: 461px) and (max-width: 580px) {
    .space-object-card {
      --space-object-card-columns-count: 3;

      width: 360px;
      padding-left: var(--ja-spacing-small);
      padding-right: var(--ja-spacing-small);
    }
  }

  @media (max-height: 400px) {
    .space-object-card {
      padding-top: var(--ja-spacing-2x-small);
      padding-bottom: var(--ja-spacing-x-small);
    }

    .close {
      top: var(--ja-spacing-x-small);
    }

    .header {
      padding-bottom: 0;
    }

    .grid {
      gap: var(--ja-spacing-x-small) 0;
    }
  }

  @media (min-height: 401px) and (max-height: 600px) {
    .space-object-card {
      padding-top: var(--ja-spacing-x-small);
      padding-bottom: var(--ja-spacing-small);
    }

    .close {
      top: var(--ja-spacing-small);
    }

    .header {
      padding-bottom: 0;
    }

    .grid {
      gap: var(--ja-spacing-x-small) 0;
    }
  }
</style>
