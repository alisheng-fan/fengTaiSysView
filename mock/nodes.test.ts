import { describe, expect, it } from 'vitest'
import { buildNodeMenuChildren } from './nodes'
import type { NodeItem } from '@/types'

describe('mock/nodes buildNodeMenuChildren', () => {
  it('按传入 nodeIds 过滤启用节点并按 sort 排序，携带 fields', () => {
    const result = buildNodeMenuChildren(['n2', 'n1'])
    expect(result.map((m) => m.id)).toEqual(['n1', 'n2'])
    expect(result[0].title).toBe('台账填报')
    expect(result[0].path).toBe('/fill/n1')
    expect(result[0].component).toBe('fill/node')
    expect(result[0].fields?.length).toBeGreaterThan(0)
  })

  it('停用节点不返回；未传入的 nodeId 不返回', () => {
    const custom: NodeItem[] = [
      { id: 'x1', projectId: 'p1', name: '启用节点', step: 1, sort: 1, status: 1, fields: [] },
      { id: 'x2', projectId: 'p1', name: '停用节点', step: 2, sort: 2, status: 0, fields: [] },
    ]
    const result = buildNodeMenuChildren(['x1', 'x2'], custom)
    expect(result.map((m) => m.id)).toEqual(['x1'])
  })

  it('空数组返回空', () => {
    expect(buildNodeMenuChildren([])).toEqual([])
  })
})
