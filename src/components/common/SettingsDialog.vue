<script setup lang="ts">
  /* Imports //////////////////////////////////////////////////////////////////////////////////////////////////////// */

  import { PhCaretDown, PhX } from '@phosphor-icons/vue';

  import { globeSkinOptions } from '@/utilities/globe.js';
  import { mapSkinOptions } from '@/utilities/map.js';

  import { useApplicationStore } from '@/stores/variants/application.js';
  import { useGlobeStore } from '@/stores/variants/globe.js';
  import { useMapStore } from '@/stores/variants/map.js';

  /* Models ///////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const visible = defineModel<boolean>({
    required: true,
  });

  /* Stores ///////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const applicationStore = useApplicationStore();

  const mapStore = useMapStore();

  const globeStore = useGlobeStore();

  /* Visibility ///////////////////////////////////////////////////////////////////////////////////////////////////// */

  const hide = () => {
    visible.value = false;
  };
</script>

<template>
  <Transition
    name="fade"
    mode="out-in"
  >
    <div
      v-if="visible"
      class="settings-dialog"
    >
      <div
        class="overlay"
        @click="hide"
      >
        <dialog
          class="dialog"
          open
          @click.stop
        >
          <button
            class="close"
            @click="hide"
          >
            <PhX weight="bold" />
          </button>

          <div class="header">Settings</div>
          <div class="content">
            <div class="toggle">
              <span class="label">Show my location</span>
              <input
                v-model="applicationStore.showUserPosition"
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
        </dialog>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
  .settings-dialog {
    position: fixed;
    z-index: 9999999;
    width: 100%;
    height: 100%;
  }

  .overlay {
    display: grid;
    place-items: center;
    width: 100%;
    height: 100%;
    background-color: color-mix(in srgb, var(--ja-color-neutral-1000) 50%, transparent);
    backdrop-filter: blur(2px);
    cursor: pointer;
  }

  .dialog {
    position: relative;
    padding: var(--ja-spacing-medium) var(--ja-spacing-large) var(--ja-spacing-large) var(--ja-spacing-large);
    width: min(400px, 90vw);
    max-height: 90vh;
    border: none;
    border-radius: var(--ja-border-radius-large);
    background-color: var(--ja-control-background-color);
    box-shadow: var(--ja-control-box-shadow);
    color: var(--ja-control-color);
    cursor: default;
  }

  .close {
    position: absolute;
    top: var(--ja-spacing-small);
    right: var(--ja-spacing-small);
    padding: var(--ja-spacing-x-small);
    border: none;
    border-radius: var(--ja-border-radius-circle);
    background-color: transparent;
    color: var(--ja-control-color);
    font-size: var(--ja-font-size-medium);

    &:hover {
      background-color: var(--ja-control-background-color-hover);
      color: var(--ja-color-neutral-500);
    }
  }

  .header {
    font-size: var(--ja-font-size-large);
    color: var(--ja-color-neutral-800);
  }

  .content {
    display: flex;
    flex-direction: column;
    gap: var(--ja-spacing-x-small);
    margin-top: var(--ja-spacing-medium);
  }

  .toggle {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--ja-spacing-medium);
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
    width: 160px;

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

  @media (max-width: 600px) {
    .toggle {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--ja-spacing-2x-small);
    }

    .select-container {
      width: 100%;
    }
  }
</style>
