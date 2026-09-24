<script setup lang="ts">
import type { WordRecord } from '../types'

defineProps<{
  word: WordRecord
  showExamples?: boolean
}>()
defineEmits<{ (e: 'speak'): void }>()
</script>

<template>
  <article class="word-card">
    <header class="word-card__head">
      <div class="word-card__word">
        {{ word.word }}
        <button
          class="word-card__speak"
          type="button"
          aria-label="播放发音"
          @click="$emit('speak')"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
          </svg>
        </button>
      </div>
      <div class="word-card__meta">
        <span v-if="word.phonetic" class="word-card__phonetic">{{ word.phonetic }}</span>
        <span v-if="word.pos" class="word-card__pos">{{ word.pos }}</span>
      </div>
    </header>

    <div class="word-card__senses">
      <div v-for="(sense, i) in word.senses" :key="i" class="word-card__sense">
        <p class="word-card__cn">{{ sense.definition_cn }}</p>
        <p v-if="sense.definition_en" class="word-card__en">{{ sense.definition_en }}</p>
        <ul v-if="showExamples && sense.examples?.length" class="word-card__examples">
          <li v-for="(ex, j) in sense.examples" :key="j">
            <span class="word-card__ex-en">{{ ex.en }}</span>
            <span class="word-card__ex-cn">{{ ex.cn }}</span>
          </li>
        </ul>
      </div>
    </div>

    <footer v-if="word.collocations?.length || word.root_affix" class="word-card__extra">
      <p v-if="word.collocations?.length" class="word-card__collocations">
        搭配：{{ word.collocations.join('、') }}
      </p>
      <p v-if="word.root_affix" class="word-card__root">词根：{{ word.root_affix }}</p>
    </footer>
  </article>
</template>

<style scoped>
.word-card {
  padding: var(--space-6);
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
}
.word-card__word {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-size: clamp(2rem, 8vw, 3rem);
  font-weight: 700;
  line-height: 1.2;
  color: var(--color-text);
}
.word-card__speak {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  color: var(--color-primary);
  background: var(--color-border);
  transition: transform var(--dur-press) var(--ease-standard);
}
.word-card__speak:active {
  transform: scale(0.92);
}
.word-card__meta {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  margin-top: var(--space-1);
  color: var(--color-text-muted);
}
.word-card__phonetic {
  font-size: 1rem;
}
.word-card__pos {
  font-size: 0.875rem;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--color-border);
}
.word-card__senses {
  margin-top: var(--space-4);
}
.word-card__sense + .word-card__sense {
  margin-top: var(--space-3);
}
.word-card__cn {
  margin: 0;
  font-size: 1.125rem;
  line-height: 1.6;
  color: var(--color-text);
}
.word-card__en {
  margin: var(--space-1) 0 0;
  color: var(--color-text-muted);
}
.word-card__examples {
  margin: var(--space-2) 0 0;
  padding-left: var(--space-4);
  list-style: none;
}
.word-card__examples li {
  display: flex;
  flex-direction: column;
  margin-bottom: var(--space-1);
  font-size: 0.9375rem;
}
.word-card__ex-en {
  color: var(--color-text);
}
.word-card__ex-cn {
  color: var(--color-text-muted);
}
.word-card__extra {
  margin-top: var(--space-4);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border);
  font-size: 0.875rem;
  color: var(--color-text-muted);
}
.word-card__extra p {
  margin: 0 0 var(--space-1);
}
</style>