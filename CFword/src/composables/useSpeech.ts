import { ref } from 'vue'

export type Accent = 'us' | 'uk'

/** Web Speech API 封装：处理 voices 异步加载与 iOS 手势限制。 */
export function useSpeech() {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window
  const speaking = ref(false)

  function getVoices(): SpeechSynthesisVoice[] {
    if (!supported) return []
    return window.speechSynthesis.getVoices()
  }

  function pickVoice(accent: Accent): SpeechSynthesisVoice | null {
    const voices = getVoices()
    const wanted = accent === 'us' ? 'en-US' : 'en-GB'
    return (
      voices.find((v) => v.lang.replace('_', '-').startsWith(wanted)) ??
      voices.find((v) => v.lang.toLowerCase().startsWith('en')) ??
      null
    )
  }

  /** 朗读文本。首次需在用户手势下调用（iOS 限制）。 */
  function speak(text: string, accent: Accent = 'us'): void {
    if (!supported) return
    const synth = window.speechSynthesis
    synth.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = accent === 'us' ? 'en-US' : 'en-GB'
    const voice = pickVoice(accent)
    if (voice) u.voice = voice
    u.rate = 0.9
    u.onstart = () => (speaking.value = true)
    u.onend = () => (speaking.value = false)
    u.onerror = () => (speaking.value = false)
    synth.speak(u)
  }

  /** 预加载 voices（应用启动时调用一次）。 */
  function initVoices(): void {
    if (!supported) return
    getVoices()
    window.speechSynthesis.addEventListener('voiceschanged', () => getVoices())
  }

  function stop(): void {
    if (supported) window.speechSynthesis.cancel()
  }

  return { supported, speaking, speak, initVoices, stop }
}