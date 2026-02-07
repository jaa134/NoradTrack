<script setup lang="ts">
  /* Imports //////////////////////////////////////////////////////////////////////////////////////////////////////// */

  import { PhCornersOut, PhMinus, PhPlus } from '@phosphor-icons/vue';

  import ButtonControl from '@/components/common/ButtonControl.vue';
  import ControlGroup from '@/components/common/ControlGroup.vue';

  /* Methods //////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const fitToScreen = () => {
    console.log('fitToScreen');
  };

  const zoomIn = () => {
    console.log('zoomIn');
  };

  const zoomOut = () => {
    console.log('zoomOut');
  };
</script>

<template>
  <div class="zoom-controls">
    <ControlGroup orientation="vertical">
      <ButtonControl
        v-tooltip.left="'Fit to screen'"
        @click="fitToScreen"
      >
        <PhCornersOut weight="bold" />
      </ButtonControl>
      <ButtonControl
        v-tooltip.left="'Zoom in'"
        @click="zoomIn"
      >
        <PhPlus weight="bold" />
      </ButtonControl>
      <ButtonControl
        v-tooltip.left="'Zoom out'"
        @click="zoomOut"
      >
        <PhMinus weight="bold" />
      </ButtonControl>
    </ControlGroup>
  </div>
</template>
