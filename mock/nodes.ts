import type { MockMethod } from 'vite-plugin-mock'
import type { FillRecordItem, MenuNode, NodeItem } from '@/types'
import { notices } from './notice'

/**
 * 共享可变状态：vite-plugin-mock 独立打包每个 mock 文件，直接 import 会把数据副本
 * 内联进各自的包、互不相通。用 globalThis 挂一份权威 nodes，使 /system/node 的新增/停用
 * 与 /auth/me 的 buildNodeMenuChildren（auth.ts 经 './nodes' 读到同一引用）实时打通。
 */
const g = globalThis as unknown as { __fengtaiMockNodes?: NodeItem[] }

/** 相对今天 n 天后的日期（YYYY-MM-DD），用作节点截止时间 deadline */
const daysFromNow = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10)

export const nodes: NodeItem[] = (g.__fengtaiMockNodes ??= [
  {
    id: 'n1', projectId: 'p2', phaseId: 'ph2', name: '台账填报', step: 1, sort: 1, status: 1, date: '2026-01-01',
    isNeed: true, isDefault: true, dutyDepId: '13', deadlineDays: 10, deadline: daysFromNow(10),
    fields: [
      { prop: 'street', label: '街道名称', type: 'input', required: true },
      { prop: 'population', label: '人口数量', type: 'number', required: true },
      { prop: 'dataDate', label: '数据日期', type: 'date' },
      {
        prop: 'district', label: '所属区', type: 'select',
        options: [{ label: '东城区', value: '东城区' }, { label: '西城区', value: '西城区' }],
      },
      {
        prop: 'isKey', label: '是否重点项目', type: 'radio',
        options: [{ label: '是', value: '是' }, { label: '否', value: '否' }],
      },
      { prop: 'remark', label: '备注', type: 'textarea' },
    ],
  },
  {
    id: 'n2', projectId: 'p2', phaseId: 'ph4', name: '报表填报', step: 2, sort: 2, status: 1, date: '2026-02-01',
    preNodeIds: ['n1'], preIsAll: true, isNeed: true, isDefault: false,
    dutyDepId: '12', deadlineDays: 15, deadline: daysFromNow(15),
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

/**
 * 节点 → 业务填报子菜单（纯函数：按传入 nodeIds 过滤，可见性只由角色分配决定、
 * 与节点生命周期 status 无关；按 sort 排序、携带 fields）
 */
export function buildNodeMenuChildren(nodeIds: string[], source: NodeItem[] = nodes): MenuNode[] {
  return source
    .filter((n) => nodeIds.includes(n.id))
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

/**
 * 创建填报记录：push 记录后，若存在同 projectId 且 step = 当前节点 step+1 的 isNeed 节点，
 * 自动向 notices 推送一条「上一节点已完成」提醒（提交后自动通知下一环节，前端无需额外调用）。
 * 抽出为纯函数便于单测（POST /api/node/:id/records 处理器调用）。
 */
export function createFillRecord(data: { nodeId: string; projectId: string; values: Record<string, unknown> }): void {
  fillRecords.push({ id: `r${Date.now()}`, nodeId: data.nodeId, projectId: data.projectId ?? '', values: data.values ?? {}, createBy: 'demo', createTime: new Date().toLocaleString() })
  const current = nodes.find((x) => x.id === data.nodeId)
  if (!current) return
  const next = nodes.find((x) => x.projectId === current.projectId && x.step === current.step + 1 && x.isNeed)
  if (!next) return
  notices.push({
    id: `nt${Date.now()}`,
    projectId: current.projectId,
    nodeId: next.id,
    title: `请及时处理${next.name}`,
    content: `上一节点已完成，请及时办理「${next.name}」。`,
    noticeType: 'REMIND',
    read: false,
    createTime: new Date().toLocaleString(),
  })
}

export default [
  { url: '/api/system/node/list', method: 'get', response: () => ok(nodes) },
  {
    url: '/api/system/node',
    method: 'post',
    response: ({ body }: { body: Partial<NodeItem> }) => {
      const item: NodeItem = {
        id: `n${Date.now()}`,
        projectId: body.projectId ?? '',
        phaseId: body.phaseId ?? '',
        name: body.name ?? '',
        step: body.step ?? 1,
        sort: body.sort ?? 1,
        status: body.status ?? 1,
        preNodeIds: body.preNodeIds,
        preIsAll: body.preIsAll,
        isNeed: body.isNeed ?? false,
        isDefault: body.isDefault ?? false,
        dutyDepId: body.dutyDepId,
        deadlineDays: body.deadlineDays,
        deadline: body.deadline,
        fields: body.fields ?? [],
      }
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
  // ---------- 填报记录（进展录入） ----------
  {
    url: '/api/node/:id/records',
    method: 'get',
    response: ({ query }: { query: { id: string } }) => ok(fillRecords.filter((r) => r.nodeId === query.id)),
  },
  {
    url: '/api/node/:id/records',
    method: 'post',
    response: ({ query, body }: { query: { id: string }; body: { projectId: string; values: Record<string, unknown> } }) => {
      createFillRecord({ nodeId: query.id, projectId: body.projectId ?? '', values: body.values ?? {} })
      return ok(null)
    },
  },
  {
    url: '/api/node/:id/records/:rid',
    method: 'put',
    response: ({ query, body }: { query: { rid: string }; body: { values: Record<string, unknown> } }) => {
      const r = fillRecords.find((x) => x.id === query.rid)
      if (r) r.values = body.values
      return ok(null)
    },
  },
] as MockMethod[]
