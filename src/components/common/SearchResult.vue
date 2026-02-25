<script setup lang="ts">
  /* Imports //////////////////////////////////////////////////////////////////////////////////////////////////////// */

  import { PhCheck } from '@phosphor-icons/vue';

  import { type SpaceObject, spaceObjectMarkerFocusColor } from '@/utilities/application.js';

  import { useApplicationStore } from '@/stores/variants/application.js';

  /* Stores ///////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const applicationStore = useApplicationStore();

  /* Props ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

  export interface SearchResultProps {
    spaceObject: SpaceObject;
  }

  const props = defineProps<SearchResultProps>();
</script>

<template>
  <button class="search-result">
    <PhCheck
      :class="[
        'icon',
        {
          selected: applicationStore.selectedNoradIds.has(spaceObject.noradId),
          focused: applicationStore.focusedNoradId === spaceObject.noradId,
        },
      ]"
      weight="bold"
    />
    <div class="header">
      <span class="name">{{ spaceObject.name }}</span>
      <span class="id">NORAD {{ spaceObject.noradId }}</span>
    </div>
    <div class="meta">
      <span class="tag">Class {{ spaceObject.classification }}</span>
      <span class="tag">ID {{ spaceObject.objectId }}</span>
    </div>
  </button>
</template>

<style scoped>
  .search-result {
    position: relative;
    display: flex;
    flex-direction: column;
    scroll-margin: var(--ja-spacing-medium) 0 var(--ja-spacing-4x-large) 0;
    padding: var(--ja-spacing-2x-small) var(--ja-spacing-medium) var(--ja-spacing-x-small) var(--ja-spacing-3x-large);
    width: 100%;
    border: var(--ja-control-outline);
    border-color: transparent;
    background-color: var(--ja-control-background-color);
    text-align: left;
    cursor: pointer;

    &:hover {
      background-color: var(--ja-control-background-color-hover);
    }

    &:focus-visible {
      outline: none;
      border: var(--ja-control-outline);
    }
  }

  .icon {
    position: absolute;
    left: var(--ja-spacing-medium);
    top: 50%;
    transform: translateY(-50%);
    border: 1px solid var(--ja-color-neutral-400);
    border-radius: var(--ja-border-radius-small);
    background-color: transparent;
    color: transparent;
    font-size: var(--ja-font-size-medium);
    transition: all var(--ja-transition-fast) ease-in-out;

    &.selected,
    &.focused {
      color: var(--ja-color-neutral-0);
    }

    &.selected {
      border-color: var(--ja-color-green-500);
      background-color: var(--ja-color-green-500);
    }

    &.focused {
      border-color: v-bind('spaceObjectMarkerFocusColor');
      background-color: v-bind('spaceObjectMarkerFocusColor');
    }
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--ja-spacing-small);
    width: 100%;
    margin-bottom: var(--ja-spacing-3x-small);
  }

  .name {
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    color: var(--ja-color-neutral-950);
  }

  .id {
    white-space: nowrap;
    font-size: var(--ja-font-size-small);
    color: var(--ja-color-neutral-600);
  }

  .meta {
    display: flex;
    align-items: center;
    gap: var(--ja-spacing-x-small);
  }

  .tag {
    padding: 0 var(--ja-spacing-x-small);
    border-radius: var(--ja-border-radius-pill);
    background: var(--ja-color-blue-100);
    font-size: var(--ja-font-size-x-small);
    color: var(--ja-color-neutral-700);
  }
</style>
