import { describe, expect, it } from 'vitest'
import { buildNodeMenuChildren } from './nodes'
import type { NodeItem } from '@/types'

describe('mock/nodes buildNodeMenuChildren', () => {
  it('按传入 nodeIds 过滤并按 sort 排序，携带 fields', () => {
    const result = buildNodeMenuChildren(['n2', 'n1'])
    expect(result.map((m) => m.id)).toEqual(['n1', 'n2'])
    expect(result[0].title).toBe('台账填报')
    expect(result[0].path).toBe('/fill/n1')
    expect(result[0].component).toBe('fill/node')
    expect(result[0].fields?.length).toBeGreaterThan(0)
  })

  it('未传入的 nodeId 不返回；status 不再作为可见性过滤', () => {
    const custom: NodeItem[] = [
      { id: 'x1', projectId: 'p1', phaseId: 'ph1', name: '进行中节点', step: 1, sort: 1, status: 1, isNeed: true, isDefault: true, fields: [] },
      { id: 'x2', projectId: 'p1', phaseId: 'ph1', name: '已完成节点', step: 2, sort: 2, status: 2, isNeed: true, isDefault: false, fields: [] },
    ]
    // 只分配 x1 → 仅返回 x1（x2 未分配即使 status 正常也不返回）
    const onlyX1 = buildNodeMenuChildren(['x1'], custom)
    expect(onlyX1.map((m) => m.id)).toEqual(['x1'])
    // 同时分配 x1/x2 → 两个都返回（status 不影响菜单可见性）
    const both = buildNodeMenuChildren(['x1', 'x2'], custom)
    expect(both.map((m) => m.id)).toEqual(['x1', 'x2'])
  })

  it('菜单可见性仅由角色分配决定：已完成节点在分配后仍可见', () => {
    const custom: NodeItem[] = [
      { id: 'x1', projectId: 'p1', phaseId: 'ph1', name: '进行中节点', step: 1, sort: 1, status: 1, isNeed: true, isDefault: true, fields: [] },
      { id: 'x2', projectId: 'p1', phaseId: 'ph1', name: '已完成节点', step: 2, sort: 2, status: 2, isNeed: true, isDefault: false, fields: [] },
    ]
    // 生命周期 status=2（已完成）不影响可见性：已分配即返回
    const result = buildNodeMenuChildren(['x2'], custom)
    expect(result.map((m) => m.id)).toEqual(['x2'])
    expect(result[0].title).toBe('已完成节点')
  })

  it('空数组返回空', () => {
    expect(buildNodeMenuChildren([])).toEqual([])
  })
})
