import { defineStore } from 'pinia'
import type { RouteRecordRaw } from 'vue-router'
import { getMe } from '@/api/auth'
import { buildRoutes } from '@/router/dynamic'
import { useUserStore } from './user'
import type { MenuNode } from '@/types'

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
    loaded: false,
    menus: [] as MenuNode[],
    perms: [] as string[],
    dynamicRoutes: [] as RouteRecordRaw[],
  }),
  actions: {
    async loadPermission() {
      const { userInfo, menus } = await getMe()
      this.menus = menus
      this.perms = collectPerms(menus)
      this.dynamicRoutes = buildRoutes(menus)
      // getMe 一次返回 userInfo + menus：菜单交给本 store，用户信息顺带写入
      // user store（getMe 只有这一个消费点，避免额外请求）。导航栏展示用户名依赖此赋值。
      useUserStore().userInfo = userInfo
      this.loaded = true
    },
    reset() {
      this.loaded = false
      this.menus = []
      this.perms = []
      this.dynamicRoutes = []
    },
    hasPerm(code: string) {
      return this.perms.includes(code)
    },
  },
})
