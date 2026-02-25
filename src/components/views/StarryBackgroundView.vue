<script setup lang="ts">
  /* Imports //////////////////////////////////////////////////////////////////////////////////////////////////////// */

  import { onBeforeUnmount, onMounted, ref } from 'vue';

  /* Elements /////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const starryBackgroundElement = ref<HTMLDivElement>();

  /* Star generation //////////////////////////////////////////////////////////////////////////////////////////////// */

  interface Star {
    x: number;
    y: number;
    size: number;
    delay: number;
    duration: number;
  }

  const stars = ref<Star[]>([]);

  const resetStars = () => {
    stars.value = [];
  };

  const calculateStarCount = (): number => {
    const width = starryBackgroundElement.value?.clientWidth ?? 0;
    const height = starryBackgroundElement.value?.clientHeight ?? 0;
    const area = width * height;
    const density = 0.00015;
    return Math.floor(area * density);
  };

  const generateStars = () => {
    const starCount = calculateStarCount();

    const newStars = [];
    for (let i = 0; i < starCount; i++) {
      newStars.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 0.5,
        delay: Math.random() * 3,
        duration: Math.random() * 2 + 1.5,
      });
    }

    stars.value = newStars;
  };

  /* Resize ///////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const isResizing = ref(false);

  let resizeTimeout: ReturnType<typeof setTimeout> | null = null;

  const handleResize = () => {
    isResizing.value = true;

    resetStars();

    if (resizeTimeout) {
      clearTimeout(resizeTimeout);
    }

    resizeTimeout = setTimeout(() => {
      generateStars();
      isResizing.value = false;
    }, 250);
  };

  const resizeObserver = new ResizeObserver(() => {
    handleResize();
  });

  /* Lifecycle ////////////////////////////////////////////////////////////////////////////////////////////////////// */

  onMounted(() => {
    if (starryBackgroundElement.value) {
      resizeObserver.observe(starryBackgroundElement.value);
    } else {
      console.error('Starry background element not found.');
    }

    generateStars();
  });

  onBeforeUnmount(() => {
    if (starryBackgroundElement.value) {
      resizeObserver.unobserve(starryBackgroundElement.value);
    } else {
      console.error('Starry background element not found.');
    }

    if (resizeTimeout) {
      clearTimeout(resizeTimeout);
    }
  });
</script>

<template>
  <div
    ref="starryBackgroundElement"
    class="starry-background"
  >
    <Transition
      name="fade-in-slow"
      mode="out-in"
    >
      <div
        v-if="!isResizing"
        class="star-field"
      >
        <div
          v-for="(star, index) in stars"
          :key="index"
          class="star"
          :style="{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDelay: `${star.delay}s`,
            animationDuration: `${star.duration}s`,
          }"
        ></div>
      </div>
    </Transition>

    <div class="content">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
  .starry-background {
    position: relative;
    overflow: hidden;
  }

  .star-field {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  .star {
    position: absolute;
    background-color: var(--ja-color-neutral-0);
    border-radius: 50%;
    animation: twinkle infinite ease-in-out;
    transform: translate(-50%, -50%);
    will-change: opacity, transform;

    &:nth-child(3n) {
      background-color: color-mix(in srgb, var(--ja-color-neutral-0) 90%, transparent);
      box-shadow:
        0 0 3px color-mix(in srgb, var(--ja-color-neutral-0) 90%, transparent),
        0 0 6px color-mix(in srgb, var(--ja-color-neutral-0) 70%, transparent),
        0 0 9px color-mix(in srgb, var(--ja-color-neutral-0) 50%, transparent);
    }

    &:nth-child(3n + 1) {
      background-color: color-mix(in srgb, var(--ja-color-sky-100) 80%, transparent);
      box-shadow:
        0 0 2px color-mix(in srgb, var(--ja-color-sky-100) 80%, transparent),
        0 0 4px color-mix(in srgb, var(--ja-color-sky-100) 60%, transparent),
        0 0 6px color-mix(in srgb, var(--ja-color-sky-100) 40%, transparent);
    }

    &:nth-child(3n + 2) {
      background-color: color-mix(in srgb, var(--ja-color-yellow-50) 70%, transparent);
      box-shadow:
        0 0 2px color-mix(in srgb, var(--ja-color-yellow-50) 70%, transparent),
        0 0 4px color-mix(in srgb, var(--ja-color-yellow-50) 50%, transparent),
        0 0 6px color-mix(in srgb, var(--ja-color-yellow-50) 30%, transparent);
    }
  }

  .content {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }

  @keyframes twinkle {
    0%,
    100% {
      opacity: 0.3;
      transform: translate(-50%, -50%) scale(1);
    }
    50% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1.2);
    }
  }
</style>
