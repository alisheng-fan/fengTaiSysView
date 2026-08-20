import { defineStore } from 'pinia'
import { getMe } from '@shared/api/auth'
import type { MenuNode } from '@shared/types'

/** 填报 store：从 /auth/me 菜单筛出业务填报节点（含 fields），保留 RBAC 可见性；记录规则引擎开启的节点（isDefault=false 的条件节点） */
export const useFillStore = defineStore('fill', {
  state: () => ({
    nodes: [] as MenuNode[],
    /** 被规则引擎开启的节点 id（持久化本次会话内 OPEN 门禁结果） */
    openedNodes: [] as string[],
  }),
  actions: {
    async loadNodes() {
      const { menus } = await getMe()
      // 业务填报组 = 有子节点且子节点带 fields 的顶级菜单
      this.nodes = menus.find((m) => m.children?.some((c) => c.fields))?.children ?? []
    },
    /** 记录已开启节点（去重） */
    openNodes(ids: string[]) {
      const set = new Set([...this.openedNodes, ...ids])
      this.openedNodes = [...set]
    },
  },
})
