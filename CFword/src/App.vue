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
</template>

<style scoped>
.layout {
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
  font-weight: 800;
  font-size: 1.25rem;
  color: var(--color-primary);
  letter-spacing: -0.02em;
}
.layout__main {
  flex: 1;
  padding: var(--space-4);
  padding-bottom: calc(88px + env(safe-area-inset-bottom));
}
.bottom-nav {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-2);
  padding-bottom: calc(var(--space-2) + env(safe-area-inset-bottom));
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
}
.bottom-nav__item {
  flex: 1;
  max-width: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  font-weight: 600;
  transition: color var(--dur-fast) var(--ease-standard), background var(--dur-fast) var(--ease-standard);
}
.bottom-nav__item.is-active {
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
}
</style>