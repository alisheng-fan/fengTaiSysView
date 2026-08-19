import { describe, expect, it } from 'vitest'
import { buildMenuIdsFromLeaves } from './menu'

describe('utils/menu buildMenuIdsFromLeaves', () => {
  it('仅勾选系统管理子节点：附带父组 2，不含业务填报', () => {
    expect(buildMenuIdsFromLeaves(['1', '21', '22'])).toEqual(['1', '2', '21', '22'])
  })

  it('仅勾选填报节点：附带父组 3，不含系统管理子项', () => {
    expect(buildMenuIdsFromLeaves(['1', 'n1', 'n2'])).toEqual(['1', '3', 'n1', 'n2'])
  })

  it('系统管理与填报节点都勾选：同时附带父组 2、3', () => {
    expect(buildMenuIdsFromLeaves(['1', '21', 'n1'])).toEqual(['1', '2', '21', '3', 'n1'])
  })

  it('仅仪表盘：返回只含 1', () => {
    expect(buildMenuIdsFromLeaves(['1'])).toEqual(['1'])
  })

  it('空叶子：仍含仪表盘', () => {
    expect(buildMenuIdsFromLeaves([])).toEqual(['1'])
  })
})
