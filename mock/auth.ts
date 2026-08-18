import type { MockMethod } from 'vite-plugin-mock'
import type { MenuNode } from '@/types'
import { adminMenus, userMenus } from './menus'

interface MockUser {
  password: string
  nickname: string
  roles: string[]
  deptId: string | null
}

const users: Record<string, MockUser> = {
  admin: { password: 'admin123', nickname: '系统管理员', roles: ['admin'], deptId: '1' },
  user: { password: 'user123', nickname: '普通用户', roles: ['user'], deptId: '1' },
}

export const menusByUsername = (username: string): MenuNode[] =>
  username === 'admin' ? adminMenus : userMenus

export function resolveUserByToken(token: string): {
  userInfo: {
    id: string
    username: string
    nickname: string
    roles: string[]
    deptId: string | null
  }
  menus: MenuNode[]
} | null {
  const username = token.replace(/^token-/, '')
  const u = users[username]
  if (!u) return null
  return {
    userInfo: { id: username, username, nickname: u.nickname, roles: u.roles, deptId: u.deptId },
    menus: menusByUsername(username),
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
] as MockMethod[]
