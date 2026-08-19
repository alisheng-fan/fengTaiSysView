import type { MockMethod } from 'vite-plugin-mock'
import type { MenuNode } from '@/types'
import { businessGroup, dashboardMenu, systemGroup, systemChildren } from './menus'
import { buildNodeMenuChildren } from './nodes'

export interface MockUser {
  password: string
  nickname: string
  roles: string[]
  deptId: string | null
  menuIds: string[]
}

export const users: Record<string, MockUser> = {
  admin: { password: 'admin123', nickname: '系统管理员', roles: ['admin'], deptId: '1', menuIds: ['1', '2', '21', '22', '23', '24', '25', '3', 'n1', 'n2'] },
  user: { password: 'user123', nickname: '普通用户', roles: ['user'], deptId: '1', menuIds: ['1', '2', '25', '3', 'n1'] },
}

/** 按角色 menuIds 动态构建菜单树：仪表盘 + 系统管理(只含勾选子节点) + 业务填报(只含勾选节点) */
export function buildMenuTree(menuIds: string[]): MenuNode[] {
  const tree: MenuNode[] = []
  if (menuIds.includes('1')) tree.push(dashboardMenu)
  if (menuIds.includes('2')) {
    const children = systemChildren.filter((c) => menuIds.includes(c.id))
    tree.push({ ...systemGroup, children })
  }
  if (menuIds.includes('3')) {
    const nodeIds = menuIds.filter((id) => id.startsWith('n'))
    const nodeChildren = buildNodeMenuChildren(nodeIds)
    if (nodeChildren.length) tree.push({ ...businessGroup, children: nodeChildren })
  }
  return tree
}

export function resolveUserByToken(token: string): {
  userInfo: { id: string; username: string; nickname: string; roles: string[]; deptId: string | null }
  menus: MenuNode[]
} | null {
  const username = token.replace(/^token-/, '')
  const u = users[username]
  if (!u) return null
  return {
    userInfo: { id: username, username, nickname: u.nickname, roles: u.roles, deptId: u.deptId },
    menus: buildMenuTree(u.menuIds),
  }
}

export default [
  {
    url: '/api/auth/login',
    method: 'post',
    response: ({ body }: { body: { username: string; password: string } }) => {
      const u = users[body.username]
      if (!u || u.password !== body.password) {
        return { code: 1, message: '用户名或密码错误', data: null }
      }
      return { code: 0, message: 'ok', data: { token: `token-${body.username}` } }
    },
  },
  {
    url: '/api/auth/logout',
    method: 'post',
    response: () => ({ code: 0, message: 'ok', data: null }),
  },
  {
    url: '/api/auth/me',
    method: 'get',
    response: ({ headers }: { headers: Record<string, string> }) => {
      const token = headers.authorization?.replace('Bearer ', '') ?? ''
      const result = resolveUserByToken(token)
      if (!result) return { code: 1, message: '登录状态失效，请重新登录', data: null }
      return { code: 0, message: 'ok', data: result }
    },
  },
  {
    url: '/api/auth/password',
    method: 'put',
    response: ({ headers, body }: { headers: Record<string, string>; body: { oldPassword: string; newPassword: string } }) => {
      const token = headers.authorization?.replace('Bearer ', '') ?? ''
      const username = token.replace(/^token-/, '')
      const u = users[username]
      if (!u) return { code: 401, message: '未登录', data: null }
      if (u.password !== body.oldPassword) return { code: 1, message: '原密码错误', data: null }
      u.password = body.newPassword
      return { code: 0, message: 'ok', data: null }
    },
  },
] as MockMethod[]
