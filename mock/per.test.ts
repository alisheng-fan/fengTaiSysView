import { describe, expect, it } from 'vitest'
import { pers } from './per'

describe('mock/per 种子', () => {
  it('种子 2 人：张三(规划实施科 13) / 李四(数据科 12)，电话/邮箱/状态齐全', () => {
    expect(pers).toHaveLength(2)
    expect(pers.find((p) => p.id === '1')).toMatchObject({
      name: '张三',
      deptId: '13',
      status: 1,
    })
    expect(pers.find((p) => p.id === '2')).toMatchObject({
      name: '李四',
      deptId: '12',
      status: 1,
    })
    for (const p of pers) {
      expect(p.phone).toBeTruthy()
      expect(p.email).toBeTruthy()
    }
  })

  it('增改删实时反映（对应 /system/per 的 create/update/delete 端点行为）', () => {
    const len = pers.length
    // 新增
    pers.push({
      id: 't1',
      name: '测试人员',
      deptId: '12',
      phone: '13800000099',
      email: 't@ft.gov.cn',
      status: 1,
    })
    expect(pers).toHaveLength(len + 1)
    expect(pers.find((x) => x.id === 't1')).toMatchObject({
      name: '测试人员',
      deptId: '12',
      status: 1,
    })
    // 更新（如停用）
    const i = pers.findIndex((x) => x.id === 't1')
    pers[i] = { ...pers[i], status: 0 }
    expect(pers.find((x) => x.id === 't1')!.status).toBe(0)
    // 删除
    pers.splice(i, 1)
    expect(pers.find((x) => x.id === 't1')).toBeUndefined()
    expect(pers).toHaveLength(len)
  })
})
