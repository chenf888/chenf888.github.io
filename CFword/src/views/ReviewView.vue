<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useReview } from '../composables/useReview'
import { useHotkeys } from '../composables/useHotkeys'
import { useSwipe } from '../composables/useSwipe'
import type { RatingValue } from '../types'
import WordCard from '../components/WordCard.vue'
import RatingBar from '../components/RatingBar.vue'
import QuestionType from '../components/QuestionType.vue'
import ProgressBar from '../components/ProgressBar.vue'
import SkeletonCard from '../components/SkeletonCard.vue'
import ErrorState from '../components/ErrorState.vue'

const router = useRouter()
const { session, current, status, speakCurrent, beginQuestion, rate, quit } =
  useReview()

async function onRate(r: RatingValue): Promise<void> {
  await rate(r)
}

function onAnswer(v: string): void {
  const item = session.current
  if (!item) return
  if (item.question?.choices) session.answerChoice(v)
  else session.answerSpelling(v)
}

const revealed = computed(() => status.value === 'showingAnswer')

const defaultRating = computed<RatingValue | null>(() => {
  if (!revealed.value) return null
  // 答错时默认高亮「忘记」
  return current.value?.correct === false ? 1 : null
})

// 滑动手势：左滑 = 忘记，右滑 = 记得
const swipe = useSwipe({
  onSwipeLeft: () => onRate(1),
  onSwipeRight: () => onRate(3),
})

useHotkeys(() => ({
  ' ': () => {
    if (status.value === 'reviewing') {
      if (current.value?.phase === 'learn') beginQuestion()
      else session.showAnswer()
    }
  },
  Enter: () => {
    if (status.value === 'reviewing') {
      if (current.value?.phase === 'learn') beginQuestion()
      else session.showAnswer()
    }
  },
  '1': () => revealed.value && onRate(1),
  '2': () => revealed.value && onRate(2),
  '3': () => revealed.value && onRate(3),
  '4': () => revealed.value && onRate(4),
  r: () => revealed.value && speakCurrent(),
  Escape: () => quit(),
}))

