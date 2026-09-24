import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { registerSW } from 'virtual:pwa-register'
import App from './App.vue'
import router from './router'
import { useSettingsStore } from './stores/settings'

import './assets/styles/tokens.css'
import './assets/styles/base.css'
import './assets/styles/motion.css'

const app = createApp(App)
app.use(createPinia())

// 预加载设置（启动即读 IndexedDB）
useSettingsStore().init()

// PWA：registerType='prompt'，新版本由用户确认后刷新，避免复习中自动刷新丢进度
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    if (confirm('发现新版本（如新词库），是否立即刷新？')) updateSW(true)
  },
})

app.use(router)
app.mount('#app')