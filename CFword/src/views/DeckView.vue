<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDeckStore } from '../stores/deck'
import { useSessionStore } from '../stores/session'
import { getWordsByDeck } from '../db/wordRepo'
import { countCards } from '../db/cardRepo'
import type { WordRecord } from '../types'
import SkeletonCard from '../components/SkeletonCard.vue'
import ErrorState from '../components/ErrorState.vue'
import EmptyState from '../components/EmptyState.vue'

const route = useRoute()
const router = useRouter()
const deckStore = useDeckStore()
const session = useSessionStore()

const deckId = computed(() => String(route.params.id ?? ''))
const words = ref<WordRecord[]>([])
const doneCards = ref(0)
const loading = ref(true)
const error = ref<string | null>(null)
const busy = ref(false)

const deck = computed(() => deckStore.decks.find((d) => d.id === deckId.value))

onMounted(async () => {
  await load()
})

async function load(): Promise<void> {
  loading.value = true
  error.value = null
  try {
    if (!deckStore.index) await deckStore.loadIndex()
    if (!deck.value) {
      error.value = '词库不存在'
      return
    }
    await deckStore.loadDeck(deckId.value)
    words.value = await getWordsByDeck(deckId.value)
    doneCards.value = await countCards(deckId.value)
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

async function startLearn(): Promise<void> {
  busy.value = true
  try {
    await session.start(deckId.value)
    router.push('/review')
  } finally {
    busy.value = false
  }
}

async function removeDeck(): Promise<void> {
  if (!confirm(`确定删除词库「${deck.value?.name}」及其学习记录？`)) return
  await deckStore.removeDeck(deckId.value)
  router.push('/')
}
</script>

<template>
  <div class="deck-view">
    <button type="button" class="back" @click="router.push('/')">← 返回</button>

    <ErrorState v-if="error" title="加载失败" :description="error" @retry="load" />
    <div v-else-if="loading" class="deck-view__loading">
      <SkeletonCard :lines="4" />
    </div>

    <template v-else>
      <header class="deck-view__head">
        <h2>{{ deck?.name }}</h2>
        <p>{{ deck?.description }}</p>
        <p class="deck-view__meta">已学 {{ doneCards }} / {{ words.length }} 词</p>
        <div class="deck-view__actions">
          <button type="button" class="btn-primary" :disabled="busy" @click="startLearn">
            开始学习
          </button>
          <button type="button" class="btn-danger" @click="removeDeck">删除词库</button>
        </div>
      </header>

      <EmptyState
        v-if="words.length === 0"
        title="词库为空"
        description="替换 public/data/ 下的 JSON 后重新部署即可更新词库。"
      />

      <ul v-else class="word-list">
        <li v-for="w in words" :key="w.id" class="word-list__item">
          <div class="word-list__main">
            <span class="word-list__word">{{ w.word }}</span>
            <span class="word-list__phonetic">{{ w.phonetic }}</span>
            <span class="word-list__pos">{{ w.pos }}</span>
          </div>
          <span class="word-list__cn">{{ w.senses[0]?.definition_cn }}</span>
        </li>
      </ul>
    </template>
  </div>
</template>

<style scoped>
.back {
  min-height: 40px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  margin-bottom: var(--space-4);
}
.deck-view__loading {
  padding-top: var(--space-6);
}
.deck-view__head h2 {
  margin: 0 0 var(--space-2);
}
.deck-view__head p {
  margin: 0 0 var(--space-2);
  color: var(--color-text-muted);
}
.deck-view__meta {
  font-variant-numeric: tabular-nums;
}
.deck-view__actions {
  display: flex;
  gap: var(--space-3);
  margin: var(--space-4) 0;
}
.btn-primary,
.btn-danger {
  min-height: 48px;
  padding: 0 var(--space-5);
  border-radius: var(--radius-md);
  color: #fff;
  font-weight: 600;
}
.btn-primary {
  background: var(--color-primary);
}
.btn-danger {
  background: var(--color-danger);
}
.word-list {
  list-style: none;
  margin: var(--space-4) 0 0;
  padding: 0;
}
.word-list__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-3);
  border-bottom: 1px solid var(--color-border);
}
.word-list__main {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
}
.word-list__word {
  font-weight: 700;
  font-size: 1.125rem;
}
.word-list__phonetic {
  color: var(--color-text-muted);
  font-size: 0.875rem;
}
.word-list__pos {
  color: var(--color-text-muted);
  font-size: 0.75rem;
  padding: 1px 6px;
  border-radius: 999px;
  background: var(--color-border);
}
.word-list__cn {
  color: var(--color-text-muted);
  text-align: right;
}
</style>