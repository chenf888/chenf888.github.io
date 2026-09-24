import JSZip from 'jszip'
import initSqlJs, { type Database } from 'sql.js'
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url'
import type { Word } from '../types'

type SqlJs = Awaited<ReturnType<typeof initSqlJs>>
let sqlPromise: Promise<SqlJs> | null = null

/** 懒加载 sql.js（wasm 仅需加载一次）。 */
function loadSql(): Promise<SqlJs> {
  if (!sqlPromise) {
    sqlPromise = initSqlJs({ locateFile: () => sqlWasmUrl })
  }
  return sqlPromise
}

/**
 * 解析 Anki .apkg 包（提取 notes 表字段，首字段作为单词）。
 * 仅支持 Basic / Basic-and-reversed 等以 Front 为第一字段的常见牌组。
 */
export async function parseApkg(file: File): Promise<Word[]> {
  const zip = await JSZip.loadAsync(file)
  const dbFile = zip.file('collection.anki21') ?? zip.file('collection.anki2')
  if (!dbFile) {
    throw new Error('未找到 Anki collection 数据库（collection.anki21 / .anki2）')
  }

  const buf = await dbFile.async('arraybuffer')
  const SQL = await loadSql()
  const db: Database = new SQL.Database(new Uint8Array(buf))

  let notes: { flds: string; sfld: string }[] = []
  try {
    const res = db.exec('SELECT flds, sfld FROM notes')
    if (res.length > 0) {
      const col = res[0]!
      const fIdx = col.columns.indexOf('flds')
      const sIdx = col.columns.indexOf('sfld')
      notes = col.values.map((row) => ({
        flds: String(row[fIdx] ?? ''),
        sfld: String(row[sIdx] ?? ''),
      }))
    }
  } finally {
    db.close()
  }

  const words: Word[] = []
  const seen = new Set<string>()
  for (const n of notes) {
    const fields = n.flds
      .split('\u001f')
      .map((s) => s.trim())
      .filter(Boolean)
    const word = fields[0] ?? n.sfld
    if (!word) continue
    if (seen.has(word.toLowerCase())) continue
    seen.add(word.toLowerCase())

    words.push({
      id: `custom_${word.toLowerCase()}`,
      word,
      senses: [{ definition_cn: fields.slice(1).join('；') }],
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