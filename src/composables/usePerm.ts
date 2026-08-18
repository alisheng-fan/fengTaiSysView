import { usePermissionStore } from '@/stores/permission'

export function usePerm() {
  const permissionStore = usePermissionStore()
  return {
    hasPerm: (code: string) => permissionStore.hasPerm(code),
  }
}
