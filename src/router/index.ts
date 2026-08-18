import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { usePermissionStore } from '@/stores/permission'
import { getToken } from '@/utils/auth'

export const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', public: true },
  },
  {
    path: '/',
    // 懒加载：MainLayout 由 Task 8 创建；懒加载使 Task 7 阶段登录页可独立验证
    component: () => import('@/layouts/MainLayout/index.vue'),
    redirect: '/dashboard',
    name: 'Layout',
    children: [],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '404', public: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes: constantRoutes,
})

const WHITE_LIST = ['/login']

router.beforeEach(async (to) => {
  if (!getToken()) {
    if (WHITE_LIST.includes(to.path)) return true
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  if (to.path === '/login') return { path: '/' }

  const permissionStore = usePermissionStore()
  if (!permissionStore.loaded) {
    try {
      await permissionStore.loadPermission()
      permissionStore.dynamicRoutes.forEach((r) => router.addRoute('Layout', r))
      return { ...to, replace: true }
    } catch {
      return { path: '/login', query: { redirect: to.fullPath } }
    }
  }
  return true
})

export default router
