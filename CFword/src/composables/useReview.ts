import { computed, watch } from 'vue'
import { useSessionStore } from '../stores/session'
import { useSettingsStore } from '../stores/settings'
import { useSpeech } from './useSpeech'

/**
 * 复习页组合逻辑：整合会话状态机与发音。
 */
export function useReview() {
  const session = useSessionStore()
  const settings = useSettingsStore()
  const speech = useSpeech()

  const current = computed(() => session.current)
  const status = computed(() => session.status)

  /** 朗读当前单词。 */
  function speakCurrent(): void {
    const item = session.current
    if (item) speech.speak(item.word.word, settings.settings.accent)
  }

  // 开启自动发音时，切换题目后自动朗读
  watch(
    () => session.current?.card.wordId,
    (id) => {
      if (id && settings.settings.autoPlay) speakCurrent()
    },
  )

  return {
    session,
    speech,
    current,
    status,
    speakCurrent,
    beginQuestion: session.beginQuestion,
    answerChoice: session.answerChoice,
    answerSpelling: session.answerSpelling,
    showAnswer: session.showAnswer,
    rate: session.rate,
    quit: session.quit,
  }
}