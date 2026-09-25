<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useSettingsStore } from '../stores/settings'
import { useDeckStore } from '../stores/deck'
import { useExport } from '../composables/useExport'
import { parseCsv } from '../data/csvImport'
import { parseApkg } from '../data/apkg'
import { exportEncrypted, importEncrypted } from '../db/cryptoBackup'
import { db } from '../db/schema'
import type { Settings } from '../types'

const settingsStore = useSettingsStore()
const deckStore = useDeckStore()
const { supportsFsAccess, exportJson, exportJsonNative, importFile } = useExport()

const fileInput = ref<HTMLInputElement | null>(null)
const csvInput = ref<HTMLInputElement | null>(null)
const apkgInput = ref<HTMLInputElement | null>(null)
const encInput = ref<HTMLInputElement | null>(null)
const importError = ref<string | null>(null)
const importOk = ref(false)
const busy = ref(false)

const newCardsOptions = [5, 10, 15, 20, 30]

onMounted(() => {
  if (!settingsStore.loaded) settingsStore.init()
})

async function update(partial: Partial<Settings>): Promise<void> {
  await settingsStore.update(partial)
}

function onNewCards(e: Event): void {
  update({ newCardsPerDay: Number((e.target as HTMLSelectElement).value) })
}

function onReviewLimit(e: Event): void {
  const v = Number((e.target as HTMLInputElement).value)
  if (v > 0) update({ reviewLimit: v })
}

function onRetention(e: Event): void {
  update({ requestRetention: Number((e.target as HTMLInputElement).value) })
}

function onToggleAccent(): void {
  update({ accent: settingsStore.settings.accent === 'us' ? 'uk' : 'us' })
}

function onToggleAutoPlay(): void {
  update({ autoPlay: !settingsStore.settings.autoPlay })
}

async function onExport(): Promise<void> {
  await exportJson(false)
  await update({ lastBackupAt: Date.now() })
}

function onPickImport(): void {
  fileInput.value?.click()
}

async function onImportFile(e: Event): Promise<void> {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  importError.value = null
  importOk.value = false
  try {
    await importFile(file)
    importOk.value = true
    await settingsStore.init()
  } catch (err) {
    importError.value = err instanceof Error ? err.message : String(err)
  } finally {
    input.value = ''
  }
}

async function clearAll(): Promise<void> {
  if (!confirm('确定清空所有词库与学习数据？此操作不可撤销。')) return
  await db.delete()
  location.reload()
}

function pickCsv(): void {
  csvInput.value?.click()
}

function pickApkg(): void {
  apkgInput.value?.click()
}

function pickEnc(): void {
  encInput.value?.click()
}

async function onCsvFile(e: Event): Promise<void> {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  importError.value = null
  importOk.value = false
  busy.value = true
  try {
    const words = parseCsv(await file.text())
    if (words.length === 0) throw new Error('CSV 中没有有效词条')
    await deckStore.importCustomWords(words)
    importOk.value = true
  } catch (err) {
    importError.value = err instanceof Error ? err.message : String(err)
  } finally {
    busy.value = false
    input.value = ''
  }
}

async function onApkgFile(e: Event): Promise<void> {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  importError.value = null
  importOk.value = false
  busy.value = true
  try {
    const words = await parseApkg(file)
    if (words.length === 0) throw new Error('apkg 中没有词条')
    await deckStore.importCustomWords(words)
    importOk.value = true
  } catch (err) {
    importError.value = err instanceof Error ? err.message : String(err)
  } finally {
    busy.value = false
    input.value = ''
  }
}

async function onExportEncrypted(): Promise<void> {
  const pwd = prompt('请输入加密备份密码（请牢记，丢失无法恢复）')
  if (!pwd) return
  importError.value = null
  try {
    await exportEncrypted(pwd)
    await update({ lastBackupAt: Date.now() })
  } catch (err) {
    importError.value = err instanceof Error ? err.message : String(err)
  }
}

async function onImportEncrypted(e: Event): Promise<void> {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const pwd = prompt('请输入加密备份密码')
  if (!pwd) return
  importError.value = null
  importOk.value = false
  try {
    await importEncrypted(pwd, file)
    importOk.value = true
    await settingsStore.init()
  } catch (err) {
    importError.value = err instanceof Error ? err.message : String(err)
  } finally {
    input.value = ''
  }
}

async function onExportNative(): Promise<void> {
  importError.value = null
  try {
    await exportJsonNative(false)
    await update({ lastBackupAt: Date.now() })
  } catch (err) {
    importError.value = err instanceof Error ? err.message : String(err)
  }
}
</script>

