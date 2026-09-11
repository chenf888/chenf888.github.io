export type NovelStatus = 'serializing' | 'completed'

export type NovelSource = 'preset' | 'imported'

export interface Novel {
  id: string
  title: string
  author: string
  cover: string
  intro: string
  tags: string[]
  category: string
  status: NovelStatus
  wordCount: number
  chapterCount: number
  updatedAt: string
  rating: number
  source: NovelSource
  encoding?: string
  importedAt?: number
  originalFileName?: string
}

export interface Chapter {
  id: string
  novelId: string
  index: number
  title: string
  content: string
  wordCount: number
}

export type ChapterMeta = Omit<Chapter, 'content'>

export interface ReaderSettings {
  fontSize: number
  lineHeight: number
  fontFamily: 'system' | 'song' | 'hei' | 'kai'
  letterSpacing: number
  paragraphIndent: boolean
  textAlign: 'left' | 'justify'
  theme: 'light' | 'sepia' | 'green' | 'gray' | 'dark'
  pageMargin: number
  pageMode: 'scroll' | 'slide' | 'flip' | 'none'
  brightness: number
  autoLoadNext: boolean
  showReadingTime: boolean
}

export interface ReadingProgress {
  novelId: string
  chapterId: string
  chapterIndex: number
  scrollPercent: number
  pageIndex: number
  updatedAt: number
}

export interface ShelfItem {
  novelId: string
  addedAt: number
}

export type CategoryKey =
  | 'recommend'
  | '玄幻'
  | '都市'
  | '言情'
  | '悬疑'
  | '科幻'
  | 'completed'

export interface PresetNovelManifestEntry {
  id: string
  title: string
  author: string
  textFile: string
  coverFile?: string
  category: string
  tags: string[]
  intro: string
  status: NovelStatus
  rating: number
  updatedAt: string
}

export type PresetNovelManifest = PresetNovelManifestEntry[]

export type ImportStage =
  | 'pending'
  | 'reading'
  | 'detecting'
  | 'decoding'
  | 'splitting'
  | 'saving'
  | 'done'
  | 'error'

export interface ImportTask {
  id: string
  fileName: string
  fileSize: number
  stage: ImportStage
  progress: number
  error?: string
  resultNovelId?: string
}

export interface ParsedChapter {
  index: number
  title: string
  content: string
  wordCount: number
}

export interface ParsedBook {
  title: string
  author: string
  encoding: string
  chapters: ParsedChapter[]
  wordCount: number
  matchedHeadingCount: number
}

export interface ImportPreview {
  fileName: string
  fileSize: number
  detectedEncoding: string
  encodingConfidence: number
  suggestedTitle: string
  suggestedAuthor: string
  chapterCount: number
  wordCount: number
  firstChapterTitles: string[]
  matchedHeadingCount: number
  rawText: string
}

export interface ShelfBackup {
  version: 1
  exportedAt: number
  shelf: ShelfItem[]
  progressMap: Record<string, ReadingProgress>
  recentIds: string[]
  importedBooks: Array<
    Pick<
      Novel,
      | 'id'
      | 'title'
      | 'author'
      | 'category'
      | 'tags'
      | 'chapterCount'
      | 'wordCount'
    >
  >
}