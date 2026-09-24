import { importWords } from '../db/wordRepo'
import type { Word } from '../types'

interface ImportMessage {
  deckId: string
  words: Word[]
  sourceVersion: string
}

self.onmessage = async (e: MessageEvent<ImportMessage>) => {
  const { deckId, words, sourceVersion } = e.data
  try {
    await importWords(deckId, words, sourceVersion)
    ;(self as unknown as Worker).postMessage({ ok: true })
  } catch (err) {
    ;(self as unknown as Worker).postMessage({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    })
  }
}