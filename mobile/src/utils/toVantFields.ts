import type { FieldConfig } from '@shared/types'

/** 适配后的移动端表单字段（Vant 渲染用） */
export interface VantField {
  prop: string
  label: string
  type: FieldConfig['type']
  required: boolean
  options?: FieldConfig['options']
  placeholder: string
}

/** FieldConfig → Vant 表单字段（select/radio 用"请选择"，其余"请输入"） */
export function toVantFields(fields: FieldConfig[]): VantField[] {
  return fields.map((f) => {
    const choose = f.type === 'select' || f.type === 'radio'
    return {
      prop: f.prop,
      label: f.label,
      type: f.type,
      required: f.required ?? false,
      options: f.options,
      placeholder: f.placeholder ?? `${choose ? '请选择' : '请输入'}${f.label}`,
    }
  })
}
