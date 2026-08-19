import { usePermissionStore } from '@/stores/permission'

/**
 * 权限判断组合式函数：在模板指令（v-perm）之外的脚本逻辑中校验权限码
 * @returns 含 hasPerm 方法的对象，传入权限码返回是否有权
 */
export function usePerm() {
  const permissionStore = usePermissionStore()
  return {
    hasPerm: (code: string) => permissionStore.hasPerm(code),
  }
}
