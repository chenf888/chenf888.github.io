<script setup lang="ts">
defineProps<{
  title: string
  description?: string
  actionText?: string
}>()
defineEmits<{ (e: 'action'): void }>()
</script>

<template>
  <div class="empty">
    <div class="empty__icon" aria-hidden="true">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
      </svg>
    </div>
    <h3 class="empty__title">{{ title }}</h3>
    <p v-if="description" class="empty__desc">{{ description }}</p>
    <button v-if="actionText" class="empty__action" @click="$emit('action')">
      {{ actionText }}
    </button>
  </div>
</template>

<style scoped>
.empty {
  text-align: center;
  padding: var(--space-12) var(--space-6);
}
.empty__icon {
  color: var(--color-text-muted);
  display: inline-flex;
  margin-bottom: var(--space-3);
}
.empty__title {
  margin: 0 0 var(--space-2);
  font-size: 1.125rem;
  color: var(--color-text);
}
.empty__desc {
  margin: 0 0 var(--space-6);
  color: var(--color-text-muted);
}
.empty__action {
  min-height: 44px;
  padding: 0 var(--space-6);
  border-radius: var(--radius-pill);
  background: var(--btn-bg);
  color: var(--btn-text);
  font-weight: 600;
  transition: transform var(--dur-press) var(--ease-standard),
    opacity var(--dur-fast) var(--ease-standard);
}
.empty__action:hover {
  opacity: 0.9;
}
.empty__action:active {
  transform: scale(0.97);
}
</style>