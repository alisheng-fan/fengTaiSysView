import { describe, expect, it } from 'vitest'
import type { DeptItem } from '@/types'
import { buildDeptTree } from './system'

const seed: DeptItem[] = [
  { id: '1', parentId: null, name: '丰台区', sort: 1, leader: '张主任', phone: '010-1234', status: 1 },
  { id: '11', parentId: '1', name: '政务科', sort: 1, leader: '李科长', status: 1 },
  { id: '12', parentId: '1', name: '数据科', sort: 2, leader: '王科长', status: 1 },
  { id: '121', parentId: '12', name: '平台组', sort: 1, status: 1 },
]

describe('mock/system buildDeptTree', () => {
  it('扁平种子数据构建出两层树', () => {
    const tree = buildDeptTree(seed)
    expect(tree).toHaveLength(1)
    const root = tree[0]
    expect(root.name).toBe('丰台区')
    expect(root.children).toHaveLength(2)
    const children = root.children!.map((c) => c.name)
    expect(children).toEqual(expect.arrayContaining(['政务科', '数据科']))
    const dataKe = root.children!.find((c) => c.name === '数据科')!
    expect(dataKe.children).toHaveLength(1)
    expect(dataKe.children![0].name).toBe('平台组')
  })

  it('parentId 缺失的节点成为根', () => {
    const orphan: DeptItem[] = [
      { id: 'a', parentId: 'ghost', name: '孤儿部门', sort: 1, status: 1 },
      { id: 'b', parentId: null, name: '根部门', sort: 1, status: 1 },
    ]
    const tree = buildDeptTree(orphan)
    expect(tree.map((d) => d.name)).toEqual(expect.arrayContaining(['孤儿部门', '根部门']))
    expect(tree).toHaveLength(2)
  })

  it('空数组返回空树', () => {
    expect(buildDeptTree([])).toEqual([])
  })
})
