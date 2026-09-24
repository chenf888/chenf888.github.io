import type { BackupFile } from '../types'
import { buildBackup, importBackup } from '../db/backup'

interface FsHandle {
  createWritable(): Promise<{ write(data: string): Promise<void>; close(): Promise<void> }>
}

/** 导出 / 导入备份封装（含 File System Access API 增强）。 */
export function useExport() {
  /** 是否支持 File System Access API。 */
  function supportsFsAccess(): boolean {
    return typeof window !== 'undefined' && 'showSaveFilePicker' in window
  }

  /** 生成 JSON 备份并触发下载（通用，兼容所有浏览器）。 */
  async function exportJson(includeCustomWords: boolean): Promise<void> {
    const data = await buildBackup(includeCustomWords)
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const date = new Date().toISOString().slice(0, 10)
    a.href = url
    a.download = `cfword-backup-${date}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  /** 通过 File System Access API 保存（用户选择位置）。 */
  async function exportJsonNative(includeCustomWords: boolean): Promise<void> {
    const data = await buildBackup(includeCustomWords)
    const json = JSON.stringify(data, null, 2)
    const w = window as unknown as {
      showSaveFilePicker?: (opts?: unknown) => Promise<FsHandle>
    }
    if (!w.showSaveFilePicker) throw new Error('当前浏览器不支持')
    const date = new Date().toISOString().slice(0, 10)
    const handle = await w.showSaveFilePicker({
      suggestedName: `cfword-backup-${date}.json`,
      types: [
        { description: 'JSON', accept: { 'application/json': ['.json'] } },
      ],
    })
    const writable = await handle.createWritable()
    await writable.write(json)
    await writable.close()
  }

  /** 读取并导入备份文件（校验失败会抛出具体错误）。 */
  async function importFile(file: File): Promise<void> {
    const text = await file.text()
    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch {
      throw new Error('文件不是合法的 JSON')
    }
    await importBackup(parsed as BackupFile)
  }

  return { supportsFsAccess, exportJson, exportJsonNative, importFile }
}