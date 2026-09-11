/** 从文件名与正文猜测书名 / 作者。 */

/** 建议书名：优先正文首行（若像书名），否则用去扩展名的文件名 */
export function suggestTitle(fileName: string, rawText: string): string {
  const base = fileName.replace(/\.[^.]+$/, '').trim()
  const firstLine = rawText.split('\n')[0]?.trim() ?? ''
  const looksLikeTitle =
    firstLine.length > 0 &&
    firstLine.length <= 30 &&
    !/作者|^第.{0,6}[章卷节回部篇]|^chapter\s+/i.test(firstLine)
  return looksLikeTitle ? firstLine : base
}

/** 建议作者：匹配「作者：xxx」/「作者 xxx」 */
export function suggestAuthor(rawText: string): string {
  const m = rawText.match(/作者[：:]\s*([^\n]{1,20})/)
  if (m) return m[1].trim()
  return ''
}