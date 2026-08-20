import type { MockMethod } from 'vite-plugin-mock'
import type { ProjectItem, StatisticsOverview } from '@/types'
import { issues } from './issue'

/**
 * 共享可变状态：vite-plugin-mock 独立打包每个 mock 文件，直接 import 会把数据副本
 * 内联进各自的包、互不相通。用 globalThis 挂一份权威 projects，使 /api/system/project 的新增/更新
 * 与 /api/statistics/overview（同文件读取）实时打通。
 */
const g = globalThis as { __fengtaiProjects?: ProjectItem[] }

g.__fengtaiProjects ??= [
  { id: 'p1', name: '丰台区城乡一体化槐房村和新宫村改造项目', type: 'first', builder: 'xxx单位', location: '丰台区xxx', landSize: 32000, buildingSize: 22323, status: 1, createTime: '2026-01-01 09:00:00' },
  { id: 'p2', name: '中央民族大学公交首末站项目', type: 'second', builder: 'xxx单位', location: '丰台区xxx', landSize: 3200, buildingSize: 2232, status: 1, createTime: '2026-02-01 09:00:00' },
]
export const projects = g.__fengtaiProjects

/** 监测统计聚合（纯函数，可单测） */
export function buildOverview(
  projs: ProjectItem[],
  iss: { status: string }[],
  bizTotal = 500,
): StatisticsOverview {
  return {
    totalProjects: projs.length,
    firstCount: projs.filter((p) => p.type === 'first').length,
    secondCount: projs.filter((p) => p.type === 'second').length,
    issueTotal: iss.length,
    issueSolved: iss.filter((i) => i.status === 'solved').length,
    bizTotal,
  }
}

const ok = (data: unknown) => ({ code: 0, message: 'ok', data })

export default [
  { url: '/api/system/project/list', method: 'get', response: () => ok(projects) },
  {
    url: '/api/system/project',
    method: 'post',
    response: ({ body }: { body: Partial<ProjectItem> }) => {
      projects.push({ id: `p${Date.now()}`, name: body.name ?? '', type: body.type ?? 'second', builder: body.builder, location: body.location, landSize: body.landSize, buildingSize: body.buildingSize, status: body.status ?? 1, createTime: new Date().toLocaleString() })
      return ok(null)
    },
  },
  {
    url: '/api/system/project',
    method: 'put',
    response: ({ body }: { body: ProjectItem }) => {
      const i = projects.findIndex((p) => p.id === body.id)
      if (i > -1) projects[i] = { ...projects[i], ...body }
      return ok(null)
    },
  },
  {
    url: '/api/system/project',
    method: 'delete',
    response: ({ query }: { query: { id: string } }) => {
      const i = projects.findIndex((p) => p.id === query.id)
      if (i > -1) projects.splice(i, 1)
      return ok(null)
    },
  },
  { url: '/api/statistics/overview', method: 'get', response: () => ok(buildOverview(projects, issues)) },
] as MockMethod[]
