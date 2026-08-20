import type { MockMethod } from 'vite-plugin-mock'
import type { LoginLogItem } from '@/types'

/**
 * 登录日志单源（globalThis，跨 mock 文件共享）：/auth/login 的成功/失败都会写入，
 * /system/loginlog/list 读取同一引用，登录动作实时反映。
 */
const g = globalThis as unknown as { __fengtaiLoginLogs?: LoginLogItem[] }

export const loginlogs: LoginLogItem[] = (g.__fengtaiLoginLogs ??= [
  { id: '1', username: 'admin', ip: '127.0.0.1', loginTime: '2026-08-01 09:00:00', status: 1, msg: '登录成功' },
  { id: '2', username: 'user', ip: '127.0.0.1', loginTime: '2026-08-02 10:00:00', status: 1, msg: '登录成功' },
])

const ok = (data: unknown) => ({ code: 0, message: 'ok', data })

export default [
  {
    url: '/api/system/loginlog/list',
    method: 'get',
    response: ({ query }: { query: { username?: string; status?: string } }) => {
      const list = loginlogs.filter(
        (l) =>
          (!query.username || l.username.includes(query.username)) &&
          (query.status === undefined || query.status === '' || String(l.status) === query.status),
      )
      return ok(list)
    },
  },
] as MockMethod[]
