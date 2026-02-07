<script setup lang="ts">
  /* Imports //////////////////////////////////////////////////////////////////////////////////////////////////////// */

  import StarryBackgroundView from '@/components/views/StarryBackgroundView.vue';

  /* Props ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

  export interface ErrorViewProps {
    error: string;
  }

  defineProps<ErrorViewProps>();
</script>

<template>
  <StarryBackgroundView class="error-view">
    <div class="content">
      <div class="header">
        <div class="status">
          <div></div>
          <div>Transmission Failure</div>
        </div>
        <span class="error-code">ERR-042</span>
      </div>
      <div class="title">Signal Lost</div>
      <div class="subtitle">Unable to lock onto module payload.</div>
      <div class="details">{{ error }}</div>
    </div>
  </StarryBackgroundView>
</template>

<style scoped>
  .content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }

  .header {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: var(--ja-spacing-3x-large);
    width: 100%;
    margin-bottom: var(--ja-spacing-small);
    font-family: var(--ja-font-mono);
    font-size: var(--ja-font-size-small);
    letter-spacing: var(--ja-letter-spacing-looser);
    text-transform: uppercase;
    white-space: nowrap;
    color: var(--ja-color-neutral-300);
  }

  .status {
    display: inline-flex;
    align-items: center;
    gap: var(--ja-spacing-x-small);

    & > :first-child {
      --size: 10px;

      flex: 0;
      min-width: var(--size);
      width: var(--size);
      height: var(--size);
      border-radius: var(--ja-border-radius-circle);
      background: var(--ja-color-danger-500);
      box-shadow: 0 0 10px 1px var(--ja-color-danger-500);
      animation: pulse var(--ja-transition-2x-slow) ease-in-out infinite;
    }

    & > :last-child {
      flex: 1;
      margin-top: var(--ja-spacing-3x-small);
    }
  }

  .error-code {
    padding: var(--ja-spacing-2x-small) var(--ja-spacing-medium) var(--ja-spacing-3x-small) var(--ja-spacing-medium);
    border-radius: 999px;
    border: 1px solid color-mix(in oklab, var(--ja-color-primary-400) 35%, transparent);
    color: var(--ja-color-primary-200);
    background: color-mix(in oklab, var(--ja-color-neutral-900) 70%, transparent);
  }

  .title {
    font-family: var(--ja-font-mono);
    font-size: var(--ja-font-size-x-large);
    letter-spacing: var(--ja-letter-spacing-looser);
    text-transform: uppercase;
    text-shadow:
      0 0 10px color-mix(in oklab, var(--ja-color-primary-400) 55%, transparent),
      0 0 24px color-mix(in oklab, var(--ja-color-primary-500) 35%, transparent);
    background: linear-gradient(
      90deg,
      var(--ja-color-neutral-300),
      var(--ja-color-primary-200),
      var(--ja-color-neutral-300)
    );
    background-size: 200% 100%;
    background-clip: text;
    color: transparent;
  }

  .subtitle {
    font-family: var(--ja-font-sans);
    font-size: var(--ja-font-size-large);
    font-weight: var(--ja-font-weight-light);
    color: var(--ja-color-neutral-300);
    margin-top: var(--ja-spacing-x-small);
  }

  .details {
    margin-top: var(--ja-spacing-3x-large);
    padding: var(--ja-spacing-x-large) var(--ja-spacing-2x-large);
    border: 1px solid color-mix(in srgb, var(--ja-color-blue-400) 35%, transparent);
    border-radius: var(--ja-border-radius-x-large);
    background: linear-gradient(135deg, var(--ja-color-blue-950), var(--ja-color-blue-900));
    box-shadow: 0 0 20px color-mix(in srgb, var(--ja-color-blue-400) 25%, transparent);
    font-family: var(--ja-font-sans);
    font-size: var(--ja-font-size-medium);
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 0.6;
    }
    50% {
      opacity: 1;
    }
  }
</style>
