import type { MockMethod } from 'vite-plugin-mock'
import type { AnnouncementItem } from '@/types'

/**
 * 公示公告单源（globalThis，跨 mock 文件共享）：/announcement 的新增/更新/删除实时反映。
 * 种子 2 条：征地公告公示（p2）/土地供应公告（p1）。
 */
const g = globalThis as unknown as { __fengtaiAnnouncements?: AnnouncementItem[] }

export const announcements: AnnouncementItem[] = (g.__fengtaiAnnouncements ??= [
  {
    id: 'a1',
    projectId: 'p2',
    annType: '公示',
    title: '征地公告公示',
    content: '中央民族大学公交首末站项目征地公告公示：拟征收土地位置及范围详见附件，公示期 30 天。',
    publishDate: '2026-01-10 09:00:00',
    source: '规划实施科',
  },
  {
    id: 'a2',
    projectId: 'p1',
    annType: '公告',
    title: '土地供应公告',
    content: '丰台区城乡一体化槐房村和新宫村改造项目土地供应公告：地块规划用途及供应方式说明。',
    publishDate: '2026-03-01 09:00:00',
  },
])

const ok = (data: unknown) => ({ code: 0, message: 'ok', data })

export default [
  {
    url: '/api/announcement/list',
    method: 'get',
    response: ({ query }: { query: { projectId?: string } }) =>
      ok(announcements.filter((a) => !query.projectId || a.projectId === query.projectId)),
  },
  {
    url: '/api/announcement',
    method: 'post',
    response: ({ body }: { body: Partial<AnnouncementItem> }) => {
      announcements.push({
        id: `a${Date.now()}`,
        projectId: body.projectId,
        annType: body.annType ?? '公告',
        title: body.title ?? '',
        content: body.content ?? '',
        publishDate: body.publishDate ?? new Date().toLocaleString(),
        source: body.source,
      })
      return ok(null)
    },
  },
  {
    url: '/api/announcement',
    method: 'put',
    response: ({ body }: { body: AnnouncementItem }) => {
      const i = announcements.findIndex((a) => a.id === body.id)
      if (i > -1) announcements[i] = { ...announcements[i], ...body }
      return ok(null)
    },
  },
  {
    url: '/api/announcement',
    method: 'delete',
    response: ({ query }: { query: { id: string } }) => {
      const i = announcements.findIndex((a) => a.id === query.id)
      if (i > -1) announcements.splice(i, 1)
      return ok(null)
    },
  },
] as MockMethod[]
