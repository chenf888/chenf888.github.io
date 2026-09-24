<script setup lang="ts">
import type { RatingValue } from '../types'

defineProps<{
  defaultRating?: RatingValue | null
  disabled?: boolean
}>()
defineEmits<{ (e: 'rate', rating: RatingValue): void }>()

const ratings: { value: RatingValue; label: string; key: string; icon: string }[] = [
  { value: 1, label: '忘记', key: '1', icon: '✕' },
  { value: 2, label: '模糊', key: '2', icon: '△' },
  { value: 3, label: '记得', key: '3', icon: '✓' },
  { value: 4, label: '轻松', key: '4', icon: '★' },
]
</script>

<template>
  <div class="rating" role="group" aria-label="评分">
    <button
      v-for="r in ratings"
      :key="r.value"
      type="button"
      class="rating__btn"
      :class="`rating__btn--${r.value}`"
      :disabled="disabled"
      :aria-pressed="defaultRating === r.value"
      @click="$emit('rate', r.value)"
    >
      <span class="rating__icon">{{ r.icon }}</span>
      <span class="rating__label">{{ r.label }}</span>
      <span class="rating__key">{{ r.key }}</span>
    </button>
  </div>
</template>

<style scoped>
.rating {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-2);
}
.rating__btn {
  --c: var(--color-text-muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-height: 56px;
  padding: var(--space-2);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--c);
  transition: transform var(--dur-press) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard), background var(--dur-fast) var(--ease-standard);
}
.rating__btn:active {
  transform: scale(0.97);
}
.rating__btn--1 {
  --c: var(--color-danger);
}
.rating__btn--2 {
  --c: var(--color-warning);
}
.rating__btn--3 {
  --c: var(--color-primary);
}
.rating__btn--4 {
  --c: var(--color-success);
}
.rating__btn[aria-pressed='true'],
.rating__btn:not(:disabled):hover {
  background: color-mix(in srgb, var(--c) 12%, transparent);
  border-color: var(--c);
}
.rating__icon {
  font-size: 1rem;
  line-height: 1;
}
.rating__label {
  font-size: 0.75rem;
  font-weight: 600;
}
.rating__key {
  font-size: 0.625rem;
  opacity: 0.7;
}
.rating__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>