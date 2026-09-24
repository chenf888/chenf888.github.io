import type { Word } from '../types'

/**
 * 简易 CSV 解析，支持双引号包裹字段。
 */
function parseCsvRows(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      field = ''
      if (row.some((f) => f.trim() !== '')) rows.push(row)
      row = []
    } else {
      field += c
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field)
    if (row.some((f) => f.trim() !== '')) rows.push(row)
  }
  return rows
}

/**
 * 解析自定义词库 CSV 为 Word 数组。
 * 列顺序：word, definition_cn, phonetic, pos, definition_en
 * 首行若以 word 开头则视为表头跳过。
 */
export function parseCsv(text: string): Word[] {
  const rows = parseCsvRows(text)
  const words: Word[] = []
  const seen = new Set<string>()

  for (const row of rows) {
    const word = (row[0] ?? '').trim()
    const definitionCn = (row[1] ?? '').trim()
    if (!word || !definitionCn) continue
    // 跳过表头
    if (word.toLowerCase() === 'word' && definitionCn.toLowerCase() === 'definition_cn') {
      continue
    }
    if (seen.has(word.toLowerCase())) continue
    seen.add(word.toLowerCase())

    const phonetic = row[2]?.trim() || undefined
    const pos = row[3]?.trim() || undefined
    const definitionEn = row[4]?.trim() || undefined

    words.push({
      id: `custom_${word.toLowerCase()}`,
      word,
      phonetic,
      pos,
      senses: [{ definition_cn: definitionCn, definition_en: definitionEn }],
      tags: ['custom'],
      frequency: 0,
      collocations: [],
      root_affix: '',
      forms: [],
      aliases: [],
    })
  }
  return words
}