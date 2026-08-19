/**
 * 路由实例与全局前置守卫
 * - 常量路由：登录页 / 主布局（懒加载）/ 404 兜底
 * - 守卫流程：未登录跳登录页；首次进入时加载动态路由并注册到 Layout 下，防止跨账号越权
 */
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { usePermissionStore } from '@/stores/permission'
import { useUserStore } from '@/stores/user'
import { getToken } from '@/utils/auth'

/** 常量路由：与权限无关、应用启动即注册 */
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

/** 免登录白名单路径：无 token 时也可直接访问 */
const WHITE_LIST = ['/login']

// 模块级记录已注册的动态路由名：permission store 在登出时会被 reset，
// 模块级数组得以跨会话保留，使下一次登录能先移除上一个账号注册的路由（removeRoute 以 name 为凭）。
let addedRouteNames: string[] = []

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
      // 移除上一个会话（如另一个账号）残留的动态路由，再重新注册，防止跨账号越权
      addedRouteNames.forEach((n) => router.removeRoute(n))
      addedRouteNames = permissionStore.dynamicRoutes
        .map((r) => r.name)
        .filter((n): n is string => Boolean(n))
      permissionStore.dynamicRoutes.forEach((r) => router.addRoute('Layout', r))
      if (userInfo) {
        useUserStore().userInfo = userInfo
      }
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
