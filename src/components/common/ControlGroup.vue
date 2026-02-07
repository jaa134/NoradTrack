<script setup lang="ts">
  /* Props ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

  export interface ControlGroupProps {
    orientation?: 'horizontal' | 'vertical';
  }

  const props = withDefaults(defineProps<ControlGroupProps>(), {
    orientation: 'horizontal',
  });
</script>

<template>
  <div :class="['control-group', orientation]">
    <slot></slot>
  </div>
</template>

<style scoped>
  .control-group {
    display: flex;
    align-items: center;
    justify-content: center;

    & > *:focus-visible,
    & > *:has(*:focus-visible) {
      z-index: 1;
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
