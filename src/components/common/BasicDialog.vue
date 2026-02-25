<script setup lang="ts">
  /* Imports //////////////////////////////////////////////////////////////////////////////////////////////////////// */

  import { PhQuestion, PhX } from '@phosphor-icons/vue';

  /* Props ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

  export interface BasicDialogProps {
    title: string;
    helpText?: string;
  }

  const props = defineProps<BasicDialogProps>();

  /* Models ///////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const visible = defineModel<boolean>({
    required: true,
  });

  /* Visibility ///////////////////////////////////////////////////////////////////////////////////////////////////// */

  const hide = () => {
    visible.value = false;
  };
</script>

<template>
  <Teleport to="body">
    <Transition
      name="fade"
      mode="out-in"
    >
      <div
        v-if="visible"
        class="basic-dialog"
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

            <div class="header">
              <div class="title">{{ title }}</div>
              <PhQuestion
                v-if="helpText"
                v-tooltip="{
                  content: helpText,
                  placement: 'top',
                  triggers: ['hover', 'click'],
                  popperClass: 'basic-dialog-help-text',
                }"
              />
            </div>
            <div class="content">
              <slot></slot>
            </div>
          </dialog>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
  .basic-dialog {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 9999;
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
    display: flex;
    flex-direction: column;
    gap: var(--ja-spacing-2x-small);
    padding: var(--ja-spacing-medium) 0 0 0;
    width: min(400px, 90dvw);
    max-height: 90dvh;
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
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: var(--ja-spacing-x-small);
    padding: 0 var(--ja-spacing-large);
    font-size: var(--ja-font-size-large);
  }

  .title {
    color: var(--ja-color-neutral-800);
  }

  .content {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    min-height: 0;
    padding: 0 var(--ja-spacing-large) var(--ja-spacing-large) var(--ja-spacing-large);
    overflow-y: auto;
  }
</style>

<style>
  .basic-dialog-help-text {
    max-width: 400px;
  }
</style>
