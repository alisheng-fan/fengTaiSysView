import type { FormItemRule } from 'element-plus'

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
