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
      redirect: '/home',
      children: [
        { path: 'home', name: 'home', component: () => import('@/views/home/index.vue') },
        { path: 'monitor', name: 'monitor', component: () => import('@/views/monitor/index.vue') },
        { path: 'profile', name: 'profile', component: () => import('@/views/profile/index.vue') },
        { path: 'password', name: 'password', component: () => import('@/views/password/index.vue') },
        { path: 'progress', name: 'progress', component: () => import('@/views/progress/index.vue') },
        { path: 'project/:id', name: 'project-detail', component: () => import('@/views/project/detail.vue') },
        { path: 'project/:id/node/:nodeId', name: 'node-fill', component: () => import('@/views/project/node-fill.vue') },
        { path: 'project/:id/issues', name: 'project-issues', component: () => import('@/views/project/issues.vue') },
        { path: 'project/:id/notice', name: 'project-notice', component: () => import('@/views/notice/index.vue') },
        { path: 'project/:id/announcement', name: 'project-announcement', component: () => import('@/views/announcement/index.vue') },
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
