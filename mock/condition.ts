import type { MockMethod } from 'vite-plugin-mock'
import type { FieldCondition } from '@/types'

/**
 * 字段触发条件单源（globalThis，跨 mock 文件共享）：/system/condition 的新增/更新/删除实时反映，
 * engine.ts 的规则引擎读取同一引用。
 * 种子 1 条：n1「台账填报」里「是否重点项目」= 是 时，OPEN 开启 n2「报表填报」。
 */
const g = globalThis as unknown as { __fengtaiConditions?: FieldCondition[] }

export const conditions: FieldCondition[] = (g.__fengtaiConditions ??= [
  {
    id: 'c1',
    nodeId: 'n2',
    triggerNodeId: 'n1',
    triggerFieldId: 'isKey',
    operator: 'eq',
    condValue: '是',
    action: 'OPEN',
    enabled: true,
  },
])

const ok = (data: unknown) => ({ code: 0, message: 'ok', data })

export default [
  { url: '/api/system/condition/list', method: 'get', response: () => ok(conditions) },
  {
    url: '/api/system/condition',
    method: 'post',
    response: ({ body }: { body: Partial<FieldCondition> }) => {
      conditions.push({
        id: `c${Date.now()}`,
        nodeId: body.nodeId ?? '',
        triggerNodeId: body.triggerNodeId ?? '',
        triggerFieldId: body.triggerFieldId ?? '',
        operator: body.operator ?? 'eq',
        condValue: body.condValue ?? '',
        action: body.action ?? 'OPEN',
        enabled: body.enabled ?? true,
      })
      return ok(null)
    },
  },
  {
    url: '/api/system/condition',
    method: 'put',
    response: ({ body }: { body: FieldCondition }) => {
      const i = conditions.findIndex((c) => c.id === body.id)
      if (i > -1) conditions[i] = { ...conditions[i], ...body }
      return ok(null)
    },
  },
  {
    url: '/api/system/condition',
    method: 'delete',
    response: ({ query }: { query: { id: string } }) => {
      const i = conditions.findIndex((c) => c.id === query.id)
      if (i > -1) conditions.splice(i, 1)
      return ok(null)
    },
  },
] as MockMethod[]
