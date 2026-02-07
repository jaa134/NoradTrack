<script setup lang="ts">
  /* Imports //////////////////////////////////////////////////////////////////////////////////////////////////////// */

  import { ref } from 'vue';

  import ControlGroup from '@/components/common/ControlGroup.vue';
  import SearchControl from '@/components/common/SearchControl.vue';
  import { useSpaceObjectSearch } from '@/composables/useSpaceObjectSearch.js';

  /* Search ///////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const searchText = ref('YAM-');

  const { results, isLoading } = useSpaceObjectSearch(searchText);

  /* Selection ////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const selectedNoradIds = ref(new Set<number>());

  const toggleNoradId = (noradId: number) => {
    if (selectedNoradIds.value.has(noradId)) {
      selectedNoradIds.value.delete(noradId);
    } else {
      selectedNoradIds.value.add(noradId);
    }
  };

  const clearSelectedNoradIds = () => {
    selectedNoradIds.value.clear();
  };
</script>

<template>
  <div class="object-selection-controls">
    <ControlGroup>
      <SearchControl
        v-model="searchText"
        :loading="isLoading"
        placeholder="Search objects"
      />
    </ControlGroup>

    <div class="loading-list">
      <div
        v-if="searchText && !results.length"
        class="empty-message"
      >
        No results found.
      </div>
      <button
        v-for="result in results"
        :key="result.noradId"
        :class="['result', { selected: selectedNoradIds.has(result.noradId) }]"
        @click="toggleNoradId(result.noradId)"
      >
        <div class="result-header">
          <span class="result-name">{{ result.name }}</span>
          <span class="result-id">NORAD {{ result.noradId }}</span>
        </div>
        <div class="result-meta">
          <span
            v-if="result.info.classification"
            class="tag"
          >
            Class {{ result.info.classification }}
          </span>
          <span
            v-if="result.info.objectId"
            class="tag"
          >
            ID {{ result.info.objectId }}
          </span>
        </div>
      </button>
      <button
        v-if="results.length && selectedNoradIds.size"
        class="clear"
        @click="clearSelectedNoradIds"
      >
        Clear selected
      </button>
    </div>
  </div>
</template>

<style scoped>
  .object-selection-controls {
    --control-width: 380px;
    --list-border-radius: var(--ja-border-radius-large);

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    gap: var(--ja-spacing-small);
    pointer-events: none;
  }

  .control-group,
  .loading-list {
    pointer-events: auto;
  }

  .control-group {
    width: var(--control-width);
  }

  .loading-list {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    gap: 1px;
    width: calc(var(--control-width) - var(--ja-spacing-large));
    border-radius: var(--list-border-radius);
    background-color: var(--ja-color-neutral-100);
    overflow-y: auto;
  }

  .empty-message {
    width: 100%;
    padding: var(--ja-spacing-medium);
    text-align: center;
    font-size: var(--ja-font-size-small);
    color: var(--ja-color-neutral-500);
  }

  .result {
    display: flex;
    flex-direction: column;
    gap: var(--ja-spacing-2x-small);
    padding: var(--ja-spacing-small) var(--ja-spacing-medium);
    width: 100%;
    border: var(--ja-control-outline);
    border-color: transparent;
    background-color: var(--ja-control-background-color);
    text-align: left;
    cursor: pointer;

    &:first-child {
      border-top-left-radius: var(--list-border-radius);
      border-top-right-radius: var(--list-border-radius);
    }

    &:last-child {
      border-bottom-left-radius: var(--list-border-radius);
      border-bottom-right-radius: var(--list-border-radius);
    }

    &:hover {
      background-color: var(--ja-control-background-color-hover);
    }

    &.selected {
      background-color: color-mix(in srgb, var(--ja-color-primary-600) 50%, transparent);

      .result-name {
        color: var(--ja-color-neutral-900);
      }

      .result-id {
        color: var(--ja-color-neutral-700);
      }
    }

    &:focus-visible {
      outline: none;
      border: var(--ja-control-outline);
    }
  }

  .result-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--ja-spacing-small);
    margin-bottom: var(--ja-spacing-3x-small);
  }

  .result-name {
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    font-weight: var(--ja-font-weight-bold);
    color: var(--ja-color-neutral-800);
  }

  .result-id {
    white-space: nowrap;
    font-size: var(--ja-font-size-small);
    color: var(--ja-color-neutral-600);
  }

  .result-meta {
    display: flex;
    align-items: center;
    gap: var(--ja-spacing-x-small);
  }

  .tag {
    padding: var(--ja-spacing-3x-small) var(--ja-spacing-small);
    border-radius: var(--ja-border-radius-pill);
    background: var(--ja-color-neutral-100);
    font-size: var(--ja-font-size-small);
    color: var(--ja-color-neutral-600);
  }

  .clear {
    position: sticky;
    bottom: 0;
    width: 100%;
    padding: var(--ja-spacing-small) var(--ja-spacing-medium);
    border: none;
    background-color: var(--ja-color-neutral-400);
    color: var(--ja-color-neutral-1000);
    font-size: var(--ja-font-size-small);
    font-weight: var(--ja-font-weight-bold);

    &:hover {
      background-color: var(--ja-color-neutral-500);
    }
  }
</style>
