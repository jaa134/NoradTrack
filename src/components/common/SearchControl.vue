<script setup lang="ts">
  /* Imports //////////////////////////////////////////////////////////////////////////////////////////////////////// */

  import { PhCircleNotch, PhMagnifyingGlass, PhXCircle } from '@phosphor-icons/vue';
  import { ref } from 'vue';

  /* Props ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

  export interface SearchControlProps {
    placeholder?: string;
    loading?: boolean;
  }

  const props = withDefaults(defineProps<SearchControlProps>(), {
    placeholder: 'Search',
    loading: false,
  });

  /* Models ///////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const model = defineModel<string>({
    required: true,
  });

  /* Elements /////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const searchInput = ref<HTMLInputElement | null>(null);

  /* Focus ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const focusSearchInput = () => {
    searchInput.value?.focus();
  };

  /* Clear ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const clearSearch = () => {
    model.value = '';
  };
</script>

<template>
  <div
    class="search-input"
    @click="focusSearchInput"
  >
    <PhCircleNotch
      v-if="loading"
      class="icon loading"
      weight="bold"
    />
    <PhMagnifyingGlass
      v-else
      class="icon search"
      weight="bold"
    />
    <input
      ref="searchInput"
      v-model="model"
      class="input"
      name="search"
      type="text"
      :placeholder="placeholder"
      autocomplete="off"
    />
    <button
      v-if="model"
      class="clear"
      aria-label="Clear search"
      @click.stop="clearSearch"
    >
      <PhXCircle weight="bold" />
    </button>
  </div>
</template>

<style scoped>
  .search-input {
    display: flex;
    align-items: center;
    gap: var(--ja-spacing-small);
    padding: 0 var(--ja-spacing-medium);
    width: 100%;
    height: 40px;
    border-radius: var(--ja-control-border-radius-pill);
    background-color: var(--ja-control-background-color);
    color: var(--ja-control-color);
    font-size: var(--ja-control-font-size);
    cursor: text;

    &:has(.input:focus-visible) {
      outline: var(--ja-control-outline);
      z-index: 1;
    }
  }

  .icon {
    flex: 0 0 auto;

    &.loading {
      color: var(--ja-color-primary-500);
      animation: spin var(--ja-transition-x-slow) linear infinite;
    }
  }

  .input {
    flex: 1 1 0;
    min-width: 0;
    height: 100%;
    border: none;
    background: transparent;

    &:focus {
      outline: none;
    }

    &::placeholder {
      color: var(--ja-control-color-placeholder);
    }
  }

  .clear {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--ja-spacing-3x-small);
    border: none;
    border-radius: var(--ja-border-radius-circle);
    background: transparent;
    color: inherit;

    &:hover {
      color: var(--ja-color-primary-500);
    }

    &:focus-visible {
      outline: var(--ja-control-outline);
    }
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
