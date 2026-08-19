import { describe, expect, it } from 'vitest'
import { toFormFields } from './form'
import type { FieldConfig } from '@/types'

const fields: FieldConfig[] = [
  { prop: 'street', label: '街道名称', type: 'input', required: true },
  { prop: 'district', label: '所属区', type: 'select', options: [{ label: '东城区', value: '东城区' }] },
  { prop: 'note', label: '备注', type: 'textarea' },
]

describe('utils/form toFormFields', () => {
  it('把 FieldConfig 转成 ProForm FormField，required 生成必填规则', () => {
    const result = toFormFields(fields)
    expect(result).toHaveLength(3)
    expect(result[0]).toMatchObject({ prop: 'street', label: '街道名称', type: 'input' })
    expect(result[0].rules?.[0].required).toBe(true)
    expect(result[1].options).toEqual([{ label: '东城区', value: '东城区' }])
    expect(result[2].rules ?? []).toHaveLength(0)
  })

  it('select/radio 必填时提示"请选择"，其余"请输入"', () => {
    const sel = toFormFields([{ prop: 'x', label: '类型', type: 'radio', required: true }])
    expect(sel[0].rules?.[0].message).toBe('请选择类型')
    const inp = toFormFields([{ prop: 'y', label: '姓名', type: 'input', required: true }])
    expect(inp[0].rules?.[0].message).toBe('请输入姓名')
  })

  it('空数组返回空', () => {
    expect(toFormFields([])).toEqual([])
  })
})
