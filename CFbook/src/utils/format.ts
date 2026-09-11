/** 展示格式化工具：字数、章节、文件大小、相对时间。 */

export function formatWordCount(n: number): string {
  if (n >= 10000) {
    const w = n / 10000
    return `${w % 1 === 0 ? w.toFixed(0) : w.toFixed(1)} 万字`
  }
  return `${n.toLocaleString('zh-CN')} 字`
}

export function formatChapterLabel(index: number): string {
  return `第 ${index} 章`
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatRelativeTime(input: string | number): string {
  const t = typeof input === 'number' ? input : new Date(input).getTime()
  if (!Number.isFinite(t)) return ''
  const diff = Date.now() - t
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  if (diff < minute) return '刚刚'
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`
  if (diff < 7 * day) return `${Math.floor(diff / day)} 天前`
  const d = new Date(t)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}