import { createRouter, createWebHistory } from 'vue-router'
import MainTab from '@/layouts/MainTab.vue'
import { getToken } from '@shared/utils/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: () => import('@/views/login/index.vue') },
    {
      path: '/',
      component: MainTab,
      redirect: '/fill',
      children: [
        { path: 'fill', name: 'fill-list', component: () => import('@/views/fill/index.vue') },
        { path: 'fill/:nodeId', name: 'fill-detail', component: () => import('@/views/fill/detail.vue') },
        { path: 'profile', name: 'profile', component: () => import('@/views/profile/index.vue') },
        { path: 'password', name: 'password', component: () => import('@/views/password/index.vue') },
      ],
    },
  ],
})

router.beforeEach((to) => {
  if (!getToken() && to.path !== '/login') return { path: '/login', query: { redirect: to.fullPath } }
  if (getToken() && to.path === '/login') return { path: '/' }
  return true
})

export default router
