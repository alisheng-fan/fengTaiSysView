export interface ApiResult<T = unknown> {
  code: number
  message: string
  data: T
}

export interface LoginParams {
  username: string
  password: string
}

export interface LoginResult {
  token: string
}

export interface UserInfo {
  id: string
  username: string
  nickname: string
  avatar?: string
  roles: string[]
  deptId: string | null
}

/** 菜单节点：name 作路由名，title 作菜单显示，component 为相对 src/views 的路径 */
export interface MenuNode {
  id: string
  parentId: string | null
  name: string
  title: string
  path: string
  component: string
  icon: string
  sort: number
  perms: string[]
  children?: MenuNode[]
  /** 填报节点时携带字段配置（方案 A：随菜单下发） */
  fields?: FieldConfig[]
}

export interface GetMeResult {
  userInfo: UserInfo
  menus: MenuNode[]
}

export interface DeptItem {
  id: string
  parentId: string | null
  name: string
  sort: number
  leader?: string
  phone?: string
  status: number
  children?: DeptItem[]
}

export interface RoleItem {
  id: string
  name: string
  code: string
  sort: number
  status: number
  menuIds: string[]
  remark?: string
}

export interface UserItem {
  id: string
  username: string
  nickname: string
  deptId: string | null
  roleIds: string[]
  phone?: string
  email?: string
  status: number
  createTime: string
}

export interface PageParams {
  page: number
  pageSize: number
  [key: string]: unknown
}

export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

/** 节点字段类型（填报表单控件） */
export type FieldType = 'input' | 'textarea' | 'number' | 'select' | 'date' | 'radio'

/** 一个字段的配置 */
export interface FieldConfig {
  prop: string
  label: string
  type: FieldType
  required?: boolean
  options?: { label: string; value: string }[]
  placeholder?: string
}

/** 流程节点（挂项目、带流程顺序与状态） */
export interface NodeItem {
  id: string
  projectId: string
  name: string
  step: number
  sort: number
  status: number        // 1 进行中 / 2 已完成
  date?: string
  fields: FieldConfig[]
}

/** 修改密码请求 */
export interface ChangePasswordParams {
  oldPassword: string
  newPassword: string
}

/** 项目主数据 */
export interface ProjectItem {
  id: string
  name: string
  type: 'first' | 'second'
  builder?: string
  location?: string
  landSize?: number
  buildingSize?: number
  status: number
  createTime: string
}

/** 填报记录（进展录入） */
export interface FillRecordItem {
  id: string
  nodeId: string
  projectId: string
  values: Record<string, unknown>
  createBy: string
  createTime: string
}

/** 问题状态：已解决/部分解决/再商议/搁置 */
export type IssueStatus = 'solved' | 'partial' | 'discuss' | 'shelved'

/** 问题上报 */
export interface IssueItem {
  id: string
  nodeId: string
  projectId: string
  nodeName: string
  dept: string
  description: string
  status: IssueStatus
  createTime: string
}

/** 监测统计 */
export interface StatisticsOverview {
  totalProjects: number
  firstCount: number
  secondCount: number
  issueTotal: number
  issueSolved: number
  bizTotal: number
}
