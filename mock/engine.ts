import type { MockMethod } from 'vite-plugin-mock'
import type { FieldCondition } from '@/types'
import { conditions } from './condition'
import { fillRecords } from './nodes'

/** 按触发节点的填报值判断条件是否满足（纯函数，可单测） */
export function evalCondition(cond: FieldCondition, values: Record<string, unknown>): boolean {
  const v = values[cond.triggerFieldId]
  switch (cond.operator) {
    case 'eq':
      return String(v) === cond.condValue
    case 'neq':
      return String(v) !== cond.condValue
    case 'in':
      return String(v)
        .split(',')
        .includes(cond.condValue)
    case 'notin':
      return !String(v)
        .split(',')
        .includes(cond.condValue)
    case 'empty':
      return v === undefined || v === '' || v === null
    case 'notempty':
      return v !== undefined && v !== '' && v !== null
    default:
      return false
  }
}

/** 规则引擎：给定目标节点（触发节点）+ 该节点已提交的填报值，返回应开启的节点与应隐藏的字段（纯函数，可单测） */
export function applyConditions(targetNodeId: string, values: Record<string, unknown>): {
  openNodeIds: string[]
  hideFieldIds: string[]
} {
  const openNodeIds: string[] = []
  const hideFieldIds: string[] = []
  for (const cond of conditions.filter((c) => c.enabled && c.triggerNodeId === targetNodeId)) {
    const hit = evalCondition(cond, values)
    if (cond.action === 'OPEN' && hit) openNodeIds.push(cond.nodeId)
    if (cond.action === 'HIDE' && hit) hideFieldIds.push(cond.triggerFieldId)
  }
  return { openNodeIds: [...new Set(openNodeIds)], hideFieldIds: [...new Set(hideFieldIds)] }
}

const ok = (data: unknown) => ({ code: 0, message: 'ok', data })

export default [
  {
    // 取 body.nodeId 的最新填报记录 values 作判定（caller 直接传 body { nodeId, values }）
    url: '/api/engine/apply',
    method: 'post',
    response: ({ body }: { body: { nodeId: string; values?: Record<string, unknown> } }) => {
      const latest = [...fillRecords].reverse().find((r) => r.nodeId === body.nodeId)
      const values = body.values ?? latest?.values ?? {}
      return ok(applyConditions(body.nodeId, values))
    },
  },
] as MockMethod[]
