import type { PageParams } from '@/types'

/** 表格列配置：prop 对应数据字段，其余属性透传给 el-table-column */
export interface Column {
  prop: string
  label: string
  width?: number
  minWidth?: number
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  showOverflowTooltip?: boolean
  /** 指定自定义渲染插槽名（插槽参数 { row }） */
  slot?: string
}

/** 搜索区字段配置：按 type 渲染输入框或下拉，值写入查询条件 query[prop] */
export interface SearchField {
  prop: string
  label: string
  type?: 'input' | 'select'
  options?: { label: string; value: string | number }[]
  placeholder?: string
}

/** 列表请求方法：入参为查询条件 + 分页参数，返回 list 与 total */
export type FetchApi = (params: PageParams) => Promise<{ list: unknown[]; total: number }>
