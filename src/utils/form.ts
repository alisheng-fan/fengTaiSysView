/** 表单工具：节点字段配置（FieldConfig）与 ProForm 配置（FormField）之间的转换 */
import type { FormField } from '@/components/ProForm/types'
import type { FieldConfig } from '@/types'

/** 填报字段配置 → ProForm 字段（必填规则随类型区分提示词） */
export function toFormFields(fields: FieldConfig[]): FormField[] {
  return fields.map((f) => {
    const choose = f.type === 'select' || f.type === 'radio'
    return {
      prop: f.prop,
      label: f.label,
      type: f.type,
      options: f.options,
      placeholder: f.placeholder,
      rules: f.required
        ? [{ required: true, message: `${choose ? '请选择' : '请输入'}${f.label}`, trigger: 'blur' }]
        : [],
    }
  })
}
