import { describe, expect, it } from 'vitest'
import { buildOverview } from './project'
import type { ProjectItem } from '@/types'

const projects: ProjectItem[] = [
  { id: 'p1', name: 'A', type: 'first', status: 1, createTime: '' },
  { id: 'p2', name: 'B', type: 'second', status: 1, createTime: '' },
  { id: 'p3', name: 'C', type: 'second', status: 2, createTime: '' },
]

describe('mock/project buildOverview', () => {
  it('聚合项目/问题统计', () => {
    const r = buildOverview(projects, [{ status: 'solved' }, { status: 'partial' }, { status: 'shelved' }])
    expect(r).toEqual({ totalProjects: 3, firstCount: 1, secondCount: 2, issueTotal: 3, issueSolved: 1, bizTotal: 500 })
  })
})
