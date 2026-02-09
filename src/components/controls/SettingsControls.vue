<script setup lang="ts">
  /* Imports //////////////////////////////////////////////////////////////////////////////////////////////////////// */

  import { PhGear, PhGlobeSimple, PhMapTrifold } from '@phosphor-icons/vue';
  import { useRouter } from 'vue-router';

  import { RouteName } from '@/router/index.js';

  import { useApplicationStore } from '@/stores/variants/application.js';

  import ButtonControl from '@/components/common/ButtonControl.vue';
  import ControlGroup from '@/components/common/ControlGroup.vue';

  /* Router ///////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const router = useRouter();

  /* Stores ///////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const applicationStore = useApplicationStore();

  /* View type ////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const selectView = (routeName: RouteName) => {
    router.push({ name: routeName });
  };

  /* Settings /////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const toggleSettings = () => {
    applicationStore.showSettingsDialog = !applicationStore.showSettingsDialog;
  };
</script>

<template>
  <div class="settings-controls">
    <ControlGroup
      border-style="round"
      orientation="vertical"
    >
      <ButtonControl
        v-tooltip.left="'Map'"
        @click="selectView(RouteName.Map)"
      >
        <PhMapTrifold weight="bold" />
      </ButtonControl>
      <ButtonControl
        v-tooltip.left="'Globe'"
        @click="selectView(RouteName.Globe)"
      >
        <PhGlobeSimple weight="bold" />
      </ButtonControl>
    </ControlGroup>
    <ControlGroup
      border-style="round"
      orientation="vertical"
    >
      <ButtonControl
        v-tooltip.left="'Settings'"
        @click="toggleSettings"
      >
        <PhGear weight="bold" />
      </ButtonControl>
    </ControlGroup>
  </div>
</template>

<style scoped>
  .settings-controls {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    gap: var(--ja-spacing-small);
  }
</style>
