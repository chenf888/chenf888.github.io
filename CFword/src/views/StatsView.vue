<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useDeckStore } from '../stores/deck'
import { getCardsByDeck } from '../db/cardRepo'
import { getLogsByDeck } from '../db/logRepo'
import { getWordsByDeck } from '../db/wordRepo'
import { computeStats, type StatsSnapshot } from '../engine/stats'
import type { ReviewCard, ReviewLog, WordRecord } from '../types'
import EmptyState from '../components/EmptyState.vue'
import SkeletonCard from '../components/SkeletonCard.vue'

const deckStore = useDeckStore()
const selectedDeckId = ref<string | null>(null)
const stats = ref<StatsSnapshot | null>(null)
const loading = ref(false)

onMounted(async () => {
  if (!deckStore.index) await deckStore.loadIndex()
  if (deckStore.decks.length > 0) {
    selectedDeckId.value = deckStore.decks[0]!.id
    await loadStats()
  }
})

function computeViaWorker(
  cards: ReviewCard[],
  logs: ReviewLog[],
  words: WordRecord[],
): Promise<StatsSnapshot> {
  const data = { cards, logs, words, now: Date.now(), days: 84 }
  return new Promise((resolve) => {
    try {
      const worker = new Worker(
        new URL('../workers/stats.worker.ts', import.meta.url),
        { type: 'module' },
      )
      worker.onmessage = (e: MessageEvent<StatsSnapshot>) => {
        worker.terminate()
        resolve(e.data)
      }
      worker.onerror = () => {
        worker.terminate()
        resolve(computeStats(cards, logs, words, Date.now()))
      }
      worker.postMessage(data)
    } catch {
      resolve(computeStats(cards, logs, words, Date.now()))
    }
  })
}

async function loadStats(): Promise<void> {
  if (!selectedDeckId.value) return
  loading.value = true
  try {
    const [cards, logs, words] = await Promise.all([
      getCardsByDeck(selectedDeckId.value),
      getLogsByDeck(selectedDeckId.value),
      getWordsByDeck(selectedDeckId.value),
    ])
    stats.value = await computeViaWorker(cards, logs, words)
  } finally {
    loading.value = false
  }
}

function onChangeDeck(): void {
  stats.value = null
  loadStats()
}

function heatColor(count: number): string {
  if (count === 0) return 'var(--color-border)'
  const level = Math.min(4, count)
  const alpha = [0.2, 0.4, 0.6, 0.85][level - 1] ?? 0.2
  return `color-mix(in srgb, var(--color-primary) ${alpha * 100}%, transparent)`
}

const totalFuture = computed(() =>
  stats.value ? stats.value.future.reduce((s, f) => s + f.count, 0) : 0,
)

function formatDuration(ms: number): string {
  const m = Math.round(ms / 60000)
  if (m < 60) return `${m} 分钟`
  const h = Math.floor(m / 60)
  return `${h} 小时 ${m % 60} 分`
}
</script>

<template>
  <div class="stats">
    <label class="stats__picker">
      <span>词库</span>
      <select v-model="selectedDeckId" @change="onChangeDeck">
        <option v-for="d in deckStore.decks" :key="d.id" :value="d.id">
          {{ d.name }}
        </option>
      </select>
    </label>

    <div v-if="loading" class="stats__loading">
      <SkeletonCard :lines="5" />
    </div>

    <EmptyState
      v-else-if="!stats"
      title="暂无统计数据"
      description="完成一次复习后即可查看统计。"
    />

    <template v-else>
      <div class="stats__cards">
        <div class="stat">
          <span class="stat__num">{{ Math.round(stats.retention * 100) }}%</span>
          <span class="stat__label">记忆保持率</span>
        </div>
        <div class="stat">
          <span class="stat__num">{{ stats.totalReviews }}</span>
          <span class="stat__label">累计复习</span>
        </div>
        <div class="stat">
          <span class="stat__num">{{ formatDuration(stats.totalStudyMs) }}</span>
          <span class="stat__label">学习时长</span>
        </div>
        <div class="stat">
          <span class="stat__num">{{ totalFuture }}</span>
          <span class="stat__label">未来30天待复习</span>
        </div>
      </div>

      <section class="stats__block">
        <h3>12 周热力图</h3>
        <div class="heatmap">
          <span
            v-for="d in stats.heatmap"
            :key="d.date"
            class="heatmap__cell"
            :style="{ background: heatColor(d.count) }"
            :title="`${d.date}: ${d.count}`"
          ></span>
        </div>
      </section>

      <section class="stats__block">
        <h3>薄弱词</h3>
        <ul v-if="stats.weakWords.length" class="weak">
          <li v-for="w in stats.weakWords" :key="w.wordId" class="weak__item">
            <span class="weak__word">{{ w.word }}</span>
            <span class="weak__lapses">遗忘 {{ w.lapses }} 次</span>
          </li>
        </ul>
        <p v-else class="stats__empty-line">暂无薄弱词</p>
      </section>
    </template>
  </div>
</template>

<style scoped>
.stats__picker {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
  color: var(--color-text-muted);
}
.stats__picker select {
  min-height: 44px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
}
.stats__loading {
  padding-top: var(--space-6);
}
.stats__cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
  margin-bottom: var(--space-6);
}
.stat {
  display: flex;
  flex-direction: column;
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
}
.stat__num {
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--color-primary);
}
.stat__label {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}
.stats__block {
  margin-bottom: var(--space-6);
}
.stats__block h3 {
  margin: 0 0 var(--space-3);
  font-size: 1rem;
}
.heatmap {
  display: grid;
  grid-template-columns: repeat(14, 1fr);
  gap: 3px;
}
.heatmap__cell {
  aspect-ratio: 1;
  border-radius: 3px;
}
.weak {
  list-style: none;
  margin: 0;
  padding: 0;
}
.weak__item {
  display: flex;
  justify-content: space-between;
  padding: var(--space-3);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  margin-bottom: var(--space-2);
}
.weak__word {
  font-weight: 600;
}
.weak__lapses {
  color: var(--color-danger);
  font-size: 0.875rem;
}
.stats__empty-line {
  color: var(--color-text-muted);
}
</style>