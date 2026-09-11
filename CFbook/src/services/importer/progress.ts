import type { ImportStage, ImportTask } from '@/types'
import { uid } from '@/utils/id'

/** 各阶段进度基准（0~100），用于进度条展示 */
export const STAGE_PROGRESS: Record<ImportStage, number> = {
  pending: 0,
  reading: 8,
  detecting: 16,
  decoding: 30,
  splitting: 55,
  saving: 75,
  done: 100,
  error: 100,
}

export function createImportTask(fileName: string, fileSize: number): ImportTask {
  return { id: uid(), fileName, fileSize, stage: 'pending', progress: 0 }
}

/** 让出主线程，避免长循环阻塞 UI */
export function yieldToMain(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}