<template>
  <div class="settings">
    <h2 class="settings__title">设置</h2>

    <section class="group">
      <h3>学习计划</h3>

      <div class="row">
        <span class="row__label">每日新卡上限</span>
        <select
          :value="settingsStore.settings.newCardsPerDay"
          @change="onNewCards"
        >
          <option v-for="n in newCardsOptions" :key="n" :value="n">{{ n }}</option>
        </select>
      </div>

      <div class="row">
        <span class="row__label">每日复习上限</span>
        <input
          type="number"
          min="1"
          :value="settingsStore.settings.reviewLimit"
          @change="onReviewLimit"
        />
      </div>

      <div class="row">
        <span class="row__label">目标保留率</span>
        <div class="row__slider">
          <input
            type="range"
            min="0.7"
            max="0.97"
            step="0.01"
            :value="settingsStore.settings.requestRetention"
            @change="onRetention"
          />
          <span class="row__value">{{ (settingsStore.settings.requestRetention * 100).toFixed(0) }}%</span>
        </div>
      </div>
    </section>

    <section class="group">
      <h3>发音</h3>

      <div class="row">
        <span class="row__label">英式发音</span>
        <button
          type="button"
          class="toggle"
          :class="{ 'is-on': settingsStore.settings.accent === 'uk' }"
          role="switch"
          :aria-checked="settingsStore.settings.accent === 'uk'"
          @click="onToggleAccent"
        >
          <span class="toggle__thumb"></span>
        </button>
      </div>

      <div class="row">
        <span class="row__label">自动发音（切题自动朗读）</span>
        <button
          type="button"
          class="toggle"
          :class="{ 'is-on': settingsStore.settings.autoPlay }"
          role="switch"
          :aria-checked="settingsStore.settings.autoPlay"
          @click="onToggleAutoPlay"
        >
          <span class="toggle__thumb"></span>
        </button>
      </div>
    </section>

    <section class="group">
      <h3>数据备份</h3>
      <div class="row">
        <span class="row__label">导出 JSON 备份</span>
        <button type="button" class="btn" @click="onExport">导出</button>
      </div>
      <div v-if="supportsFsAccess()" class="row">
        <span class="row__label">另存为（选择位置）</span>
        <button type="button" class="btn" @click="onExportNative">另存为</button>
      </div>
      <div class="row">
        <span class="row__label">导入备份</span>
        <button type="button" class="btn" @click="onPickImport">导入</button>
        <input ref="fileInput" type="file" accept="application/json" hidden @change="onImportFile" />
      </div>
      <div class="row">
        <span class="row__label">加密导出备份</span>
        <button type="button" class="btn" @click="onExportEncrypted">加密导出</button>
      </div>
      <div class="row">
        <span class="row__label">导入加密备份</span>
        <button type="button" class="btn" @click="pickEnc">解密导入</button>
        <input ref="encInput" type="file" accept=".enc" hidden @change="onImportEncrypted" />
      </div>
      <p v-if="importError" class="msg msg--error">{{ importError }}</p>
      <p v-if="importOk" class="msg">导入成功，建议刷新页面。</p>

      <div class="row">
        <span class="row__label">清空全部数据</span>
        <button type="button" class="btn btn--danger" @click="clearAll">清空</button>
      </div>
    </section>

    <section class="group">
      <h3>自定义词库导入</h3>
      <div class="row">
        <span class="row__label">导入 CSV（word,释义,…）</span>
        <button type="button" class="btn" :disabled="busy" @click="pickCsv">导入 CSV</button>
        <input ref="csvInput" type="file" accept=".csv,text/csv" hidden @change="onCsvFile" />
      </div>
      <div class="row">
        <span class="row__label">导入 Anki 卡组</span>
        <button type="button" class="btn" :disabled="busy" @click="pickApkg">导入 APKG</button>
        <input ref="apkgInput" type="file" accept=".apkg" hidden @change="onApkgFile" />
      </div>
    </section>
  </div>
</template>

<style scoped>
.settings__title {
  margin: 0 0 var(--space-6);
}
.group {
  margin-bottom: var(--space-8);
}
.group h3 {
  margin: 0 0 var(--space-3);
  font-size: 1rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  min-height: 48px;
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--color-border);
}
.row__label {
  flex: 1;
  min-width: 0;
}
.row select,
.row input[type='number'] {
  min-height: 44px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
}
.row input[type='number'] {
  width: 90px;
}
.row__slider {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
.row__slider input[type='range'] {
  width: 140px;
  accent-color: var(--color-primary);
}
.row__value {
  font-variant-numeric: tabular-nums;
  min-width: 40px;
  text-align: right;
}
.toggle {
  position: relative;
  width: 52px;
  height: 30px;
  border-radius: 999px;
  background: var(--color-border);
  transition: background var(--dur-base) var(--ease-standard);
  flex-shrink: 0;
}
.toggle.is-on {
  background: var(--color-primary);
}
.toggle__thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #fff;
  transition: transform var(--dur-base) var(--ease-standard);
}
.toggle.is-on .toggle__thumb {
  transform: translateX(22px);
}
.btn {
  flex-shrink: 0;
  white-space: nowrap;
  min-height: 44px;
  padding: 0 var(--space-5);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  font-weight: 600;
}
.btn--danger {
  background: var(--color-danger);
  border-color: var(--color-danger);
  color: #fff;
}
.msg {
  font-size: 0.875rem;
  color: var(--color-success);
}
.msg--error {
  color: var(--color-danger);
}
</style>