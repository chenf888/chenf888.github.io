import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { RatingValue, ReviewCard, ReviewLog, WordRecord } from '../types'
import {
  getDueReviewCards,
  getNewCards,
  applyReview,
  bulkUpsertCards,
  getUncardedWordIds,
} from '../db/cardRepo'
import { getLogsBetween } from '../db/logRepo'
import { useDeckStore } from './deck'
import { useSettingsStore } from './settings'
import { createCardRecord, reviewCardRecord } from '../engine/srs'
import {
  pickQuestionType,
  generateQuestion,
  isSpellingCorrect,
  type Question,
} from '../engine/questionGenerator'

export type SessionStatus =
  | 'idle'
  | 'loading'
  | 'reviewing'
  | 'showingAnswer'
  | 'summary'
  | 'error'

interface QueueItem {
  card: ReviewCard
  word: WordRecord
  isNew: boolean
  phase: 'learn' | 'question'
  question: Question | null
  correct: boolean | null
  startedAt: number
}

function startOfToday(): number {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export const useSessionStore = defineStore('session', () => {
  const status = ref<SessionStatus>('idle')
  const error = ref<string | null>(null)
  const queue = ref<QueueItem[]>([])
  const index = ref(0)
  const deckId = ref<string | null>(null)

  const startedAt = ref(0)
  const reviewedCount = ref(0)
  const newCount = ref(0)
  const correctCount = ref(0)
  const lastRating = ref<RatingValue | null>(null)

  const current = computed<QueueItem | undefined>(() => queue.value[index.value])
  const progress = computed(() => ({
    done: index.value,
    total: queue.value.length,
    ratio: queue.value.length === 0 ? 0 : index.value / queue.value.length,
  }))
  const accuracy = computed(() =>
    reviewedCount.value === 0 ? 0 : correctCount.value / reviewedCount.value,
  )
  const elapsedMs = computed(() =>
    startedAt.value === 0 ? 0 : Date.now() - startedAt.value,
  )

  /** 构建并开始一轮复习。 */
  async function start(deck: string): Promise<void> {
    const deckStore = useDeckStore()
    const settingsStore = useSettingsStore()
    const settings = settingsStore.settings

    status.value = 'loading'
    error.value = null
    deckId.value = deck

    try {
      // 确保词库已载入内存
      if (deckStore.currentDeckId !== deck) {
        await deckStore.loadDeck(deck)
      }
      const words = deckStore.currentWords
      const now = Date.now()
      const today = startOfToday()

      // 到期复习卡
      const dueCards = await getDueReviewCards(
        deck,
        now,
        settings.reviewLimit,
      )

      // 新卡：受每日上限约束
      const todayLogs = await getLogsBetween(deck, today, now)
      const newLearnedToday = todayLogs.filter((l) => l.previousState === 0).length
      const remainingNew = Math.max(0, settings.newCardsPerDay - newLearnedToday)
      let newCards = await getNewCards(deck, remainingNew)

      // 若新卡不足，从尚未建卡的词中补齐
      if (newCards.length < remainingNew) {
        const needed = remainingNew - newCards.length
        const uncarded = await getUncardedWordIds(deck, needed)
        const built = uncarded.map((id) => createCardRecord(id, deck, new Date()))
        await bulkUpsertCards(built)
        newCards = newCards.concat(
          built.filter((b) => !newCards.some((c) => c.wordId === b.wordId)),
        )
        newCards = newCards.slice(0, remainingNew)
      }

      const wordMap = new Map(words.map((w) => [w.id, w]))
      const pool = words

      const items: QueueItem[] = []
      const seenWordIds = new Set<string>()

      // 先老卡（到期复习），再新卡
      const pushItem = (card: ReviewCard, isNew: boolean) => {
        if (seenWordIds.has(card.wordId)) return
        const word = wordMap.get(card.wordId)
        if (!word) return
        seenWordIds.add(card.wordId)
        const item: QueueItem = {
          card,
          word,
          isNew,
          phase: isNew ? 'learn' : 'question',
          question: null,
          correct: null,
          startedAt: now,
        }
        if (!isNew) {
          const type = pickQuestionType(card.reps + 1, word)
          item.question = generateQuestion(type, word, pool)
        }
        items.push(item)
      }

      for (const c of dueCards) pushItem(c, false)
      for (const c of newCards) pushItem(c, true)

      if (items.length === 0) {
        status.value = 'summary'
        queue.value = []
        index.value = 0
        startedAt.value = now
        return
      }

      queue.value = items
      index.value = 0
      startedAt.value = now
      reviewedCount.value = 0
      newCount.value = 0
      correctCount.value = 0
      lastRating.value = null
      status.value = 'reviewing'
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
      status.value = 'error'
    }
  }

  /** 新卡学习阶段：将完整词卡切换为主动回忆题。 */
  function beginQuestion(): void {
    const item = current.value
    if (!item || item.phase !== 'learn') return
    const type = pickQuestionType(1, item.word)
    const deckStore = useDeckStore()
    item.question = generateQuestion(type, item.word, deckStore.currentWords)
    item.phase = 'question'
  }

  /** 选择题作答，返回是否答对。 */
  function answerChoice(choice: string): boolean {
    const item = current.value
    if (!item || !item.question || item.question.choices == null) return false
    const correct = choice === item.question.answer
    item.correct = correct
    showAnswer()
    return correct
  }

  /** 拼写题作答，返回是否答对。 */
  function answerSpelling(input: string): boolean {
    const item = current.value
    if (!item || !item.question) return false
    const correct = isSpellingCorrect(input, item.question.answer)
    item.correct = correct
    showAnswer()
    return correct
  }

  /** 进入答案展示阶段（显示答案与评分栏）。 */
  function showAnswer(): void {
    if (status.value === 'reviewing') status.value = 'showingAnswer'
  }

  /** 评分并进入下一张。 */
  async function rate(rating: RatingValue): Promise<void> {
    const item = current.value
    if (!item || !deckId.value) return
    const settingsStore = useSettingsStore()
    const settings = settingsStore.settings

    const now = new Date()
    const outcome = reviewCardRecord(item.card, rating, now, {
      maximumInterval: 36500,
      requestRetention: settings.requestRetention,
    })

    const log: ReviewLog = {
      wordId: item.word.id,
      deckId: deckId.value,
      rating,
      responseTimeMs: Date.now() - item.startedAt,
      questionType: item.question?.type ?? 'cn2en',
      reviewedAt: Date.now(),
      previousState: outcome.previousState,
      nextState: outcome.card.state,
    }

    await applyReview(outcome.card, log)

    reviewedCount.value += 1
    if (item.isNew) newCount.value += 1
    if (item.correct) correctCount.value += 1
    lastRating.value = rating

    index.value += 1
    if (index.value >= queue.value.length) {
      status.value = 'summary'
    } else {
      status.value = 'reviewing'
      const nextItem = current.value
      if (nextItem) nextItem.startedAt = Date.now()
    }
  }

  /** 退出复习（未评分卡片状态未变，下次仍到期）。 */
  function quit(): void {
    status.value = 'idle'
    queue.value = []
    index.value = 0
    deckId.value = null
    lastRating.value = null
  }

  /** 结束并清空会话。 */
  function reset(): void {
    quit()
  }

  return {
    status,
    error,
    queue,
    current,
    progress,
    accuracy,
    elapsedMs,
    reviewedCount,
    newCount,
    correctCount,
    lastRating,
    start,
    beginQuestion,
    answerChoice,
    answerSpelling,
    showAnswer,
    rate,
    quit,
    reset,
  }
})