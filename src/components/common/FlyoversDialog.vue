<script setup lang="ts">
  /* Imports //////////////////////////////////////////////////////////////////////////////////////////////////////// */

  import { Flyover, flyoverProjectionDurationDays, SpaceObject } from '@/utilities/application.js';

  import BasicDialog from '@/components/common/BasicDialog.vue';
  import FlyoverListItem from '@/components/common/FlyoverListItem.vue';

  /* Props ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

  export interface FlyoversDialogProps {
    spaceObject: SpaceObject;
    flyovers: Flyover[];
  }

  const props = defineProps<FlyoversDialogProps>();

  /* Models ///////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const visible = defineModel<boolean>({
    required: true,
  });

  /* Dialog ///////////////////////////////////////////////////////////////////////////////////////////////////////// */

  const dialogTitle = 'Flyovers';

  const dialogHelpText = `When an object is projected to fly over your location in the next ${flyoverProjectionDurationDays} days. Accuracy decreases the further the prediction is from now.`;
</script>

<template>
  <BasicDialog
    v-model="visible"
    :title="dialogTitle"
    :help-text="dialogHelpText"
  >
    <div class="header">
      <span class="name">{{ spaceObject.name }}</span>
      <span class="count">{{ flyovers.length }} flyovers predicted</span>
    </div>
    <div class="list">
      <div
        v-if="flyovers.length === 0"
        class="empty"
      >
        No flyovers projected in the next {{ flyoverProjectionDurationDays }} days.
      </div>
      <template v-else>
        <FlyoverListItem
          v-for="flyover in flyovers"
          :key="flyover.startDate.getTime()"
          :flyover="flyover"
        />
      </template>
    </div>
  </BasicDialog>
</template>

<style scoped>
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: var(--ja-font-size-small);
  }

  .list {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    min-height: 0;
    max-height: 400px;
    border: 1px solid var(--ja-color-neutral-200);
    border-radius: var(--ja-border-radius-large);
    background-color: var(--ja-color-neutral-50);
    overflow-y: auto;
  }

  .empty {
    padding: var(--ja-spacing-small);
    text-align: center;
    font-size: var(--ja-font-size-small);
    color: var(--ja-color-neutral-600);
  }

  .flyover {
    &:not(:last-child) {
      border-bottom: 1px solid var(--ja-color-neutral-200);
    }
  }
</style>
