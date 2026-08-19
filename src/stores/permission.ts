/**
 * 权限状态：菜单树 / 权限码 / 动态路由
 * - loadPermission 由路由守卫首次进入时调用，一次拉取用户信息与菜单并计算权限
 * - 菜单拍平成去重后的权限码集合（perms）与动态路由（dynamicRoutes）
 */
import { defineStore } from 'pinia'
import type { RouteRecordRaw } from 'vue-router'
import { getMe } from '@/api/auth'
import { buildRoutes } from '@/router/dynamic'
import type { MenuNode } from '@/types'

/** 递归收集菜单树的全部权限码并去重 */
function collectPerms(menus: MenuNode[]): string[] {
  const perms: string[] = []
  for (const m of menus) {
    perms.push(...m.perms)
    if (m.children?.length) perms.push(...collectPerms(m.children))
  }
  return [...new Set(perms)]
}

export const usePermissionStore = defineStore('permission', {
  state: () => ({
    /** 是否已加载过权限（路由守卫据此判断是否需重新加载） */
    loaded: false,
    /** 后端下发的菜单树 */
    menus: [] as MenuNode[],
    /** 去重后的权限码集合（v-perm 指令 / hasPerm 据此控制显隐） */
    perms: [] as string[],
    /** 由菜单树构建的动态路由（尚未注册进 router） */
    dynamicRoutes: [] as RouteRecordRaw[],
  }),
  actions: {
    /** 加载权限：拉取用户信息+菜单，计算 perms 与 dynamicRoutes；userInfo 交守卫写入 user store */
    async loadPermission() {
      const { userInfo, menus } = await getMe()
      this.menus = menus
      this.perms = collectPerms(menus)
      this.dynamicRoutes = buildRoutes(menus)
      this.loaded = true
      // userInfo 交回调用方（守卫）写入 user store，保持 user → permission 单向依赖
      return userInfo
    },
    /** 重置权限状态（登出 / 权限加载失败时调用，防止跨账号残留） */
    reset() {
      this.loaded = false
      this.menus = []
      this.perms = []
      this.dynamicRoutes = []
    },
    /** 判断当前用户是否拥有指定权限码 */
    hasPerm(code: string) {
      return this.perms.includes(code)
    },
  },
})
