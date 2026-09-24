<script setup lang="ts">
defineProps<{ ratio: number }>()
</script>

<template>
  <div class="progress" role="progressbar" :aria-valuenow="Math.round(ratio * 100)" aria-valuemin="0" aria-valuemax="100">
    <div class="progress__fill" :style="{ transform: `scaleX(${ratio})` }"></div>
  </div>
</template>

<style scoped>
.progress {
  height: 6px;
  border-radius: 999px;
  background: var(--color-border);
  overflow: hidden;
}
.progress__fill {
  height: 100%;
  width: 100%;
  transform-origin: left center;
  border-radius: 999px;
  background: var(--color-primary);
  transition: transform var(--dur-slow) var(--ease-standard);
  transform: scaleX(0);
}
</style>