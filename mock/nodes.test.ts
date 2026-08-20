import { describe, expect, it } from 'vitest'
import { buildNodeMenuChildren, createFillRecord, fillRecords } from './nodes'
import { notices } from './notice'
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

describe('mock/nodes createFillRecord 提交后自动通知', () => {
  it('提交 n1 填报后自动推送 n2「报表填报」提醒：通知数 +1 且字段正确', () => {
    const recordsBefore = fillRecords.length
    const noticesBefore = notices.length
    createFillRecord({ nodeId: 'n1', projectId: 'p2', values: { street: '示例街道', population: '1000', isKey: '是' } })
    try {
      expect(fillRecords.length).toBe(recordsBefore + 1)
      expect(notices.length).toBe(noticesBefore + 1)
      const nt = notices[notices.length - 1]
      expect(nt).toMatchObject({
        projectId: 'p2',
        nodeId: 'n2',
        noticeType: 'REMIND',
        read: false,
      })
      expect(nt.id).toMatch(/^nt\d+$/)
      expect(nt.title).toBe('请及时处理报表填报')
      expect(nt.content).toContain('报表填报')
    } finally {
      // globalThis 跨测试共享：恢复长度，避免影响本文件其它用例
      fillRecords.pop()
      notices.pop()
    }
  })

  it('最后一个节点（无同项目 step+1 的 isNeed 节点）提交不产生通知', () => {
    const noticesBefore = notices.length
    createFillRecord({ nodeId: 'n2', projectId: 'p2', values: { title: '月报' } })
    try {
      expect(notices.length).toBe(noticesBefore)
    } finally {
      fillRecords.pop()
    }
  })
})
