<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDeckStore } from '../stores/deck'
import { useSessionStore } from '../stores/session'
import { useSettingsStore } from '../stores/settings'
import { useExport } from '../composables/useExport'
import SkeletonCard from '../components/SkeletonCard.vue'
import ErrorState from '../components/ErrorState.vue'

const router = useRouter()
const deckStore = useDeckStore()
const session = useSessionStore()
const settingsStore = useSettingsStore()
const { exportJson, importFile } = useExport()

const progressMap = ref<Record<string, { done: number; total: number }>>({})
const busy = ref(false)
const importError = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const backupStale = computed(() => {
  const last = settingsStore.settings.lastBackupAt
  if (last == null) return true
  return Date.now() - last > 7 * 86400000
})

onMounted(async () => {
  await deckStore.loadIndex()
  await refreshProgress()
})

async function refreshProgress(): Promise<void> {
  const map: Record<string, { done: number; total: number }> = {}
  for (const d of deckStore.decks) {
    map[d.id] = await deckStore.deckProgress(d.id)
  }
  progressMap.value = map
}

async function startLearn(deckId: string): Promise<void> {
  busy.value = true
  try {
    await session.start(deckId)
    router.push('/review')
  } catch {
    // session.start 已写入 error 状态
  } finally {
    busy.value = false
  }
}

async function onExport(): Promise<void> {
  await exportJson(false)
  await settingsStore.update({ lastBackupAt: Date.now() })
}

function onPickImport(): void {
  fileInput.value?.click()
}

async function onImportFile(e: Event): Promise<void> {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  importError.value = null
  try {
    await importFile(file)
    await refreshProgress()
    alert('导入成功，建议刷新页面。')
  } catch (err) {
    importError.value = err instanceof Error ? err.message : String(err)
  } finally {
    input.value = ''
  }
}
</script>

<template>
  <div class="home">
    <section v-if="backupStale" class="backup-banner">
      <p>尚未备份学习数据。清除浏览器数据会丢失记录，建议定期导出。</p>
      <button type="button" @click="onExport">立即备份</button>
    </section>

    <ErrorState
      v-if="deckStore.error"
      title="词库加载失败"
      :description="deckStore.error"
      @retry="deckStore.loadIndex()"
    />

    <div v-else-if="deckStore.loadingIndex" class="home__skeletons">
      <SkeletonCard v-for="i in 3" :key="i" />
    </div>

    <template v-else>
      <h2 class="home__heading">词库</h2>
      <div class="home__decks">
        <button
          v-for="d in deckStore.decks"
          :key="d.id"
          type="button"
          class="deck"
          :disabled="busy"
          @click="startLearn(d.id)"
        >
          <div class="deck__info">
            <span class="deck__name">{{ d.name }}</span>
            <span class="deck__desc">{{ d.description }}</span>
          </div>
          <div class="deck__side">
            <span class="deck__count">{{
              progressMap[d.id] ? `${progressMap[d.id]!.done}/${progressMap[d.id]!.total}` : d.wordCount
            }}</span>
            <span class="deck__go">开始</span>
          </div>
        </button>
      </div>

      <div class="home__actions">
        <button type="button" class="home__action" @click="onExport">导出备份</button>
        <button type="button" class="home__action" @click="onPickImport">导入备份</button>
      </div>
      <p v-if="importError" class="home__import-error">{{ importError }}</p>
      <input ref="fileInput" type="file" accept="application/json" hidden @change="onImportFile" />
    </template>
  </div>
</template>

<style scoped>
.home__heading {
  margin: var(--space-4) 0 var(--space-3);
  font-family: var(--font-serif);
  font-size: 1.4rem;
  font-weight: 500;
  letter-spacing: -0.01em;
  color: var(--color-text);
}
.home__skeletons {
  display: grid;
  gap: var(--space-3);
}
.home__decks {
  display: grid;
  gap: var(--space-3);
}
.backup-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--color-warning) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-warning) 40%, transparent);
  margin-bottom: var(--space-4);
}
.backup-banner p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text);
}
.backup-banner button {
  flex-shrink: 0;
  min-height: 40px;
  padding: 0 var(--space-4);
  border-radius: var(--radius-sm);
  background: var(--color-warning);
  color: #fff;
  font-weight: 600;
}
.deck {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-4);
  text-align: left;
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  transition: transform var(--dur-press) var(--ease-standard),
    border-color var(--dur-fast) var(--ease-standard);
}
.deck:hover {
  border-color: var(--color-border-hi);
}
.deck:active {
  transform: scale(0.99);
}
.deck:disabled {
  opacity: 0.6;
}
.deck__info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.deck__name {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-text);
}
.deck__desc {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}
.deck__side {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
.deck__count {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}
.deck__go {
  min-height: 40px;
  padding: 0 var(--space-4);
  display: inline-flex;
  align-items: center;
  border-radius: var(--radius-pill);
  background: var(--btn-bg);
  color: var(--btn-text);
  font-weight: 600;
}
.home__actions {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-6);
}
.home__action {
  flex: 1;
  min-height: 48px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  font-weight: 600;
}
.home__import-error {
  margin-top: var(--space-2);
  color: var(--color-danger);
  font-size: 0.875rem;
}
</style>