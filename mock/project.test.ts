import { describe, expect, it } from 'vitest'
import { buildOverview } from './project'
import type { DeptItem, NodeItem, ProjectItem } from '@/types'

const projects: ProjectItem[] = [
  { id: 'p1', name: 'A', type: 'first', status: 1, createTime: '' },
  { id: 'p2', name: 'B', type: 'second', status: 1, createTime: '' },
  { id: 'p3', name: 'C', type: 'second', status: 2, createTime: '' },
]

const day = 86400000
const yesterday = new Date(Date.now() - day).toISOString().slice(0, 10)
const tomorrow = new Date(Date.now() + day).toISOString().slice(0, 10)

const nodes: NodeItem[] = [
  { id: 'n1', projectId: 'p1', phaseId: 'ph2', name: '台账填报', step: 1, sort: 1, status: 1, isNeed: true, isDefault: true, dutyDepId: '13', deadlineDays: 10, deadline: yesterday, fields: [] },
  { id: 'n2', projectId: 'p1', phaseId: 'ph4', name: '报表填报', step: 1, sort: 1, status: 2, isNeed: true, isDefault: false, dutyDepId: '13', deadline: tomorrow, fields: [] },
  { id: 'n3', projectId: 'p2', phaseId: 'ph4', name: '监督核验', step: 1, sort: 1, status: 1, isNeed: true, isDefault: false, dutyDepId: '12', deadline: tomorrow, fields: [] },
]

const depts: DeptItem[] = [
  { id: '12', parentId: '1', name: '数据科', sort: 1, status: 1 },
  { id: '13', parentId: '1', name: '规划实施科', sort: 2, status: 1 },
]

describe('mock/project buildOverview', () => {
  it('聚合项目/问题/节点统计（含超时与科室效率）', () => {
    const r = buildOverview(projects, [{ status: 'solved' }, { status: 'partial' }, { status: 'shelved' }], nodes, depts)
    expect(r.totalProjects).toBe(3)
    expect(r.firstCount).toBe(1)
    expect(r.secondCount).toBe(2)
    expect(r.issueTotal).toBe(3)
    expect(r.issueSolved).toBe(1)
    expect(r.bizTotal).toBe(500)
    // 节点统计
    expect(r.nodeTotal).toBe(3)
    expect(r.nodeDone).toBe(1)
    expect(r.nodeRate).toBe(33) // Math.round(1/3*100)
    // 超时：n1 截止已过且未完成；n2 已完成、n3 截止在未来，均不计
    expect(r.overdueNodes).toBe(1)
    expect(r.overdueProjects).toBe(1)
    // 科室效率：按 dutyDepId 分组（n1/n2→规划实施科，n3→数据科）
    expect(r.depEfficiency).toEqual([
      { depName: '规划实施科', done: 1, total: 2 },
      { depName: '数据科', done: 0, total: 1 },
    ])
  })

  it('已完成节点即使截止时间已过也不算超时；完成率 100%', () => {
    const doneOverdue: NodeItem[] = [
      { id: 'n9', projectId: 'p1', phaseId: 'ph2', name: '已完成', step: 1, sort: 1, status: 2, isNeed: true, isDefault: true, dutyDepId: '13', deadline: yesterday, fields: [] },
    ]
    const r = buildOverview([], [], doneOverdue, depts)
    expect(r.nodeTotal).toBe(1)
    expect(r.nodeDone).toBe(1)
    expect(r.nodeRate).toBe(100)
    expect(r.overdueNodes).toBe(0)
  })

  it('空节点：nodeRate 0、超时 0、科室效率空', () => {
    const r = buildOverview(projects, [], [], [])
    expect(r.nodeTotal).toBe(0)
    expect(r.nodeDone).toBe(0)
    expect(r.nodeRate).toBe(0)
    expect(r.overdueNodes).toBe(0)
    expect(r.overdueProjects).toBe(0)
    expect(r.depEfficiency).toEqual([])
  })

  it('无 dutyDepId 的节点不计入科室效率', () => {
    const noDep: NodeItem[] = [
      { id: 'n1', projectId: 'p1', phaseId: 'ph2', name: 'A', step: 1, sort: 1, status: 1, isNeed: true, isDefault: true, fields: [] },
    ]
    const r = buildOverview([], [], noDep, depts)
    expect(r.depEfficiency).toEqual([])
    expect(r.overdueNodes).toBe(0)
  })
})
