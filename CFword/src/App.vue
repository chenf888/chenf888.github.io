<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useSpeech } from './composables/useSpeech'
import { useTheme } from './composables/useTheme'

const route = useRoute()
useSpeech().initVoices()

const { theme, rippleRef, toggleTheme } = useTheme()

// 复习页顶部已有进度栏，隐藏导航避免遮挡
const showNav = computed(() => route.name !== 'review')

const tabs = [
  { name: 'home', to: '/', label: '学习' },
  { name: 'stats', to: '/stats', label: '统计' },
  { name: 'settings', to: '/settings', label: '设置' },
]
</script>

<template>
  <div class="layer">
    <div class="bg-grid" aria-hidden="true"></div>
    <div class="ambient-blob" aria-hidden="true"></div>

    <header v-if="showNav" class="nav">
      <div class="nav-pill">
        <router-link to="/" class="nav-pill__brand">CFword</router-link>

        <nav class="pill-links" aria-label="主导航">
          <router-link
            v-for="t in tabs"
            :key="t.name"
            :to="t.to"
            class="pill-links__item"
            :class="{ 'is-active': route.name === t.name }"
          >
            {{ t.label }}
          </router-link>
        </nav>

        <button
          type="button"
          class="nav-pill__theme"
          :aria-label="theme === 'dark' ? '切换到浅色主题' : '切换到深色主题'"
          @click="toggleTheme"
        >
          <svg
            v-if="theme === 'light'"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          >
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
          <svg
            v-else
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        </button>
      </div>
    </header>

    <main class="layout__main">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- 主题切换的圆形扩散过渡（主页同款交互） -->
    <div ref="rippleRef" class="theme-ripple" aria-hidden="true"></div>
  </div>
</template>

<style scoped>
.layer {
  min-height: 100vh;
  position: relative;
}
.bg-grid {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-image: linear-gradient(var(--color-border) 1px, transparent 1px),
    linear-gradient(90deg, var(--color-border) 1px, transparent 1px);
  background-size: 64px 64px;
  opacity: var(--grid-opacity);
}
.ambient-blob {
  position: fixed;
  top: -15%;
  left: -10%;
  width: 600px;
  height: 600px;
  pointer-events: none;
  z-index: 0;
  background: radial-gradient(circle, var(--color-primary) 0%, transparent 70%);
  opacity: var(--blob-opacity);
  filter: blur(24px);
}

/* 顶部胶囊导航，与主页 .nav-pill 视觉一致 */
.nav {
  position: fixed;
  top: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 200;
}
.nav-pill {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.5rem 0.5rem 1.1rem;
  background: var(--nav-bg);
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  transition: border-color 0.4s ease, background 0.4s ease;
}
.nav-pill__brand {
  font-family: var(--font-serif);
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--color-text);
  padding-right: 0.7rem;
  margin-right: 0.25rem;
  border-right: 1px solid var(--color-border);
}
.pill-links {
  display: flex;
  align-items: center;
  gap: 0.15rem;
}
.pill-links__item {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  color: var(--color-text-muted);
  padding: 0.4rem 1rem;
  border-radius: var(--radius-pill);
  transition: color 0.3s ease, background 0.3s ease;
}
.pill-links__item:hover,
.pill-links__item.is-active {
  color: var(--color-text);
  background: var(--color-primary-soft);
}
.nav-pill__theme {
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border-radius: 50%;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.3s ease, color 0.3s ease;
}
.nav-pill__theme:hover {
  border-color: var(--color-border-hi);
  color: var(--color-primary);
}
.nav-pill__theme svg {
  width: 15px;
  height: 15px;
}

.layout__main {
  position: relative;
  z-index: 1;
  max-width: 720px;
  margin: 0 auto;
  padding: var(--space-4);
  padding-top: 104px;
  padding-bottom: calc(var(--space-12) + env(safe-area-inset-bottom));
}

/* 与主页一致：无尺寸，靠 transformOrigin 定位圆心，过渡期间不遮挡界面 */
.theme-ripple {
  position: fixed;
  z-index: 10000;
  pointer-events: none;
  border-radius: 50%;
  display: none;
  transform: scale(0);
}

@media (max-width: 600px) {
  .nav-pill {
    gap: 0.1rem;
    padding: 0.4rem 0.4rem 0.4rem 0.8rem;
  }
  .nav-pill__brand {
    font-size: 0.9rem;
    padding-right: 0.5rem;
    margin-right: 0.15rem;
  }
  .pill-links__item {
    font-size: 0.68rem;
    padding: 0.3rem 0.6rem;
  }
  .layout__main {
    padding-top: 96px;
  }
}
</style>