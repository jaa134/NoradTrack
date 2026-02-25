<script setup lang="ts">
  /* Imports //////////////////////////////////////////////////////////////////////////////////////////////////////// */

  import { PhCheckCircle } from '@phosphor-icons/vue';

  import BasicDialog from '@/components/common/BasicDialog.vue';

  /* Models ///////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const visible = defineModel<boolean>({
    required: true,
  });

  /* Confirm //////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const confirm = () => {
    visible.value = false;
  };
</script>

<template>
  <BasicDialog
    v-model="visible"
    title="Privacy Notice"
  >
    <div class="content">
      <p class="description">
        NoradTrack uses your location to provide additional features. This data is only used to:
      </p>

      <ul class="features">
        <li>
          <PhCheckCircle weight="fill" />
          <span>Locate your position on the map</span>
        </li>
        <li>
          <PhCheckCircle weight="fill" />
          <span>Make overhead pass predictions</span>
        </li>
        <li>
          <PhCheckCircle weight="fill" />
          <span>Calculate distances to satellites</span>
        </li>
      </ul>

      <p class="description">
        We take your privacy seriously. Know that your location data stays on your device and is never shared with
        anyone. Feel free to opt-in or opt-out at any time in your browser settings.
      </p>

      <button
        class="confirm-button"
        @click="confirm"
      >
        I understand
      </button>
    </div>
  </BasicDialog>
</template>

<style scoped>
  .content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--ja-spacing-medium);
  }

  .description {
    margin: 0;
    font-size: var(--ja-font-size-small);
    line-height: var(--ja-line-height-dense);
    color: var(--ja-color-neutral-700);
  }

  .features {
    display: flex;
    flex-direction: column;
    gap: var(--ja-spacing-x-small);
    width: 100%;
    margin: 0;
    padding: 0;
    list-style: none;

    li {
      display: flex;
      align-items: center;
      gap: var(--ja-spacing-x-small);
      font-size: var(--ja-font-size-small);
      line-height: var(--ja-line-height-denser);
      color: var(--ja-color-neutral-700);

      svg {
        flex-shrink: 0;
        color: var(--ja-color-primary-500);
      }
    }
  }

  .confirm-button {
    width: 100%;
    padding: var(--ja-spacing-small) var(--ja-spacing-medium);
    border: none;
    border-radius: var(--ja-control-border-radius-round);
    background-color: var(--ja-color-primary-500);
    color: var(--ja-color-neutral-0);
    font-size: var(--ja-font-size-small);
    font-weight: var(--ja-font-weight-bold);

    &:hover {
      background-color: var(--ja-color-primary-600);
    }

    &:focus-visible {
      outline: var(--ja-control-outline);
    }
  }
</style>
