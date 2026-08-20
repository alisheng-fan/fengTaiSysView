import { request } from './request'

/** 规则引擎：按填报值返回应开启/隐藏的节点与字段 */
export interface EngineResult {
  openNodeIds: string[]
  hideFieldIds: string[]
}

/** 规则引擎：提交节点填报值，返回应开启的节点与应隐藏的字段（mock 简化版） */
export function applyConditions(nodeId: string, values: Record<string, unknown>): Promise<EngineResult> {
  return request<EngineResult>({ url: '/engine/apply', method: 'post', data: { nodeId, values } })
}
