<script setup lang="ts">
  /* Props ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

  export interface ControlGroupProps {
    borderStyle: 'round' | 'pill';
    orientation: 'horizontal' | 'vertical';
  }

  const props = defineProps<ControlGroupProps>();
</script>

<template>
  <div :class="['control-group', borderStyle, orientation]">
    <slot></slot>
  </div>
</template>

<style scoped>
  .control-group {
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--ja-control-box-shadow);

    & > *:focus-visible,
    & > *:has(*:focus-visible) {
      z-index: 1;
    }

    &.round {
      border-radius: var(--ja-control-border-radius-round);
    }

    &.pill {
      border-radius: var(--ja-control-border-radius-pill);
    }

    &.horizontal {
      flex-direction: row;

      & > :not(:first-child) {
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
      }

      & > :not(:last-child) {
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
      }
    }

    &.vertical {
      flex-direction: column;

      & > :not(:first-child) {
        border-top-left-radius: 0;
        border-top-right-radius: 0;
      }

      & > :not(:last-child) {
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;
      }
    }
  }
</style>
