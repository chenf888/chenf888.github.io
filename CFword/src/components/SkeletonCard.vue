<script setup lang="ts">
defineProps<{ lines?: number }>()
</script>

<template>
  <div class="skeleton-card">
    <div class="skeleton skeleton-card__title"></div>
    <div class="skeleton skeleton-card__line" v-for="i in (lines ?? 3)" :key="i"></div>
  </div>
</template>

<style scoped>
.skeleton-card {
  padding: var(--space-6);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
}
.skeleton-card__title {
  width: 40%;
  height: 32px;
  border-radius: var(--radius-sm);
  background: var(--color-border);
  margin-bottom: var(--space-4);
}
.skeleton-card__line {
  height: 14px;
  border-radius: var(--radius-sm);
  background: var(--color-border);
  margin-bottom: var(--space-2);
}
.skeleton-card__line:last-child {
  width: 70%;
  margin-bottom: 0;
}
</style>