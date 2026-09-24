import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ReviewView from '../views/ReviewView.vue'
import StatsView from '../views/StatsView.vue'
import DeckView from '../views/DeckView.vue'
import SettingsView from '../views/SettingsView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/review', name: 'review', component: ReviewView },
    { path: '/stats', name: 'stats', component: StatsView },
    { path: '/deck/:id', name: 'deck', component: DeckView },
    { path: '/settings', name: 'settings', component: SettingsView },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router