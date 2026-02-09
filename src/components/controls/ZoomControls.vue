<script setup lang="ts">
  /* Imports //////////////////////////////////////////////////////////////////////////////////////////////////////// */

  import { PhCornersOut, PhMinus, PhPlus } from '@phosphor-icons/vue';

  import { eventHub, EventType } from '@/utilities/application.js';

  import ButtonControl from '@/components/common/ButtonControl.vue';
  import ControlGroup from '@/components/common/ControlGroup.vue';

  /* Methods //////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const fitToScreen = () => {
    eventHub.emit(EventType.FitToScreen);
  };

  const zoomIn = () => {
    eventHub.emit(EventType.ZoomIn);
  };

  const zoomOut = () => {
    eventHub.emit(EventType.ZoomOut);
  };
</script>

<template>
  <div class="zoom-controls">
    <ControlGroup
      border-style="round"
      orientation="vertical"
    >
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
