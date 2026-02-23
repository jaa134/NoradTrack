<script setup lang="ts">
  /* Imports //////////////////////////////////////////////////////////////////////////////////////////////////////// */

  import { PhArrowSquareOut, PhX } from '@phosphor-icons/vue';
  import { computed, ref, watch } from 'vue';

  import { SpaceObject, spaceObjectMarkerFocusColor } from '@/utilities/application.js';

  import { useSpaceObjectCache } from '@/composables/useSpaceObjectCache.js';

  /* Props ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

  export interface SpaceObjectCardProps {
    noradId: number;
  }

  const props = defineProps<SpaceObjectCardProps>();

  /* Emits ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const emit = defineEmits<{
    close: [];
  }>();

  /* Lookup ///////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const spaceObject = ref<SpaceObject | null>(null);

  const { lookupCachedSpaceObject } = useSpaceObjectCache();

  watch(
    () => props.noradId,
    (newNoradId) => {
      spaceObject.value = lookupCachedSpaceObject(newNoradId);
    },
    {
      immediate: true,
    },
  );

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

  const isBlank = (value: unknown) => value === null || value === undefined || value === '';

  const formatText = (value: unknown) => (isBlank(value) ? defaultText : String(value));

  const formatNumber = (value: unknown, digits = 2, unit?: string) => {
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

  const formatEpoch = (value: unknown) => {
    if (isBlank(value)) {
      return defaultText;
    }

    const parsed = value instanceof Date ? value : new Date(String(value));
    if (Number.isNaN(parsed.getTime())) {
      return formatText(value);
    }

    return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
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
            <span class="value">{{ formatText(spaceObject.info.objectId) }}</span>
          </div>
          <div class="item">
            <span class="label">Class</span>
            <span class="value">{{ formatText(spaceObject.info.classification) }}</span>
          </div>
          <div class="item">
            <span class="label">Epoch</span>
            <span class="value">{{ formatEpoch(spaceObject.info.epoch) }}</span>
          </div>
          <div class="item">
            <span class="label">Mean motion</span>
            <span class="value">{{ formatNumber(spaceObject.info.meanMotion, 2, 'rev/day') }}</span>
          </div>
          <div class="item">
            <span class="label">Inclination</span>
            <span class="value">{{ formatNumber(spaceObject.info.inclination, 3, 'deg') }}</span>
          </div>
          <div class="item">
            <span class="label">Eccentricity</span>
            <span class="value">{{ formatNumber(spaceObject.info.eccentricity, 6) }}</span>
          </div>
          <div class="item">
            <span class="label">Rev at epoch</span>
            <span class="value">{{ formatNumber(spaceObject.info.revAtEpoch, 0) }}</span>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
  .space-object-card {
    --space-object-card-columns-count: 4;

    position: relative;
    width: 600px;
    padding: var(--ja-spacing-medium) var(--ja-spacing-large) var(--ja-spacing-large) var(--ja-spacing-large);
    border: 3px solid v-bind('spaceObjectMarkerFocusColor');
    border-radius: var(--ja-border-radius-x-large);
    background-color: var(--ja-control-background-color);
    box-shadow: var(--ja-control-box-shadow);
  }

  .close {
    position: absolute;
    top: var(--ja-spacing-small);
    right: var(--ja-spacing-small);
    padding: var(--ja-spacing-x-small);
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
    font-size: var(--ja-font-size-small);
    color: var(--ja-color-neutral-800);
    line-height: var(--ja-line-height-dense);
  }

  @media (max-width: 500px) {
    .space-object-card {
      --space-object-card-columns-count: 2;

      width: 275px;
      padding: var(--ja-spacing-x-small) var(--ja-spacing-small) var(--ja-spacing-medium) var(--ja-spacing-small);
    }

    .close {
      top: var(--ja-spacing-x-small);
      right: var(--ja-spacing-x-small);
    }

    .header {
      padding-bottom: var(--ja-spacing-2x-small);
    }

    .grid {
      gap: var(--ja-spacing-x-small) 0;
    }
  }

  @media (min-width: 501px) and (max-width: 725px) {
    .space-object-card {
      --space-object-card-columns-count: 3;

      width: 400px;
      padding: var(--ja-spacing-small) var(--ja-spacing-medium) var(--ja-spacing-medium) var(--ja-spacing-medium);
    }

    .close {
      top: var(--ja-spacing-x-small);
      right: var(--ja-spacing-x-small);
    }

    .header {
      padding-bottom: var(--ja-spacing-x-small);
    }

    .grid {
      gap: var(--ja-spacing-x-small) 0;
    }
  }
</style>
