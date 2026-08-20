import type { MockMethod } from 'vite-plugin-mock'
import type { PhaseItem } from '@/types'

/**
 * 阶段配置单源（globalThis，跨 mock 文件共享）：4 阶段（前期立项/土地征地/土地供应/建设及核验），
 * /system/phase 的新增/更新/删除实时反映，供节点挂阶段读取同一引用。
 */
const g = globalThis as unknown as { __fengtaiPhases?: PhaseItem[] }

export const phases: PhaseItem[] = (g.__fengtaiPhases ??= [
  { id: 'ph1', name: '前期立项', levelNo: 1, sortNo: 1 },
  { id: 'ph2', name: '土地征地', prePhaseId: 'ph1', preIsAll: true, levelNo: 2, sortNo: 2 },
  { id: 'ph3', name: '土地供应', prePhaseId: 'ph2', preIsAll: true, levelNo: 3, sortNo: 3 },
  { id: 'ph4', name: '建设及核验', prePhaseId: 'ph3', preIsAll: true, levelNo: 4, sortNo: 4 },
])

const ok = (data: unknown) => ({ code: 0, message: 'ok', data })

export default [
  { url: '/api/system/phase/list', method: 'get', response: () => ok(phases) },
  {
    url: '/api/system/phase',
    method: 'post',
    response: ({ body }: { body: Partial<PhaseItem> }) => {
      phases.push({
        id: `ph${Date.now()}`,
        name: body.name ?? '',
        prePhaseId: body.prePhaseId,
        preIsAll: body.preIsAll ?? false,
        levelNo: body.levelNo ?? 1,
        sortNo: body.sortNo ?? 1,
      })
      return ok(null)
    },
  },
  {
    url: '/api/system/phase',
    method: 'put',
    response: ({ body }: { body: PhaseItem }) => {
      const i = phases.findIndex((p) => p.id === body.id)
      if (i > -1) phases[i] = { ...phases[i], ...body }
      return ok(null)
    },
  },
  {
    url: '/api/system/phase',
    method: 'delete',
    response: ({ query }: { query: { id: string } }) => {
      const i = phases.findIndex((p) => p.id === query.id)
      if (i > -1) phases.splice(i, 1)
      return ok(null)
    },
  },
] as MockMethod[]
