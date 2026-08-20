import { describe, expect, it } from 'vitest'
import { conditions } from './condition'

describe('mock/condition 种子', () => {
  it('种子条件 c1：n1「是否重点项目」= 是 → OPEN 开启 n2（与 engine 约定一致）', () => {
    const c = conditions.find((x) => x.id === 'c1')
    expect(c).toMatchObject({
      nodeId: 'n2',
      triggerNodeId: 'n1',
      triggerFieldId: 'isKey',
      operator: 'eq',
      condValue: '是',
      action: 'OPEN',
      enabled: true,
    })
  })
})
