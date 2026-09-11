export interface StorageEstimate {
  usage: number
  quota: number
}

/** 读取浏览器存储占用与配额（供导入书管理页展示） */
export async function getStorageEstimate(): Promise<StorageEstimate> {
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const est = await navigator.storage.estimate()
      return { usage: est.usage ?? 0, quota: est.quota ?? 0 }
    }
  } catch {
    /* ignore */
  }
  return { usage: 0, quota: 0 }
}