<script setup lang="ts">
  /* Imports //////////////////////////////////////////////////////////////////////////////////////////////////////// */

  import { type Flyover } from '@/utilities/application.js';

  /* Props ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

  export interface FlyoverListItemProps {
    flyover: Flyover;
  }

  const props = defineProps<FlyoverListItemProps>();

  /* Format ///////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (start: Date, end: Date) => {
    const diffMs = end.getTime() - start.getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) {
      return '<1 min';
    }
    return `${minutes} min`;
  };

  const formatDegrees = (value: number) => `${value.toFixed(0)}°`;

  const formatDistance = (value: number) => `${value.toFixed(0)} km`;
</script>

<template>
  <div class="flyover">
    <div class="header">
      <span class="date">{{ formatDate(flyover.startDate) }}</span>
      <span class="duration">{{ formatDuration(flyover.startDate, flyover.endDate) }}</span>
    </div>
    <div class="time">{{ formatTime(flyover.startDate) }} – {{ formatTime(flyover.endDate) }}</div>
    <div class="grid">
      <div class="item">
        <span class="label">Elevation</span>
        <span class="value">{{ formatDegrees(flyover.minElevation) }} – {{ formatDegrees(flyover.maxElevation) }}</span>
      </div>
      <div class="item">
        <span class="label">Azimuth</span>
        <span class="value">{{ formatDegrees(flyover.startAzimuth) }} – {{ formatDegrees(flyover.endAzimuth) }}</span>
      </div>
      <div class="item">
        <span class="label">Min distance</span>
        <span class="value">{{ formatDistance(flyover.minDistance) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .flyover {
    padding: var(--ja-spacing-small);
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--ja-spacing-small);
  }

  .date {
    font-size: var(--ja-font-size-small);
    font-weight: var(--ja-font-weight-semibold);
    color: var(--ja-color-neutral-800);
  }

  .duration {
    font-variant: tabular-nums;
    font-size: var(--ja-font-size-x-small);
    color: var(--ja-color-neutral-500);
  }

  .time {
    font-size: var(--ja-font-size-x-small);
    color: var(--ja-color-neutral-600);
    padding-bottom: var(--ja-spacing-x-small);
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
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
    line-height: var(--ja-line-height-dense);
    color: var(--ja-color-neutral-800);
  }
</style>
