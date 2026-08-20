import { describe, expect, it } from 'vitest'
import { toVantFields } from './toVantFields'
import type { FieldConfig } from '@shared/types'

const fields: FieldConfig[] = [
  { prop: 'street', label: '街道名称', type: 'input', required: true },
  { prop: 'district', label: '所属区', type: 'select', options: [{ label: '东城区', value: '东城区' }] },
  { prop: 'kind', label: '类型', type: 'radio', options: [{ label: '月报', value: '月报' }] },
  { prop: 'note', label: '备注', type: 'textarea' },
]

describe('utils/toVantFields', () => {
  it('保留 prop/label/required，并给出默认 placeholder', () => {
    const result = toVantFields(fields)
    expect(result[0]).toMatchObject({ prop: 'street', label: '街道名称', required: true })
    expect(result[0].placeholder).toBe('请输入街道名称')
    expect(result[1].placeholder).toBe('请选择所属区')
    expect(result[3].type).toBe('textarea')
  })

  it('空数组返回空', () => {
    expect(toVantFields([])).toEqual([])
  })
})
