import type { MockMethod } from 'vite-plugin-mock'
import type { PerItem } from '@/types'

/**
 * 人员单源（globalThis，跨 mock 文件共享）：/system/per 的新增/更新/删除实时反映。
 * 种子 2 人：张三/规划实施科（deptId 13）、李四/数据科（deptId 12）。
 */
const g = globalThis as unknown as { __fengtaiPers?: PerItem[] }

export const pers: PerItem[] = (g.__fengtaiPers ??= [
  { id: '1', name: '张三', deptId: '13', phone: '13800000003', email: 'zhangsan@ft.gov.cn', status: 1 },
  { id: '2', name: '李四', deptId: '12', phone: '13800000004', email: 'lisi@ft.gov.cn', status: 1 },
])

const ok = (data: unknown) => ({ code: 0, message: 'ok', data })

export default [
  { url: '/api/system/per/list', method: 'get', response: () => ok(pers) },
  {
    url: '/api/system/per',
    method: 'post',
    response: ({ body }: { body: Partial<PerItem> }) => {
      pers.push({
        id: String(Date.now()),
        name: body.name ?? '',
        deptId: body.deptId ?? '',
        phone: body.phone,
        email: body.email,
        status: body.status ?? 1,
      })
      return ok(null)
    },
  },
  {
    url: '/api/system/per',
    method: 'put',
    response: ({ body }: { body: PerItem }) => {
      const i = pers.findIndex((p) => p.id === body.id)
      if (i > -1) pers[i] = { ...pers[i], ...body }
      return ok(null)
    },
  },
  {
    url: '/api/system/per',
    method: 'delete',
    response: ({ query }: { query: { id: string } }) => {
      const i = pers.findIndex((p) => p.id === query.id)
      if (i > -1) pers.splice(i, 1)
      return ok(null)
    },
  },
] as MockMethod[]
