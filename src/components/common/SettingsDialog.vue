<script setup lang="ts">
  /* Imports //////////////////////////////////////////////////////////////////////////////////////////////////////// */

  import { PhX } from '@phosphor-icons/vue';

  import { useApplicationStore } from '@/stores/variants/application.js';

  /* Models ///////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const visible = defineModel<boolean>({
    required: true,
  });

  /* Stores ///////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const applicationStore = useApplicationStore();

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
            <label class="toggle">
              <span>Show user position</span>
              <input
                v-model="applicationStore.showUserPosition"
                type="checkbox"
              />
            </label>
            <label class="toggle">
              <span>Show country GeoJSON</span>
              <input
                v-model="applicationStore.showCountryGeoJson"
                type="checkbox"
              />
            </label>
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
    backdrop-filter: blur(5px);
    cursor: pointer;
  }

  .dialog {
    position: relative;
    padding: var(--ja-spacing-medium) var(--ja-spacing-large) var(--ja-spacing-large) var(--ja-spacing-large);
    width: 400px;
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
    gap: var(--ja-spacing-medium);
    margin-top: var(--ja-spacing-medium);
  }

  .toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--ja-spacing-medium);
    font-size: var(--ja-font-size-small);
    color: var(--ja-color-neutral-800);

    input {
      width: 16px;
      height: 16px;
      cursor: pointer;
    }
  }
</style>
