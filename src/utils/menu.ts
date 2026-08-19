/**
 * 菜单工具：把"角色分配权限"时勾选的叶子节点 id 还原为完整的 menuIds 数组
 * 业务填报节点以 n 前缀标识，系统管理/仪表盘节点为普通数字 id
 */
/** 权限树叶子 id 前缀：业务填报节点（n 开头），其余归系统管理/仪表盘 */
const NODE_PREFIX = 'n'

/**
 * 根据权限树勾选的叶子节点 id 重建完整 menuIds（供角色分配权限保存）：
 * - 仪表盘(1) 恒含；
 * - 系统管理(2) 下勾选任一非仪表盘子节点 → 附带父组 '2'；
 * - 业务填报(3) 下勾选任一节点 → 附带父组 '3'。
 */
export function buildMenuIdsFromLeaves(leafKeys: string[]): string[] {
  const menuIds: string[] = ['1']
  const sysKeys = leafKeys.filter((id) => !id.startsWith(NODE_PREFIX))
  if (sysKeys.some((id) => id !== '1')) {
    menuIds.push('2', ...sysKeys.filter((id) => id !== '1'))
  }
  const nodeKeys = leafKeys.filter((id) => id.startsWith(NODE_PREFIX))
  if (nodeKeys.length) {
    menuIds.push('3', ...nodeKeys)
  }
  return menuIds
}
