import type { DeckIndex, DeckInfo, Word } from '../types'

/** 基于部署 base 路径拼接资源地址（兼容 GitHub Pages 子路径）。 */
function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL
  return `${base}${path}`
}

/** 拉取 JSON 并在失败时抛出可读错误。 */
async function fetchJson<T>(path: string): Promise<T> {
  let res: Response
  try {
    res = await fetch(assetUrl(path))
  } catch {
    throw new Error(`网络错误，无法加载 ${path}`)
  }
  if (!res.ok) {
    throw new Error(`加载 ${path} 失败（HTTP ${res.status}）`)
  }
  return (await res.json()) as T
}

/** 校验单词数组，返回错误信息列表（空数组表示合法）。 */
export function validateWords(data: unknown): string[] {
  const errors: string[] = []
  if (!Array.isArray(data)) {
    return ['词库必须是 JSON 数组']
  }
  if (data.length === 0) {
    return ['词库为空']
  }
  const seen = new Set<string>()
  data.forEach((item, i) => {
    if (typeof item !== 'object' || item === null) {
      errors.push(`第 ${i + 1} 条不是对象`)
      return
    }
    const w = item as Partial<Word>
    if (typeof w.id !== 'string' || !w.id) {
      errors.push(`第 ${i + 1} 条缺少有效 id`)
    } else if (seen.has(w.id)) {
      errors.push(`id 重复: ${w.id}`)
    } else {
      seen.add(w.id)
    }
    if (typeof w.word !== 'string' || !w.word.trim()) {
      errors.push(`第 ${i + 1} 条缺少 word`)
    }
    const senses = w.senses
    if (!Array.isArray(senses) || senses.length === 0) {
      errors.push(`第 ${i + 1} 条缺少 senses`)
    } else if (
      typeof senses[0]?.definition_cn !== 'string' ||
      !senses[0].definition_cn.trim()
    ) {
      errors.push(`第 ${i + 1} 条 senses[0].definition_cn 必填`)
    }
  })
  return errors
}

/** 加载词库索引目录。 */
export async function loadDeckIndex(): Promise<DeckIndex> {
  const data = await fetchJson<DeckIndex>('data/index.json')
  if (!data || !Array.isArray(data.decks)) {
    throw new Error('词库索引格式错误')
  }
  return data
}

/** 加载指定词库的单词数组并校验。 */
export async function loadDeckWords(deck: DeckInfo): Promise<Word[]> {
  const data = await fetchJson<unknown>(`data/${deck.file}`)
  const errors = validateWords(data)
  if (errors.length > 0) {
    throw new Error(`词库「${deck.name}」校验失败：${errors.slice(0, 5).join('；')}`)
  }
  return data as Word[]
}