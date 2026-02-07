<script setup lang="ts"></script>

<template>
  <button class="button-control">
    <slot></slot>
  </button>
</template>

<style scoped>
  button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--ja-spacing-small);
    border: none;
    border-radius: var(--ja-border-radius-large);
    background-color: var(--ja-control-background-color);
    color: var(--ja-control-color);
    font-size: var(--ja-control-font-size);

    &:hover {
      background-color: var(--ja-control-background-color-hover);
    }

    &:focus-visible {
      outline: var(--ja-control-outline);
    }
  }
</style>
