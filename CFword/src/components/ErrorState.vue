<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
defineEmits<{ (e: 'retry'): void }>()
</script>

<template>
  <div class="error" role="alert">
    <div class="error__icon" aria-hidden="true">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M12 8v4"></path>
        <path d="M12 16h.01"></path>
      </svg>
    </div>
    <h3 class="error__title">{{ title }}</h3>
    <p v-if="description" class="error__desc">{{ description }}</p>
    <button class="error__retry" @click="$emit('retry')">重试</button>
  </div>
</template>

<style scoped>
.error {
  text-align: center;
  padding: var(--space-12) var(--space-6);
}
.error__icon {
  color: var(--color-danger);
  display: inline-flex;
  margin-bottom: var(--space-3);
}
.error__title {
  margin: 0 0 var(--space-2);
  font-size: 1.125rem;
  color: var(--color-text);
}
.error__desc {
  margin: 0 0 var(--space-6);
  color: var(--color-text-muted);
}
.error__retry {
  min-height: 44px;
  padding: 0 var(--space-6);
  border-radius: var(--radius-pill);
  background: var(--btn-bg);
  color: var(--btn-text);
  font-weight: 600;
  transition: transform var(--dur-press) var(--ease-standard),
    opacity var(--dur-fast) var(--ease-standard);
}
.error__retry:hover {
  opacity: 0.9;
}
.error__retry:active {
  transform: scale(0.97);
}
</style>