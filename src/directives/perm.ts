import type { Directive } from 'vue'
import { usePermissionStore } from '@/stores/permission'

/**
 * 权限指令 v-perm：元素挂载时校验权限码，无权限则从 DOM 移除
 * 用法：v-perm="'system:node:add'" 或 v-perm="['a', 'b']"（数组满足任一即可）
 */
export const perm: Directive<HTMLElement, string | string[]> = {
  mounted(el, binding) {
    const { value } = binding
    if (!value) return
    // 统一为数组，便于用 some 判断"任一权限即可"
    const required = Array.isArray(value) ? value : [value]
    const permissionStore = usePermissionStore()
    const allowed = required.some((code) => permissionStore.hasPerm(code))
    if (!allowed) {
      // 无权限：直接把该元素从其父节点移除
      el.parentNode?.removeChild(el)
    }
  },
}
