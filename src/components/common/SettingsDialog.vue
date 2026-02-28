<script setup lang="ts">
  /* Imports //////////////////////////////////////////////////////////////////////////////////////////////////////// */

  import { PhCaretDown } from '@phosphor-icons/vue';

  import { globeSkinOptions } from '@/utilities/globe.js';
  import { mapSkinOptions } from '@/utilities/map.js';

  import { useApplicationStore } from '@/stores/variants/application.js';
  import { useGlobeStore } from '@/stores/variants/globe.js';
  import { useMapStore } from '@/stores/variants/map.js';

  import BasicDialog from '@/components/common/BasicDialog.vue';

  /* Models ///////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const visible = defineModel<boolean>({
    required: true,
  });

  /* Stores ///////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const applicationStore = useApplicationStore();

  const mapStore = useMapStore();

  const globeStore = useGlobeStore();
</script>

<template>
  <BasicDialog
    v-model="visible"
    title="Settings"
  >
    <div class="form">
      <div class="toggle">
        <span class="label">Show my location</span>
        <input
          v-model="applicationStore.showUserPosition"
          type="checkbox"
        />
      </div>
      <div class="toggle">
        <span class="label">Show solar terminator</span>
        <input
          v-model="applicationStore.showSolarTerminator"
          type="checkbox"
        />
      </div>
      <div class="toggle">
        <span class="label">Show country GeoJSON</span>
        <input
          v-model="applicationStore.showCountryGeoJson"
          type="checkbox"
        />
      </div>
      <div class="toggle">
        <span class="label">Map skin</span>
        <div class="select-container">
          <select v-model="mapStore.skin">
            <option
              v-for="option in mapSkinOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
          <PhCaretDown
            class="select-icon"
            weight="bold"
          />
        </div>
      </div>
      <div class="toggle">
        <span class="label">Globe skin</span>
        <div class="select-container">
          <select v-model="globeStore.skin">
            <option
              v-for="option in globeSkinOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
          <PhCaretDown
            class="select-icon"
            weight="bold"
          />
        </div>
      </div>
    </div>
  </BasicDialog>
</template>

<style scoped>
  .form {
    display: flex;
    flex-direction: column;
    gap: var(--ja-spacing-small);
  }

  .toggle {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--ja-spacing-2x-small);
    font-size: var(--ja-font-size-small);
  }

  .label {
    color: var(--ja-color-neutral-800);
  }

  input[type='checkbox'] {
    width: 16px;
    height: 16px;
    cursor: pointer;
  }

  .select-container {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;

    select {
      width: 100%;
      padding: var(--ja-spacing-3x-small) var(--ja-spacing-2x-large) var(--ja-spacing-3x-small) var(--ja-spacing-small);
      border: 1px solid var(--ja-color-neutral-300);
      border-radius: var(--ja-control-border-radius-round);
      background-color: var(--ja-control-background-color);
      color: var(--ja-control-color);
      font-size: var(--ja-font-size-small);
      appearance: none;
    }

    .select-icon {
      position: absolute;
      right: var(--ja-spacing-small);
      pointer-events: none;
    }
  }
</style>
