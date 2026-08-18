import type { Directive } from 'vue'
import { usePermissionStore } from '@/stores/permission'

export const perm: Directive<HTMLElement, string | string[]> = {
  mounted(el, binding) {
    const { value } = binding
    if (!value) return
    const required = Array.isArray(value) ? value : [value]
    const permissionStore = usePermissionStore()
    const allowed = required.some((code) => permissionStore.hasPerm(code))
    if (!allowed) {
      el.parentNode?.removeChild(el)
    }
  },
}
