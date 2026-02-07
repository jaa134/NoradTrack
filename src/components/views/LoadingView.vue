<script setup lang="ts">
  /* Imports //////////////////////////////////////////////////////////////////////////////////////////////////////// */

  import StarryBackgroundView from '@/components/views/StarryBackgroundView.vue';
</script>

<template>
  <StarryBackgroundView class="loading-view">
    <div class="message">
      <span class="text">Acquiring signal</span>
      <span class="cursor">|</span>
    </div>
  </StarryBackgroundView>
</template>

<style scoped>
  .message {
    display: inline-flex;
    align-items: center;
    font-family: var(--ja-font-mono);
    font-size: var(--ja-font-size-x-large);
    letter-spacing: var(--ja-letter-spacing-looser);
    text-transform: uppercase;
    color: var(--ja-color-primary-200);
    text-shadow:
      0 0 10px color-mix(in oklab, var(--ja-color-primary-400) 55%, transparent),
      0 0 24px color-mix(in oklab, var(--ja-color-primary-500) 35%, transparent);
  }

  .text {
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

  .cursor {
    margin: 0 0 var(--ja-spacing-2x-small) var(--ja-spacing-2x-small);
    color: var(--ja-color-primary-300);
    animation: blink 1s steps(2, start) infinite;
  }

  @keyframes blink {
    0%,
    49% {
      opacity: 1;
    }
    50%,
    100% {
      opacity: 0;
    }
  }
</style>
