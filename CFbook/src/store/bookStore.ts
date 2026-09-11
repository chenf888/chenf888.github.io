import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { STORAGE_KEYS } from '@/constants'
import { safeStorage } from '@/utils/storage'
import { getAllBooks } from '@/db/bookRepo'
import type { ReadingProgress, ShelfItem, ShelfBackup } from '@/types'

interface BookState {
  shelf: ShelfItem[]
  progressMap: Record<string, ReadingProgress>
  recentIds: string[]
  addToShelf: (novelId: string) => void
  removeFromShelf: (novelId: string) => void
  toggleShelf: (novelId: string) => void
  isInShelf: (novelId: string) => boolean
  saveProgress: (p: ReadingProgress) => void
  getProgress: (novelId: string) => ReadingProgress | undefined
  clearProgress: (novelId: string) => void
  removeFromRecent: (novelId: string) => void
  importBackup: (backup: ShelfBackup) => void
  exportBackup: () => Promise<ShelfBackup>
}

/** 书架 / 阅读进度 / 最近阅读，随 localStorage 持久化 */
export const useBookStore = create<BookState>()(
  persist(
    (set, get) => ({
      shelf: [],
      progressMap: {},
      recentIds: [],

      addToShelf: (novelId) => {
        if (get().shelf.some((i) => i.novelId === novelId)) return
        set((s) => ({
          shelf: [...s.shelf, { novelId, addedAt: Date.now() }],
        }))
      },
      removeFromShelf: (novelId) =>
        set((s) => ({ shelf: s.shelf.filter((i) => i.novelId !== novelId) })),
      toggleShelf: (novelId) => {
        if (get().isInShelf(novelId)) get().removeFromShelf(novelId)
        else get().addToShelf(novelId)
      },
      isInShelf: (novelId) => get().shelf.some((i) => i.novelId === novelId),

      saveProgress: (p) =>
        set((s) => {
          const recentIds = [
            p.novelId,
            ...s.recentIds.filter((id) => id !== p.novelId),
          ].slice(0, 20)
          return {
            progressMap: { ...s.progressMap, [p.novelId]: p },
            recentIds,
          }
        }),
      getProgress: (novelId) => get().progressMap[novelId],
      clearProgress: (novelId) =>
        set((s) => {
          const next = { ...s.progressMap }
          delete next[novelId]
          return { progressMap: next }
        }),
      removeFromRecent: (novelId) =>
        set((s) => ({ recentIds: s.recentIds.filter((id) => id !== novelId) })),

      importBackup: (backup) =>
        set(() => ({
          shelf: backup.shelf,
          progressMap: backup.progressMap,
          recentIds: backup.recentIds,
        })),

      exportBackup: async () => {
        const s = get()
        const imported = await getAllBooks()
        return {
          version: 1,
          exportedAt: Date.now(),
          shelf: s.shelf,
          progressMap: s.progressMap,
          recentIds: s.recentIds,
          importedBooks: imported.map((b) => ({
            id: b.id,
            title: b.title,
            author: b.author,
            category: b.category,
            tags: b.tags,
            chapterCount: b.chapterCount,
            wordCount: b.wordCount,
          })),
        }
      },
    }),
    {
      name: STORAGE_KEYS.books,
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({
        shelf: state.shelf,
        progressMap: state.progressMap,
        recentIds: state.recentIds,
      }),
    },
  ),
)