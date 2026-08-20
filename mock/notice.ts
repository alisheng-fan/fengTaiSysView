import type { MockMethod } from 'vite-plugin-mock'
import type { NoticeItem } from '@/types'

/**
 * 通知提醒单源（globalThis，跨 mock 文件共享）：/notice/list 读取、/notice/read 标记已读实时反映。
 * 种子 1 条：提醒数据科处理 n2「报表填报」。
 */
const g = globalThis as unknown as { __fengtaiNotices?: NoticeItem[] }

export const notices: NoticeItem[] = (g.__fengtaiNotices ??= [
  {
    id: 'nt1',
    projectId: 'p2',
    nodeId: 'n2',
    title: '请及时处理报表填报',
    content: '数据科：n2「报表填报」节点待处理，请在办理时限内完成填报。',
    noticeType: 'REMIND',
    read: false,
    createTime: '2026-08-01 09:00:00',
  },
])

const ok = (data: unknown) => ({ code: 0, message: 'ok', data })

export default [
  {
    url: '/api/notice/list',
    method: 'get',
    response: ({ query }: { query: { projectId?: string } }) =>
      ok(notices.filter((n) => !query.projectId || n.projectId === query.projectId)),
  },
  {
    url: '/api/notice/read',
    method: 'put',
    response: ({ body }: { body: { id: string } }) => {
      const n = notices.find((x) => x.id === body.id)
      if (n) n.read = true
      return ok(null)
    },
  },
] as MockMethod[]
