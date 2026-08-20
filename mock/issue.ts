import type { MockMethod } from 'vite-plugin-mock'
import type { IssueItem } from '@/types'

/**
 * 共享可变状态：vite-plugin-mock 独立打包每个 mock 文件，直接 import 会把数据副本
 * 内联进各自的包、互不相通。用 globalThis 挂一份权威 issues，使 /api/issue 的新增/更新
 * 与 /api/statistics/overview（project.ts 经 './issue' 读到同一引用）实时打通。
 */
const g = globalThis as { __fengtaiIssues?: IssueItem[] }

g.__fengtaiIssues ??= [
  { id: 'i1', nodeId: 'n1', projectId: 'p2', nodeName: '征地>草拟征地公告', dept: '规划实施科', description: '前期沟通时效，现面积核准有误，无法发布征地公告。标准不一致，影响项目进度。', status: 'solved', createTime: '2026-01-01 10:00:00' },
  { id: 'i2', nodeId: 'n2', projectId: 'p2', nodeName: '项目实施方案审批', dept: '规划实施科', description: '指标不一致，需统一项目指标，与规划相关部门确认。', status: 'partial', createTime: '2026-02-01 10:00:00' },
]
export const issues = g.__fengtaiIssues

const ok = (data: unknown) => ({ code: 0, message: 'ok', data })

export default [
  {
    url: '/api/issue/list',
    method: 'get',
    response: ({ query }: { query: { projectId?: string } }) =>
      ok(issues.filter((i) => !query.projectId || i.projectId === query.projectId)),
  },
  {
    url: '/api/issue',
    method: 'post',
    response: ({ body }: { body: Partial<IssueItem> }) => {
      issues.push({ id: `i${Date.now()}`, nodeId: body.nodeId ?? '', projectId: body.projectId ?? '', nodeName: body.nodeName ?? '', dept: body.dept ?? '', description: body.description ?? '', status: body.status ?? 'discuss', createTime: new Date().toLocaleString() })
      return ok(null)
    },
  },
  {
    url: '/api/issue',
    method: 'put',
    response: ({ body }: { body: IssueItem }) => {
      const i = issues.findIndex((x) => x.id === body.id)
      if (i > -1) issues[i] = { ...issues[i], ...body }
      return ok(null)
    },
  },
] as MockMethod[]
