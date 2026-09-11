import { useCallback, useState } from 'react'
import type { ImportPreview, ImportTask } from '@/types'
import { createImportTask } from '@/services/importer/progress'
import {
  readFileAsBytes,
  buildPreview,
  commitImport,
  type ImportOverrides,
  type ProgressFn,
} from '@/services/importer'
import { MAX_IMPORT_SIZE } from '@/constants'

interface ImportState {
  task: ImportTask | null
  preview: ImportPreview | null
  bytes: Uint8Array | null
}

const EMPTY: ImportState = { task: null, preview: null, bytes: null }

const QUOTA_MSGS: Record<string, string> = {
  QUOTA_EXCEEDED: '存储空间不足，导入失败',
  CONSTRAINT: '数据写入冲突，导入失败',
}

/** 导入流程编排：读文件 → 检测 → 预览 → 提交，管理任务状态 */
export function useImportTask() {
  const [state, setState] = useState<ImportState>(EMPTY)

  const patchTask = useCallback((patch: Partial<ImportTask>) => {
    setState((s) => (s.task ? { ...s, task: { ...s.task, ...patch } } : s))
  }, [])

  const startFile = useCallback(async (file: File) => {
    if (file.size > MAX_IMPORT_SIZE) {
      setState({
        task: {
          ...createImportTask(file.name, file.size),
          stage: 'error',
          error: '文件超过 50MB，无法导入',
        },
        preview: null,
        bytes: null,
      })
      return
    }
    const task = createImportTask(file.name, file.size)
    setState({ task: { ...task, stage: 'reading' }, preview: null, bytes: null })
    try {
      const bytes = await readFileAsBytes(file)
      patchTask({ stage: 'detecting' })
      await new Promise((r) => setTimeout(r, 20))
      const preview = buildPreview(file.name, file.size, bytes)
      setState({ task: { ...task, stage: 'decoding' }, preview, bytes })
    } catch (e) {
      setState({
        task: {
          ...task,
          stage: 'error',
          error: e instanceof Error ? e.message : '读取文件失败',
        },
        preview: null,
        bytes: null,
      })
    }
  }, [patchTask])

  const reDecode = useCallback(
    (encoding: string) => {
      setState((s) => {
        if (!s.bytes || !s.task) return s
        const preview = buildPreview(
          s.task.fileName,
          s.task.fileSize,
          s.bytes,
          encoding,
        )
        return { ...s, preview }
      })
    },
    [],
  )

  const commit = useCallback(
    async (overrides: ImportOverrides): Promise<string | null> => {
      if (!state.bytes || !state.task) return null
      const onProgress: ProgressFn = (stage, progress) =>
        patchTask({ stage, progress })
      try {
        return await commitImport(
          state.bytes,
          state.task.fileName,
          overrides,
          onProgress,
        )
      } catch (e) {
        const code = (e as { code?: string }).code
        patchTask({
          stage: 'error',
          error:
            (code && QUOTA_MSGS[code]) ||
            (e instanceof Error ? e.message : '导入失败'),
        })
        return null
      }
    },
    [state.bytes, state.task, patchTask],
  )

  const reset = useCallback(() => setState(EMPTY), [])

  return { ...state, startFile, reDecode, commit, reset }
}