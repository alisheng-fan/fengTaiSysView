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
      const userInfo = await permissionStore.loadPermission()
      if (userInfo) {
        useUserStore().userInfo = userInfo
      }
      permissionStore.dynamicRoutes.forEach((r) => router.addRoute('Layout', r))
      // 不能返回 {...to, replace: true}：redirect 会在守卫前解析，动态路由尚未注册时
      // /dashboard 已命中 catch-all，to.name='NotFound' 被带上后重导航会按 name 再次解析到 404。
      // 只保留 path/query/hash 让重导航基于更新后的 matcher 重新解析。
      return { path: to.path, query: to.query, hash: to.hash, replace: true }
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
