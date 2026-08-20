import { describe, expect, it } from 'vitest'
import { applyConditions, evalCondition } from './engine'
import { conditions } from './condition'
import type { FieldCondition } from '@/types'

/** 构造一条基础条件，按需覆盖字段 */
function cond(over: Partial<FieldCondition>): FieldCondition {
  return { id: 'x', nodeId: 'n2', triggerNodeId: 'n1', triggerFieldId: 'f', operator: 'eq', condValue: '', action: 'OPEN', enabled: true, ...over }
}

describe('mock/engine evalCondition', () => {
  it('eq：值相等命中，不等不命中', () => {
    expect(evalCondition(cond({ operator: 'eq', condValue: '是' }), { f: '是' })).toBe(true)
    expect(evalCondition(cond({ operator: 'eq', condValue: '是' }), { f: '否' })).toBe(false)
  })

  it('neq：值不等命中，相等不命中', () => {
    expect(evalCondition(cond({ operator: 'neq', condValue: '否' }), { f: '是' })).toBe(true)
    expect(evalCondition(cond({ operator: 'neq', condValue: '是' }), { f: '是' })).toBe(false)
  })

  it('in：逗号分隔列表中包含条件值则命中', () => {
    expect(evalCondition(cond({ operator: 'in', condValue: '东城' }), { f: '东城,西城' })).toBe(true)
    expect(evalCondition(cond({ operator: 'in', condValue: '海淀' }), { f: '东城,西城' })).toBe(false)
  })

  it('notin：列表中不包含条件值则命中', () => {
    expect(evalCondition(cond({ operator: 'notin', condValue: '海淀' }), { f: '东城,西城' })).toBe(true)
    expect(evalCondition(cond({ operator: 'notin', condValue: '东城' }), { f: '东城,西城' })).toBe(false)
  })

  it('empty：undefined / 空串 / null 均命中', () => {
    expect(evalCondition(cond({ operator: 'empty' }), {})).toBe(true)
    expect(evalCondition(cond({ operator: 'empty' }), { f: '' })).toBe(true)
    expect(evalCondition(cond({ operator: 'empty' }), { f: null })).toBe(true)
    expect(evalCondition(cond({ operator: 'empty' }), { f: 'x' })).toBe(false)
  })

  it('notempty：有值命中，空串/缺失不命中', () => {
    expect(evalCondition(cond({ operator: 'notempty' }), { f: 'x' })).toBe(true)
    expect(evalCondition(cond({ operator: 'notempty' }), { f: '' })).toBe(false)
    expect(evalCondition(cond({ operator: 'notempty' }), {})).toBe(false)
  })

  it('未知 operator 落入 default 返回 false', () => {
    const c: FieldCondition = cond({})
    c.operator = 'gt' as unknown as FieldCondition['operator']
    expect(evalCondition(c, { f: 'x' })).toBe(false)
  })
})

describe('mock/engine applyConditions', () => {
  it('命中种子 OPEN 条件：n1 填报 isKey=是 → 开启 n2', () => {
    const r = applyConditions('n1', { isKey: '是' })
    expect(r.openNodeIds).toContain('n2')
  })

  it('未命中 → 不开启任何节点', () => {
    const r = applyConditions('n1', { isKey: '否' })
    expect(r.openNodeIds).toEqual([])
    expect(r.hideFieldIds).toEqual([])
  })

  it('命中 HIDE 条件 → 隐藏触发字段（临时条件，finally 恢复）', () => {
    const c: FieldCondition = { id: 'test-hide', nodeId: 'n2', triggerNodeId: 'n1', triggerFieldId: 'isKey', operator: 'eq', condValue: '是', action: 'HIDE', enabled: true }
    conditions.push(c)
    try {
      const r = applyConditions('n1', { isKey: '是' })
      expect(r.hideFieldIds).toContain('isKey')
      // 种子 OPEN 条件仍生效
      expect(r.openNodeIds).toContain('n2')
    } finally {
      const i = conditions.findIndex((x) => x.id === c.id)
      if (i > -1) conditions.splice(i, 1)
    }
  })

  it('结果去重：多条同一 OPEN 条件只返回一次', () => {
    const cs: FieldCondition[] = [
      { id: 't1', nodeId: 'n2', triggerNodeId: 'n1', triggerFieldId: 'isKey', operator: 'eq', condValue: '是', action: 'OPEN', enabled: true },
      { id: 't2', nodeId: 'n2', triggerNodeId: 'n1', triggerFieldId: 'isKey', operator: 'eq', condValue: '是', action: 'OPEN', enabled: true },
    ]
    conditions.push(...cs)
    try {
      const r = applyConditions('n1', { isKey: '是' })
      expect(r.openNodeIds).toEqual(['n2'])
    } finally {
      for (const x of cs) {
        const i = conditions.findIndex((y) => y.id === x.id)
        if (i > -1) conditions.splice(i, 1)
      }
    }
  })

  it('禁用条件不生效', () => {
    const c: FieldCondition = { id: 'test-disabled', nodeId: 'nX', triggerNodeId: 'n1', triggerFieldId: 'isKey', operator: 'eq', condValue: '是', action: 'OPEN', enabled: false }
    conditions.push(c)
    try {
      const r = applyConditions('n1', { isKey: '是' })
      // 仅种子 c1 生效；若禁用条件生效 openNodeIds 应含 nX
      expect(r.openNodeIds).toEqual(['n2'])
    } finally {
      const i = conditions.findIndex((x) => x.id === c.id)
      if (i > -1) conditions.splice(i, 1)
    }
  })
})
