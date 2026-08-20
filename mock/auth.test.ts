import { describe, expect, it } from 'vitest'
import { buildMenuTree, menuIdsForUser, resolveUserByToken } from './auth'
import { roles } from './system'

describe('mock 登录鉴权', () => {
  it('admin 的 token 能解析出全量菜单', () => {
    const result = resolveUserByToken('token-admin')
    expect(result?.userInfo.username).toBe('admin')
    expect(buildMenuTree(menuIdsForUser('admin')).some((m) => m.title === '系统管理')).toBe(true)
  })

  it('非法 token 返回 null', () => {
    expect(resolveUserByToken('token-ghost')).toBeNull()
  })
})

describe('mock/auth buildMenuTree', () => {
  it('按角色 menuIds 构建：admin 系统管理含 10 子节点 + 业务填报 2 节点', () => {
    const tree = buildMenuTree(menuIdsForUser('admin'))
    expect(tree.map((m) => m.title)).toEqual(['仪表盘', '业务填报', '系统管理'])
    const system = tree.find((m) => m.title === '系统管理')!
    expect(system.children?.map((c) => c.id)).toEqual(['21', '22', '23', '24', '25', '26', '27', '28', '29', '30'])
    const fill = tree.find((m) => m.title === '业务填报')!
    expect(fill.children?.map((c) => c.id)).toEqual(['n1', 'n2'])
    expect(fill.children?.[0].fields?.length).toBeGreaterThan(0)
  })

  it('非管理员：系统管理仅修改密码(25)，业务填报仅 n1', () => {
    const tree = buildMenuTree(menuIdsForUser('user'))
    const system = tree.find((m) => m.title === '系统管理')!
    expect(system.children?.map((c) => c.id)).toEqual(['25'])
    const fill = tree.find((m) => m.title === '业务填报')!
    expect(fill.children?.map((c) => c.id)).toEqual(['n1'])
  })
})

describe('mock/auth 按角色解析 menuIds（分配链路是活的）', () => {
  it('向 user 角色追加 n2 后，其业务填报即时包含报表填报；恢复后不残留', () => {
    const userRole = roles.find((r) => r.code === 'user')!
    const backup = [...userRole.menuIds]
    try {
      userRole.menuIds.push('n2')
      const tree = buildMenuTree(menuIdsForUser('user'))
      const fill = tree.find((m) => m.title === '业务填报')!
      expect(fill.children?.map((c) => c.id)).toEqual(['n1', 'n2'])
    } finally {
      userRole.menuIds = backup
    }
    // 恢复后回到仅 n1
    const restored = buildMenuTree(menuIdsForUser('user'))
    expect(restored.find((m) => m.title === '业务填报')!.children?.map((c) => c.id)).toEqual(['n1'])
  })

  it('无角色用户返回空 menuIds', () => {
    expect(menuIdsForUser('ghost')).toEqual([])
  })
})
