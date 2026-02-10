<script setup lang="ts">
  /* Imports //////////////////////////////////////////////////////////////////////////////////////////////////////// */

  import { PhCheck } from '@phosphor-icons/vue';
  import { computed, ref } from 'vue';

  import { spaceObjectMarkerFocusColor } from '@/utilities/application.js';

  import { useApplicationStore } from '@/stores/variants/application.js';

  import { useSpaceObjectSearch } from '@/composables/useSpaceObjectSearch.js';
  import { useSpaceObjectTleTracking } from '@/composables/useSpaceObjectTleTracking.js';

  import ControlGroup from '@/components/common/ControlGroup.vue';
  import SearchControl from '@/components/common/SearchControl.vue';
  import SpaceObjectCard from '@/components/common/SpaceObjectCard.vue';

  /* Stores ///////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const applicationStore = useApplicationStore();

  /* Search ///////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const searchText = computed({
    get: () => applicationStore.searchText,
    set: (value) => {
      applicationStore.searchText = value;
    },
  });

  const { results, isLoading } = useSpaceObjectSearch(searchText);

  /* Results visibility //////////////////////////////////////////////////////////////////////////////////////////// */

  const showResults = ref(false);

  const handleFocusIn = (event: FocusEvent) => {
    const target = event.target;
    if (target instanceof HTMLElement && target.closest('.clear')) {
      return;
    }

    showResults.value = true;
  };

  const handleFocusOut = (event: FocusEvent) => {
    const currentTarget = event.currentTarget as HTMLElement | null;
    const nextTarget = event.relatedTarget as Node | null;
    if (!currentTarget || !nextTarget || !currentTarget.contains(nextTarget)) {
      showResults.value = false;
    }
  };

  const scrollResultIntoView = (event: FocusEvent) => {
    const target = event.currentTarget;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    requestAnimationFrame(() => {
      target.scrollIntoView({ block: 'nearest' });
    });
  };

  /* Selection ////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const toggleNoradId = (noradId: number) => {
    if (applicationStore.selectedNoradIds.has(noradId)) {
      applicationStore.selectedNoradIds.delete(noradId);
    } else {
      applicationStore.selectedNoradIds.add(noradId);
    }
  };

  const clearSelectedNoradIds = () => {
    applicationStore.selectedNoradIds.clear();
  };

  /* Focus ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const unfocusNoradId = () => {
    applicationStore.focusedNoradId = null;
  };

  /* TLE Tracking /////////////////////////////////////////////////////////////////////////////////////////////////// */

  const noradIdsToTrackTle = computed(() => Array.from(applicationStore.selectedNoradIds));

  useSpaceObjectTleTracking(noradIdsToTrackTle);
</script>

<template>
  <div class="object-selection-controls">
    <div
      class="search-container"
      @focusin="handleFocusIn"
      @focusout="handleFocusOut"
    >
      <ControlGroup
        border-style="pill"
        orientation="horizontal"
      >
        <SearchControl
          v-model="searchText"
          :loading="isLoading"
          placeholder="Search objects"
        />
      </ControlGroup>

      <div class="list-container">
        <div class="loading-list">
          <template v-if="showResults">
            <div
              v-if="searchText && !results.length"
              class="empty-message"
            >
              No results found.
            </div>
            <button
              v-for="result in results"
              v-else
              :key="result.noradId"
              class="result"
              @focus="scrollResultIntoView"
              @click="toggleNoradId(result.noradId)"
            >
              <PhCheck
                :class="[
                  'icon',
                  {
                    selected: applicationStore.selectedNoradIds.has(result.noradId),
                    focused: applicationStore.focusedNoradId === result.noradId,
                  },
                ]"
                weight="bold"
              />
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
          </template>
          <button
            v-if="applicationStore.selectedNoradIds.size"
            class="clear"
            @click="clearSelectedNoradIds"
          >
            Clear selected ({{ applicationStore.selectedNoradIds.size }})
          </button>
        </div>
      </div>
    </div>

    <SpaceObjectCard
      v-if="typeof applicationStore.focusedNoradId === 'number'"
      :norad-id="applicationStore.focusedNoradId"
      @close="unfocusNoradId"
    />
  </div>
</template>

<style scoped>
  .object-selection-controls {
    --control-width: 350px;
    --list-border-radius: var(--ja-border-radius-x-large);

    display: grid;
    grid-template-rows: 1fr auto;
    pointer-events: none;
  }

  .search-container {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    min-height: 0;
    height: 100%;
  }

  .control-group,
  .loading-list {
    pointer-events: auto;
  }

  .control-group {
    width: var(--control-width);
    margin-bottom: var(--ja-spacing-small);
  }

  .list-container {
    flex: 1 1 auto;
    min-height: 0;
  }

  .loading-list {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    gap: 1px;
    width: var(--control-width);
    max-height: 100%;
    border-radius: var(--list-border-radius);
    background-color: var(--ja-color-neutral-200);
    box-shadow: var(--ja-control-box-shadow);
    overflow-y: auto;

    & > :first-child {
      border-top-left-radius: var(--list-border-radius);
      border-top-right-radius: var(--list-border-radius);
    }

    & > :last-child {
      border-bottom-left-radius: var(--list-border-radius);
      border-bottom-right-radius: var(--list-border-radius);
    }
  }

  .empty-message {
    width: 100%;
    padding: var(--ja-spacing-medium);
    text-align: center;
    font-size: var(--ja-font-size-small);
    color: var(--ja-color-neutral-600);
  }

  .result {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--ja-spacing-2x-small);
    scroll-margin: var(--ja-spacing-medium) 0 var(--ja-spacing-4x-large) 0;
    padding: var(--ja-spacing-small) var(--ja-spacing-medium) var(--ja-spacing-small) var(--ja-spacing-3x-large);
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
    font-weight: var(--ja-font-weight-semibold);
    color: var(--ja-color-neutral-950);
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
    background: var(--ja-color-blue-200);
    font-size: var(--ja-font-size-x-small);
    color: var(--ja-color-neutral-700);
  }

  .clear {
    position: sticky;
    bottom: 0;
    width: 100%;
    padding: var(--ja-spacing-small) var(--ja-spacing-medium);
    border: var(--ja-control-outline);
    border-color: transparent;
    background-color: color-mix(in srgb, var(--ja-control-background-color) 95%, var(--ja-color-neutral-1000));
    color: var(--ja-color-neutral-950);
    font-size: var(--ja-font-size-small);
    font-weight: var(--ja-font-weight-bold);

    &:hover {
      background-color: var(--ja-control-background-color-hover);
    }

    &:focus-visible {
      outline: none;
      border: var(--ja-control-outline);
    }
  }

  .space-object-card {
    flex: 0 0 auto;
    margin-top: var(--ja-spacing-2x-large);
    pointer-events: auto;
  }
</style>
