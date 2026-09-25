<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useSpeech } from './composables/useSpeech'

const route = useRoute()
useSpeech().initVoices()

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

    <div class="layout">
      <header class="topbar">
        <router-link to="/" class="topbar__brand">CFword</router-link>
      </header>

      <main class="layout__main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>

      <nav v-if="showNav" class="bottom-nav" aria-label="主导航">
        <router-link
          v-for="t in tabs"
          :key="t.name"
          :to="t.to"
          class="bottom-nav__item"
          :class="{ 'is-active': route.name === t.name }"
        >
          {{ t.label }}
        </router-link>
      </nav>
    </div>
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
.layout {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  max-width: 720px;
  margin: 0 auto;
}
.topbar {
  display: flex;
  align-items: center;
  height: 56px;
  padding: 0 var(--space-4);
}
.topbar__brand {
  font-family: var(--font-serif);
  font-weight: 600;
  font-size: 1.5rem;
  letter-spacing: -0.02em;
  color: var(--color-text);
}
.topbar__brand::after {
  content: '·';
  color: var(--color-primary);
  margin-left: 2px;
}
.layout__main {
  flex: 1;
  padding: var(--space-4);
  padding-bottom: calc(88px + env(safe-area-inset-bottom));
}
.bottom-nav {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: calc(16px + env(safe-area-inset-bottom));
  display: flex;
  gap: 4px;
  padding: 5px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  box-shadow: var(--shadow-float);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  z-index: 10;
}
.bottom-nav__item {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 0 var(--space-4);
  border-radius: var(--radius-pill);
  color: var(--color-text-muted);
  font-weight: 500;
  transition: color var(--dur-fast) var(--ease-standard),
    background var(--dur-fast) var(--ease-standard);
}
.bottom-nav__item.is-active {
  color: var(--color-text);
  background: var(--color-primary-soft);
}
</style>