import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { DeckIndex, DeckInfo, Word, WordRecord } from '../types'
import { loadDeckIndex, loadDeckWords } from '../data/wordLoader'
import { importWords, getWordsByDeck, countWords, deleteDeck } from '../db/wordRepo'
import { countCards } from '../db/cardRepo'
import { db } from '../db/schema'

const LOADED_KEY_PREFIX = 'deck_loaded_'

/** 大批量词库导入交给 Web Worker，避免阻塞主线程。 */
function importViaWorker(
  deckId: string,
  words: Word[],
  version: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL('../workers/wordImport.worker.ts', import.meta.url),
      { type: 'module' },
    )
    worker.onmessage = (e: MessageEvent<{ ok: boolean; error?: string }>) => {
      worker.terminate()
      if (e.data.ok) resolve()
      else reject(new Error(e.data.error ?? '词库导入失败'))
    }
    worker.onerror = (e) => {
      worker.terminate()
      reject(new Error(e.message))
    }
    worker.postMessage({ deckId, words, sourceVersion: version })
  })
}

export const useDeckStore = defineStore('deck', () => {
  const index = ref<DeckIndex | null>(null)
  const currentDeckId = ref<string | null>(null)
  const loadingIndex = ref(false)
  const loadingDeck = ref(false)
  const error = ref<string | null>(null)
  /** 当前 deck 已载入内存的词条（用于出题干扰项池）。 */
  const currentWords = ref<WordRecord[]>([])

  const decks = computed<DeckInfo[]>(() => index.value?.decks ?? [])
  const currentDeck = computed<DeckInfo | undefined>(() =>
    decks.value.find((d) => d.id === currentDeckId.value),
  )

  /** 加载词库索引目录，并动态挂载自定义词库（若有）。 */
  async function loadIndex(): Promise<void> {
    loadingIndex.value = true
    error.value = null
    try {
      index.value = await loadDeckIndex()
      await ensureCustomDeck()
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
      index.value = null
    } finally {
      loadingIndex.value = false
    }
  }

  /** 若存在自定义词条，则动态加入词库列表。 */
  async function ensureCustomDeck(): Promise<void> {
    if (!index.value) return
    const count = await countWords('custom')
    const has = index.value.decks.some((d) => d.id === 'custom')
    if (count > 0 && !has) {
      index.value.decks.push({
        id: 'custom',
        name: '自定义词库',
        description: '通过 CSV / 导入创建',
        file: '',
        wordCount: count,
        language: 'en',
        version: '',
      })
    } else if (count === 0 && has) {
      index.value.decks = index.value.decks.filter((d) => d.id !== 'custom')
    }
  }

  /** 将自定义词条导入自定义词库。 */
  async function importCustomWords(words: Word[]): Promise<void> {
    await importWords('custom', words, new Date().toISOString().slice(0, 10))
    await db.settings.put({ key: LOADED_KEY_PREFIX + 'custom', value: 'custom' })
    await ensureCustomDeck()
    if (currentDeckId.value === 'custom') {
      currentWords.value = await getWordsByDeck('custom')
    }
  }

  /** 判断某 deck 是否已导入过 IndexedDB。 */
  async function isDeckLoaded(deckId: string): Promise<boolean> {
    return (await db.settings.get(LOADED_KEY_PREFIX + deckId)) != null
  }

  /** 将 deck 词条导入 IndexedDB，并为当前内存词条池赋值。 */
  async function loadDeck(deckId: string): Promise<void> {
    const deck = decks.value.find((d) => d.id === deckId)
    if (!deck) throw new Error('词库不存在')

    // 自定义词库已在 IndexedDB，无需从文件加载
    const isCustom = deckId === 'custom'
    if (!isCustom) {
      const alreadyLoaded = await isDeckLoaded(deckId)
      if (!alreadyLoaded) {
        loadingDeck.value = true
        error.value = null
        try {
          const words = await loadDeckWords(deck)
          const version = deck.version ?? ''
          if (words.length > 500) {
            await importViaWorker(deckId, words, version)
          } else {
            await importWords(deckId, words, version)
          }
          await db.settings.put({
            key: LOADED_KEY_PREFIX + deckId,
            value: deck.version ?? '',
          })
        } catch (e) {
          error.value = e instanceof Error ? e.message : String(e)
          throw e
        } finally {
          loadingDeck.value = false
        }
      }
    }

    currentDeckId.value = deckId
    currentWords.value = await getWordsByDeck(deckId)
  }

  /** 词库学习进度：已学卡 / 总词数。 */
  async function deckProgress(deckId: string): Promise<{ done: number; total: number }> {
    const [total, done] = await Promise.all([
      countWords(deckId),
      countCards(deckId),
    ])
    return { done, total }
  }

  /** 删除词库（含词条与复习卡）。 */
  async function removeDeck(deckId: string): Promise<void> {
    await deleteDeck(deckId)
    await db.settings.delete(LOADED_KEY_PREFIX + deckId)
    if (currentDeckId.value === deckId) {
      currentDeckId.value = null
      currentWords.value = []
    }
  }

  return {
    index,
    decks,
    currentDeckId,
    currentDeck,
    currentWords,
    loadingIndex,
    loadingDeck,
    error,
    loadIndex,
    loadDeck,
    importCustomWords,
    isDeckLoaded,
    deckProgress,
    removeDeck,
  }
})