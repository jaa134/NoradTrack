<script setup lang="ts">
  /* Imports //////////////////////////////////////////////////////////////////////////////////////////////////////// */

  import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

  import { useApplicationStore } from '@/stores/variants/application.js';

  import { useSpaceObjectSearch } from '@/composables/useSpaceObjectSearch.js';

  import ControlGroup from '@/components/common/ControlGroup.vue';
  import SearchControl from '@/components/common/SearchControl.vue';
  import SearchResult from '@/components/common/SearchResult.vue';
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

  const displayedResults = computed(() => results.value.slice(0, 100));

  /* Results visibility //////////////////////////////////////////////////////////////////////////////////////////// */

  const searchContainer = ref<HTMLElement | null>(null);

  const showResults = ref(false);

  let hideTimeout: ReturnType<typeof setTimeout> | null = null;

  const queueHide = () => {
    cancelHide();
    hideTimeout = setTimeout(() => {
      showResults.value = false;
    }, 150);
  };

  const cancelHide = () => {
    if (hideTimeout !== null) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }
  };

  const handleSearchClick = (event: MouseEvent) => {
    cancelHide();

    const target = event.target;
    if (target instanceof HTMLElement && target.closest('.clear')) {
      return;
    }

    showResults.value = true;
  };

  const handleSearchKeydownEnter = (event: KeyboardEvent) => {
    cancelHide();

    const target = event.target;
    if (target instanceof HTMLElement && target.closest('.clear')) {
      return;
    }

    showResults.value = !showResults.value;
  };

  const handlePointerDownOutside = (event: PointerEvent) => {
    if (showResults.value && searchContainer.value && !searchContainer.value.contains(event.target as Node)) {
      queueHide();
    }
  };

  onMounted(() => {
    document.addEventListener('pointerdown', handlePointerDownOutside);
  });

  onBeforeUnmount(() => {
    cancelHide();
    document.removeEventListener('pointerdown', handlePointerDownOutside);
  });

  /* Scrolling ////////////////////////////////////////////////////////////////////////////////////////////////////// */

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
    cancelHide();
    const selectedNoradIds = new Set(applicationStore.selectedNoradIds);
    if (selectedNoradIds.has(noradId)) {
      selectedNoradIds.delete(noradId);
    } else {
      selectedNoradIds.add(noradId);
    }
    applicationStore.selectedNoradIds = selectedNoradIds;
  };

  const clearSelectedNoradIds = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    cancelHide();
    applicationStore.selectedNoradIds = new Set();
  };

  /* Focus ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const unfocusNoradId = () => {
    applicationStore.focusedNoradId = null;
  };
</script>

<template>
  <div class="object-selection-controls">
    <div
      ref="searchContainer"
      class="search-container"
    >
      <ControlGroup
        border-style="pill"
        orientation="horizontal"
      >
        <SearchControl
          v-model="searchText"
          :class="{ 'has-selection': applicationStore.selectedNoradIds.size > 0 }"
          :loading="isLoading"
          placeholder="Search objects"
          @click="handleSearchClick"
          @keydown.enter="handleSearchKeydownEnter"
        >
          <template #suffix>
            <button
              v-if="applicationStore.selectedNoradIds.size > 0"
              v-tooltip.bottom="'Clear selection'"
              class="clear"
              @click="clearSelectedNoradIds"
            >
              Unselect all ({{ applicationStore.selectedNoradIds.size }})
            </button>
          </template>
        </SearchControl>
      </ControlGroup>

      <div class="list-container">
        <div class="loading-list">
          <template v-if="showResults">
            <div
              v-if="searchText && !isLoading && !results.length"
              class="empty-message"
            >
              No results found.
            </div>
            <template v-else>
              <SearchResult
                v-for="spaceObject in displayedResults"
                :key="spaceObject.noradId"
                :space-object="spaceObject"
                @focus="scrollResultIntoView"
                @click="toggleNoradId(spaceObject.noradId)"
              />
            </template>
          </template>
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
    --control-width: clamp(240px, 75dvw, 350px);
    --list-border-radius: var(--ja-border-radius-large);

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

  .search-control {
    &.has-selection {
      padding-right: var(--ja-spacing-x-small);
    }
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
    background-color: var(--ja-control-background-color);
    color: var(--ja-color-neutral-600);
  }

  .clear {
    padding: 0 var(--ja-spacing-x-small);
    border: var(--ja-control-outline);
    border-color: transparent;
    border-radius: var(--ja-border-radius-pill);
    background-color: color-mix(in srgb, var(--ja-control-background-color) 90%, var(--ja-color-neutral-1000));
    color: var(--ja-color-neutral-950);
    font-size: var(--ja-font-size-x-small);
    font-weight: var(--ja-font-weight-semibold);

    &:hover {
      background-color: var(--ja-color-primary-500);
    }

    &:focus-visible {
      outline: var(--ja-control-outline);
    }
  }

  .space-object-card {
    flex: 0 0 auto;
    margin-top: var(--ja-spacing-x-large);
    pointer-events: auto;
  }

  @media (max-height: 500px) {
    .space-object-card {
      margin-top: var(--ja-spacing-small);
    }
  }
</style>
