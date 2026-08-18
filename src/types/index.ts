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
