// 全局类型定义

/** 例句 */
export interface Example {
  en: string
  cn: string
}

/** 义项 */
export interface Sense {
  definition_cn: string
  definition_en?: string
  examples?: Example[]
}

/** 词库中的原始词条（JSON 数组元素） */
export interface Word {
  id: string
  word: string
  phonetic?: string
  pos?: string
  senses: Sense[]
  tags?: string[]
  frequency?: number
  collocations?: string[]
  root_affix?: string
  forms?: string[]
  aliases?: string[]
}

/** 入库后的词条（附带所属词库） */
export interface WordRecord extends Word {
  deckId: string
}

/** 词库索引目录项（index.json 的 decks 元素） */
export interface DeckInfo {
  id: string
  name: string
  description?: string
  file: string
  wordCount: number
  language?: string
  version?: string
  sha256?: string
}

/** 词库索引（public/data/index.json 结构） */
export interface DeckIndex {
  version: number
  decks: DeckInfo[]
}

/** 复习卡片（FSRS 现状表），时间戳均为毫秒 */
export interface ReviewCard {
  wordId: string
  deckId: string
  due: number
  stability: number
  difficulty: number
  reps: number
  lapses: number
  state: number
  lastReview: number | null
  elapsedDays: number
  scheduledDays: number
}

/** FSRS 评分档（1=忘记 2=模糊 3=记得 4=轻松） */
export type RatingValue = 1 | 2 | 3 | 4

/** 题型标识 */
export type QuestionType =
  | 'cn2en'
  | 'en2cn'
  | 'spelling'
  | 'listening'
  | 'cloze'
  | 'collocation'

/** 复习日志（历史表） */
export interface ReviewLog {
  id?: number
  wordId: string
  deckId: string
  rating: RatingValue
  responseTimeMs: number
  questionType: QuestionType
  reviewedAt: number
  previousState: number
  nextState: number
}

/** 词库元信息 */
export interface DeckMeta {
  deckId: string
  wordCount: number
  loadedAt: number
  sourceVersion: string
}

/** 用户设置 */
export interface Settings {
  newCardsPerDay: number
  reviewLimit: number
  requestRetention: number
  accent: 'us' | 'uk'
  autoPlay: boolean
  lastBackupAt: number | null
}

/** 轻量/完整备份结构 */
export interface BackupFile {
  schemaVersion: number
  exportedAt: string
  settings: Record<string, unknown>
  deckMeta: DeckMeta[]
  reviewCards: ReviewCard[]
  reviewLogs: ReviewLog[]
  customWords: WordRecord[]
}