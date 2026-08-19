import { describe, expect, it } from 'vitest'
import { buildMenuTree, resolveUserByToken, users } from './auth'

describe('mock 登录鉴权', () => {
  it('admin 的 token 能解析出全量菜单', () => {
    const result = resolveUserByToken('token-admin')
    expect(result?.userInfo.username).toBe('admin')
    expect(buildMenuTree(users.admin.menuIds).some((m) => m.title === '系统管理')).toBe(true)
  })

  it('非法 token 返回 null', () => {
    expect(resolveUserByToken('token-ghost')).toBeNull()
  })
})

describe('mock/auth buildMenuTree', () => {
  it('按 menuIds 构建：admin 系统管理含 4 子节点 + 业务填报 2 节点', () => {
    const tree = buildMenuTree(users.admin.menuIds)
    expect(tree.map((m) => m.title)).toEqual(['仪表盘', '系统管理', '业务填报'])
    const system = tree.find((m) => m.title === '系统管理')!
    expect(system.children?.map((c) => c.id)).toEqual(['21', '22', '23', '24', '25'])
    const fill = tree.find((m) => m.title === '业务填报')!
    expect(fill.children?.map((c) => c.id)).toEqual(['n1', 'n2'])
    expect(fill.children?.[0].fields?.length).toBeGreaterThan(0)
  })

  it('非管理员：系统管理仅修改密码(25)，业务填报仅 n1', () => {
    const tree = buildMenuTree(users.user.menuIds)
    const system = tree.find((m) => m.title === '系统管理')!
    expect(system.children?.map((c) => c.id)).toEqual(['25'])
    const fill = tree.find((m) => m.title === '业务填报')!
    expect(fill.children?.map((c) => c.id)).toEqual(['n1'])
  })
})
