import type { FormItemRule } from 'element-plus'

/** 表单字段声明：type 决定渲染的控件类型，prop 对应 form 数据的 key */
export interface FormField {
  prop: string
  label: string
  type?: 'input' | 'textarea' | 'number' | 'select' | 'date' | 'radio'
  options?: { label: string; value: string | number }[]
  placeholder?: string
  rules?: FormItemRule[]
  /** 多选（select 时生效） */
  multiple?: boolean
}
