import type { MockMethod } from 'vite-plugin-mock'
import type { FillRecordItem, MenuNode, NodeItem } from '@/types'

/**
 * 共享可变状态：vite-plugin-mock 独立打包每个 mock 文件，直接 import 会把数据副本
 * 内联进各自的包、互不相通。用 globalThis 挂一份权威 nodes，使 /system/node 的新增/停用
 * 与 /auth/me 的 buildNodeMenuChildren（auth.ts 经 './nodes' 读到同一引用）实时打通。
 */
const g = globalThis as unknown as { __fengtaiMockNodes?: NodeItem[] }

export const nodes: NodeItem[] = (g.__fengtaiMockNodes ??= [
  {
    id: 'n1', projectId: 'p2', name: '台账填报', step: 1, sort: 1, status: 1, date: '2026-01-01',
    fields: [
      { prop: 'street', label: '街道名称', type: 'input', required: true },
      { prop: 'population', label: '人口数量', type: 'number', required: true },
      { prop: 'dataDate', label: '数据日期', type: 'date' },
      {
        prop: 'district', label: '所属区', type: 'select',
        options: [{ label: '东城区', value: '东城区' }, { label: '西城区', value: '西城区' }],
      },
      { prop: 'remark', label: '备注', type: 'textarea' },
    ],
  },
  {
    id: 'n2', projectId: 'p2', name: '报表填报', step: 2, sort: 2, status: 1, date: '2026-02-01',
    fields: [
      { prop: 'title', label: '报表标题', type: 'input', required: true },
      {
        prop: 'kind', label: '报表类型', type: 'radio',
        options: [{ label: '月报', value: '月报' }, { label: '年报', value: '年报' }],
      },
      { prop: 'note', label: '说明', type: 'textarea' },
    ],
  },
])

/**
 * 填报记录单源（globalThis，跨 mock 文件/跨 dev server 进程内共享）：
 * /api/node/:id/records 的增改与其它端点读取同一引用，进展录入实时反映。
 */
const fr = globalThis as { __fengtaiFillRecords?: FillRecordItem[] }
fr.__fengtaiFillRecords ??= []
export const fillRecords = fr.__fengtaiFillRecords

/** 节点 → 业务填报子菜单（纯函数：按传入 nodeIds 过滤启用节点、按 sort 排序、携带 fields） */
export function buildNodeMenuChildren(nodeIds: string[], source: NodeItem[] = nodes): MenuNode[] {
  return source
    .filter((n) => nodeIds.includes(n.id) && n.status === 1)
    .sort((a, b) => a.sort - b.sort)
    .map((n) => ({
      id: n.id,
      parentId: '3',
      name: `Node${n.id}`,
      title: n.name,
      path: `/fill/${n.id}`,
      component: 'fill/node',
      icon: '',
      sort: n.sort,
      perms: [],
      fields: n.fields,
    }))
}

const ok = (data: unknown) => ({ code: 0, message: 'ok', data })

export default [
  { url: '/api/system/node/list', method: 'get', response: () => ok(nodes) },
  {
    url: '/api/system/node',
    method: 'post',
    response: ({ body }: { body: Partial<NodeItem> }) => {
      const item: NodeItem = { id: `n${Date.now()}`, projectId: body.projectId ?? '', name: body.name ?? '', step: body.step ?? 1, sort: body.sort ?? 1, status: body.status ?? 1, fields: body.fields ?? [] }
      nodes.push(item)
      return ok(null)
    },
  },
  {
    url: '/api/system/node',
    method: 'put',
    response: ({ body }: { body: NodeItem }) => {
      const i = nodes.findIndex((n) => n.id === body.id)
      if (i > -1) nodes[i] = { ...nodes[i], ...body }
      return ok(null)
    },
  },
  {
    url: '/api/system/node',
    method: 'delete',
    response: ({ query }: { query: { id: string } }) => {
      const i = nodes.findIndex((n) => n.id === query.id)
      if (i > -1) nodes.splice(i, 1)
      return ok(null)
    },
  },
  { url: '/api/node/:id/submit', method: 'post', response: () => ok(null) },
  // ---------- 填报记录（进展录入） ----------
  {
    url: '/api/node/:id/records',
    method: 'get',
    response: ({ params }: { params: { id: string } }) => ok(fillRecords.filter((r) => r.nodeId === params.id)),
  },
  {
    url: '/api/node/:id/records',
    method: 'post',
    response: ({ params, body }: { params: { id: string }; body: { projectId: string; values: Record<string, unknown> } }) => {
      fillRecords.push({ id: `r${Date.now()}`, nodeId: params.id, projectId: body.projectId ?? '', values: body.values ?? {}, createBy: 'demo', createTime: new Date().toLocaleString() })
      return ok(null)
    },
  },
  {
    url: '/api/node/:id/records/:rid',
    method: 'put',
    response: ({ params, body }: { params: { rid: string }; body: { values: Record<string, unknown> } }) => {
      const r = fillRecords.find((x) => x.id === params.rid)
      if (r) r.values = body.values
      return ok(null)
    },
  },
] as MockMethod[]
