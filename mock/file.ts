import type { MockMethod } from 'vite-plugin-mock'
import type { FlowFileItem } from '@/types'

/**
 * 附件单源（globalThis，跨 mock 文件共享）：mock 只存文件名/路径，/node/:id/upload 上传实时反映。
 * 种子 1 条：n1「台账填报」附件。
 */
const g = globalThis as unknown as { __fengtaiFiles?: FlowFileItem[] }

export const files: FlowFileItem[] = (g.__fengtaiFiles ??= [
  {
    id: 'f1',
    projectId: 'p2',
    nodeId: 'n1',
    fileName: '台账数据表.xlsx',
    filePath: '/mock/files/台账数据表.xlsx',
    fileSize: 20480,
    uploadMan: '张三',
    uploadTime: '2026-01-05 10:00:00',
  },
])

const ok = (data: unknown) => ({ code: 0, message: 'ok', data })

export default [
  // vite-plugin-mock 路径参数落在 query（非 params），此处取 query.id
  {
    url: '/api/node/:id/files',
    method: 'get',
    response: ({ query }: { query: { id: string } }) => ok(files.filter((f) => f.nodeId === query.id)),
  },
  {
    url: '/api/node/:id/upload',
    method: 'post',
    response: ({ query, body }: { query: { id: string }; body: { fileName?: string; fileSize?: number } }) => {
      const fileName = body.fileName ?? ''
      files.push({
        id: `f${Date.now()}`,
        projectId: '',
        nodeId: query.id,
        fileName,
        filePath: `/mock/files/${fileName}`,
        fileSize: body.fileSize ?? 0,
        uploadMan: 'demo',
        uploadTime: new Date().toLocaleString(),
      })
      return ok(null)
    },
  },
] as MockMethod[]
