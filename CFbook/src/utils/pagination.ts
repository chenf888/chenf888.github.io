/**
 * 分页算法：把章节段落按容器高度切分为若干页（string[][]）。
 * 离屏测量（getHeight）由调用方提供，本函数保持纯逻辑，可测试。
 */

/** 将章节正文按空行拆分为段落；去掉首行全角空格缩进（由设置项控制缩进） */
export function splitParagraphs(content: string): string[] {
  return content
    .split(/\n+/)
    .map((p) => p.replace(/^[\s\u3000]+/, '').trimEnd())
    .filter((p) => p.length > 0)
}

const SENTENCE_SPLIT = /([。！？；，])/

/** 把超高的长段落按标点切成可装入一页的片段 */
function splitOverflowParagraph(
  paragraph: string,
  measureLine: (text: string) => number,
  pageHeight: number,
): string[] {
  const parts = paragraph.split(SENTENCE_SPLIT)
  const chunks: string[] = []
  let buf = ''
  for (const part of parts) {
    if (!part) continue
    if (buf && measureLine(buf + part) > pageHeight) {
      chunks.push(buf)
      buf = part
    } else {
      buf += part
    }
  }
  if (buf) chunks.push(buf)
  return chunks.length ? chunks : [paragraph]
}

/**
 * @param paragraphs 段落列表
 * @param measureLine 单段正文高度（不含段间距，px）
 * @param gap 段间距（px）
 * @param pageHeight 一页可用高度（px）
 */
export function paginateContent(
  paragraphs: string[],
  measureLine: (text: string) => number,
  gap: number,
  pageHeight: number,
): string[][] {
  const pages: string[][] = []
  let current: string[] = []
  let used = 0

  for (const paragraph of paragraphs) {
    const pieces = splitOverflowParagraph(paragraph, measureLine, pageHeight)
    for (const piece of pieces) {
      const h = measureLine(piece)
      const blockH = h + gap
      if (used + blockH > pageHeight && current.length > 0) {
        pages.push(current)
        current = []
        used = 0
      }
      current.push(piece)
      used += blockH
    }
  }
  if (current.length > 0) pages.push(current)
  return pages
}