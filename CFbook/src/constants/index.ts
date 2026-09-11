import type {
  CategoryKey,
  ReaderSettings,
} from '@/types'

/** 分类 Tab：推荐 / 五大分类 / 已完结 */
export const CATEGORY_TABS: CategoryKey[] = [
  'recommend',
  '玄幻',
  '都市',
  '言情',
  '悬疑',
  '科幻',
  'completed',
]

/** localStorage 键名 */
export const STORAGE_KEYS = {
  readerSettings: 'novel-reader:settings',
  books: 'novel-reader:books',
} as const

/** IndexedDB 数据库名与版本 */
export const DB_NAME = 'novel-reader'
export const DB_VERSION = 1

/** 阅读器四种字体栈 */
export const READER_FONTS = {
  system:
    "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif",
  song: "'Songti SC', 'SimSun', 'STSong', serif",
  hei: "'Heiti SC', 'SimHei', 'Microsoft YaHei', sans-serif",
  kai: "'Kaiti SC', 'KaiTi', 'STKaiti', serif",
} as const

export const FONT_OPTIONS = [
  { key: 'system', label: '系统' },
  { key: 'song', label: '宋体' },
  { key: 'hei', label: '黑体' },
  { key: 'kai', label: '楷体' },
] as const

export const LINE_HEIGHT_PRESETS = [1.4, 1.8, 2.2, 2.8]

export const PAGE_MODES = [
  { key: 'scroll', label: '滚动' },
  { key: 'slide', label: '滑动' },
  { key: 'flip', label: '翻页' },
  { key: 'none', label: '无翻页' },
] as const

export const THEME_KEYS = ['light', 'sepia', 'green', 'gray', 'dark'] as const

/** 阅读器默认设置 */
export const DEFAULT_READER_SETTINGS: ReaderSettings = {
  fontSize: 18,
  lineHeight: 1.8,
  fontFamily: 'system',
  letterSpacing: 0,
  paragraphIndent: true,
  textAlign: 'justify',
  theme: 'light',
  pageMargin: 24,
  pageMode: 'scroll',
  brightness: 1.0,
  autoLoadNext: true,
  showReadingTime: false,
}

/** 字号 / 页边距 / 亮度等调节边界 */
export const FONT_SIZE = { min: 12, max: 32 } as const
export const LINE_HEIGHT = { min: 1.2, max: 3.0 } as const
export const LETTER_SPACING = { min: 0, max: 4 } as const
export const PAGE_MARGIN = { min: 8, max: 48 } as const
export const BRIGHTNESS = { min: 0.3, max: 1.0 } as const

/** 导入文件限制 */
export const MAX_IMPORT_SIZE = 50 * 1024 * 1024
export const WARN_IMPORT_SIZE = 20 * 1024 * 1024

/** 封面降级渐变色板（按书名首字哈希取色） */
export const COVER_GRADIENTS = [
  'linear-gradient(135deg,#6E0E00,#D13A16)',
  'linear-gradient(135deg,#1F3A5F,#3B6EF6)',
  'linear-gradient(135deg,#2F4A2F,#4E9B57)',
  'linear-gradient(135deg,#5F4A1F,#D49B2E)',
  'linear-gradient(135deg,#4A2F5F,#8B5ED6)',
]