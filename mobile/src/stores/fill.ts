import { defineStore } from 'pinia'
import { getMe } from '@shared/api/auth'
import type { MenuNode } from '@shared/types'

/** 填报 store：从 /auth/me 菜单中筛出业务填报节点（含 fields） */
export const useFillStore = defineStore('fill', {
  state: () => ({ nodes: [] as MenuNode[] }),
  actions: {
    async loadNodes() {
      const { menus } = await getMe()
      // 业务填报组 = 有子节点且子节点带 fields 的顶级菜单
      this.nodes = menus.find((m) => m.children?.some((c) => c.fields))?.children ?? []
    },
  },
})
