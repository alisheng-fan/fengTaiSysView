import { defineStore } from 'pinia'
import type { RouteRecordRaw } from 'vue-router'
import { getMe } from '@/api/auth'
import { buildRoutes } from '@/router/dynamic'
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
      const { menus } = await getMe()
      this.menus = menus
      this.perms = collectPerms(menus)
      this.dynamicRoutes = buildRoutes(menus)
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