function formatMs(ms: number): string {
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s} 秒`
  return `${Math.floor(s / 60)} 分 ${s % 60} 秒`
}
</script>

<template>
  <div class="review">
    <!-- 加载中 -->
    <div v-if="status === 'loading'" class="review__loading">
      <SkeletonCard :lines="4" />
    </div>

    <!-- 错误 -->
    <ErrorState
      v-else-if="status === 'error'"
      title="复习加载失败"
      :description="session.error ?? undefined"
      @retry="router.push('/')"
    />

    <!-- 空闲：未开始 -->
    <div v-else-if="status === 'idle'" class="review__idle">
      <p>尚未开始复习</p>
      <button type="button" @click="router.push('/')">返回选择词库</button>
    </div>

    <!-- 总结 -->
    <section v-else-if="status === 'summary'" class="summary">
      <h2 class="summary__title">本轮完成</h2>
      <div class="summary__grid">
        <div class="summary__item">
          <span class="summary__num">{{ session.reviewedCount - session.newCount }}</span>
          <span class="summary__label">复习</span>
        </div>
        <div class="summary__item">
          <span class="summary__num">{{ session.newCount }}</span>
          <span class="summary__label">新学</span>
        </div>
        <div class="summary__item">
          <span class="summary__num">{{ Math.round(session.accuracy * 100) }}%</span>
          <span class="summary__label">正确率</span>
        </div>
        <div class="summary__item">
          <span class="summary__num">{{ formatMs(session.elapsedMs) }}</span>
          <span class="summary__label">用时</span>
        </div>
      </div>
      <button type="button" class="summary__btn" @click="router.push('/')">返回首页</button>
    </section>

    <!-- 复习中 / 展示答案 -->
    <template v-else>
      <header class="review__top">
        <button type="button" class="review__quit" aria-label="退出" @click="quit">退出</button>
        <ProgressBar :ratio="session.progress.ratio" class="review__progress" />
        <span class="review__count">
          {{ session.progress.done }} / {{ session.progress.total }}
        </span>
      </header>

      <transition name="card" mode="out-in">
        <div v-if="current" :key="current.card.wordId" class="review__card">
          <!-- 新卡学习：完整词卡 -->
          <template v-if="current.phase === 'learn'">
            <WordCard :word="current.word" :show-examples="true" @speak="speakCurrent" />
            <p class="review__hint">先浏览单词，然后进入练习</p>
            <button type="button" class="review__cta" @click="beginQuestion">开始学习</button>
          </template>

          <!-- 主动回忆题 -->
          <template v-else>
            <div class="review__type">
              <button
                v-if="current.question?.type === 'listening'"
                type="button"
                class="review__play"
                @click="speakCurrent"
              >
                播放
              </button>
              {{ current.question?.prompt }}
            </div>
            <QuestionType
              :question="current.question"
              :revealed="revealed"
              @answer="onAnswer"
            />
          </template>
        </div>
      </transition>

      <!-- 答案与评分 -->
      <transition name="answer">
        <div
          v-if="revealed && current"
          class="review__answer"
          @touchstart.passive="swipe.onStart"
          @touchmove.passive="swipe.onMove"
          @touchend.passive="swipe.onEnd"
        >
          <div
            class="review__swipe-bg review__swipe-bg--left"
            :style="{ opacity: Math.min(1, swipe.dx.value < 0 ? -swipe.dx.value / 60 : 0) }"
          >忘记</div>
          <div
            class="review__swipe-bg review__swipe-bg--right"
            :style="{ opacity: Math.min(1, swipe.dx.value > 0 ? swipe.dx.value / 60 : 0) }"
          >记得</div>
          <div
            class="review__answer-inner"
            :style="{ transform: `translateX(${swipe.dx.value}px)` }"
          >
            <WordCard :word="current.word" @speak="speakCurrent" />
          </div>
          <RatingBar :default-rating="defaultRating" @rate="onRate" />
        </div>
      </transition>
    </template>
  </div>
</template>

<style scoped>
.review {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 56px - 32px);
}
.review__loading {
  padding-top: var(--space-6);
}
.review__idle {
  text-align: center;
  padding: var(--space-12) 0;
}
.review__idle p {
  color: var(--color-text-muted);
}
.review__idle button,
.summary__btn {
  min-height: 48px;
  padding: 0 var(--space-6);
  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: #fff;
  font-weight: 600;
}
.review__top {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
}
.review__quit {
  min-height: 40px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-muted);
  font-size: 0.875rem;
}
.review__progress {
  flex: 1;
}
.review__count {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
}
.review__card {
  flex: 1;
}
.review__hint {
  text-align: center;
  color: var(--color-text-muted);
  font-size: 0.875rem;
  margin: var(--space-4) 0;
}
.review__cta {
  display: block;
  width: 100%;
  min-height: 48px;
  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: #fff;
  font-weight: 600;
}
.review__type {
  margin-bottom: var(--space-4);
  font-size: 1.125rem;
  color: var(--color-text-muted);
}
.review__play {
  cursor: pointer;
  font-size: 0.875rem;
  min-height: 36px;
  padding: 0 var(--space-3);
  border-radius: 999px;
  background: var(--color-border);
  color: var(--color-primary);
  font-weight: 600;
}
.review__answer {
  position: relative;
  margin-top: var(--space-8);
  padding-bottom: var(--space-6);
  display: grid;
  gap: var(--space-6);
  overflow: hidden;
}
.review__answer-inner {
  transition: transform var(--dur-base) var(--ease-standard);
}
.review__swipe-bg {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 88px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #fff;
  border-radius: var(--radius-lg);
}
.review__swipe-bg--left {
  left: 0;
  background: var(--color-danger);
}
.review__swipe-bg--right {
  right: 0;
  background: var(--color-success);
}

.summary {
  text-align: center;
  padding: var(--space-8) 0;
}
.summary__title {
  margin: 0 0 var(--space-6);
  font-size: 1.5rem;
}
.summary__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
  margin-bottom: var(--space-8);
}
.summary__item {
  display: flex;
  flex-direction: column;
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
}
.summary__num {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
}
.summary__label {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}
</style>