import type { PageParams } from '@/types'

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

export interface SearchField {
  prop: string
  label: string
  type?: 'input' | 'select'
  options?: { label: string; value: string | number }[]
  placeholder?: string
}

export type FetchApi = (params: PageParams) => Promise<{ list: unknown[]; total: number }>
