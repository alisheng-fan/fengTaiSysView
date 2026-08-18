import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { usePermissionStore } from '@/stores/permission'
import { useUserStore } from '@/stores/user'
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
      // 权限加载失败（如网络/业务错误）时清空凭证，避免 token 仍在导致
      // 下一轮守卫把 /login 弹回 / 形成无限重定向循环。401 由请求层自行清理。
      useUserStore().reset()
      return { path: '/login', query: { redirect: to.fullPath } }
    }
  }
  return true
})

export default router
