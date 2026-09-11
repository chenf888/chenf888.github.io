/** ID 生成工具。 */

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}

/** 章节 ID：`${novelId}::${index}` */
export function chapterId(novelId: string, index: number): string {
  return `${novelId}::${index}`
}