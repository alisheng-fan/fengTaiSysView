import { describe, expect, it } from 'vitest'
import { resolveUserByToken, menusByUsername } from './auth'

describe('mock 登录鉴权', () => {
  it('admin 的 token 能解析出全量菜单', () => {
    const result = resolveUserByToken('token-admin')
    expect(result?.userInfo.username).toBe('admin')
    expect(result?.menus.length).toBe(2)
    expect(menusByUsername('admin').some((m) => m.title === '系统管理')).toBe(true)
  })

  it('user 的 token 只有仪表盘', () => {
    const result = resolveUserByToken('token-user')
    expect(result?.menus.length).toBe(1)
    expect(result?.menus[0].title).toBe('仪表盘')
  })

  it('非法 token 返回 null', () => {
    expect(resolveUserByToken('token-ghost')).toBeNull()
  })
})
