/**
 * 文本处理工具：中文数字解析、文本清洗、字数统计、字符串哈希。
 */

const CN_DIGIT: Record<string, number> = {
  零: 0,
  一: 1,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  两: 2,
}

const CN_UNIT: Record<string, number> = {
  十: 10,
  百: 100,
  千: 1000,
  万: 10000,
  亿: 100000000,
}

/** 将「第十二章」「三百」等中文/阿拉伯数字序列解析为整数，失败返回 null */
export function chineseToNumber(input: string): number | null {
  const s = input.trim()
  if (!s) return null
  if (/^\d+$/.test(s)) {
    const n = parseInt(s, 10)
    return Number.isFinite(n) ? n : null
  }
  let total = 0
  let section = 0
  let number = 0
  for (const c of s) {
    if (c in CN_DIGIT) {
      number = CN_DIGIT[c]
    } else if (c in CN_UNIT) {
      const unit = CN_UNIT[c]
      if (unit >= 10000) {
        section = (section + number) * unit
        total += section
        section = 0
        number = 0
      } else {
        section += (number === 0 ? 1 : number) * unit
        number = 0
      }
    } else {
      return null
    }
  }
  return total + section + number
}

/** 统一换行、去除 BOM、全角空格转半角 */
export function cleanText(text: string): string {
  return text
    .replace(/^\ufeff/, '')
    .replace(/\r\n?/g, '\n')
    .replace(/\u00a0/g, ' ')
}

/** 估算中文字数：汉字按 1 字计，连续拉丁/数字串按 1 词计 */
export function countWords(text: string): number {
  if (!text) return 0
  const trimmed = text.replace(/\s+/g, '')
  const cjk = (trimmed.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length
  const latin = (trimmed.match(/[A-Za-z0-9]+/g) || []).length
  return cjk + latin
}

/** 稳定的字符串哈希（用于封面降级渐变色板取色） */
export function hashString(input: string): number {
  let h = 0
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}