import { request } from './request'
import type { DeptItem, PageParams, PageResult, RoleItem, UserItem } from '@/types'

// ---------- 部门 ----------
export function getDeptList(): Promise<DeptItem[]> {
  return request<DeptItem[]>({ url: '/system/dept/list', method: 'get' })
}
export function createDept(data: Partial<DeptItem>): Promise<null> {
  return request<null>({ url: '/system/dept', method: 'post', data })
}
export function updateDept(data: Partial<DeptItem>): Promise<null> {
  return request<null>({ url: '/system/dept', method: 'put', data })
}
export function deleteDept(id: string): Promise<null> {
  return request<null>({ url: '/system/dept', method: 'delete', params: { id } })
}

// ---------- 角色 ----------
export function getRoleList(): Promise<RoleItem[]> {
  return request<RoleItem[]>({ url: '/system/role/list', method: 'get' })
}
export function createRole(data: Partial<RoleItem>): Promise<null> {
  return request<null>({ url: '/system/role', method: 'post', data })
}
export function updateRole(data: Partial<RoleItem>): Promise<null> {
  return request<null>({ url: '/system/role', method: 'put', data })
}
export function deleteRole(id: string): Promise<null> {
  return request<null>({ url: '/system/role', method: 'delete', params: { id } })
}

// ---------- 用户 ----------
export function getUserPage(params: PageParams): Promise<PageResult<UserItem>> {
  return request<PageResult<UserItem>>({ url: '/system/user/list', method: 'get', params })
}
export function createUser(data: Partial<UserItem>): Promise<null> {
  return request<null>({ url: '/system/user', method: 'post', data })
}
export function updateUser(data: Partial<UserItem>): Promise<null> {
  return request<null>({ url: '/system/user', method: 'put', data })
}
export function deleteUser(id: string): Promise<null> {
  return request<null>({ url: '/system/user', method: 'delete', params: { id } })
}

import type { MenuNode, NodeItem } from '@/types'

// ---------- 节点 ----------
export function getNodeList(): Promise<NodeItem[]> {
  return request<NodeItem[]>({ url: '/system/node/list', method: 'get' })
}
export function createNode(data: Partial<NodeItem>): Promise<null> {
  return request<null>({ url: '/system/node', method: 'post', data })
}
export function updateNode(data: Partial<NodeItem>): Promise<null> {
  return request<null>({ url: '/system/node', method: 'put', data })
}
export function deleteNode(id: string): Promise<null> {
  return request<null>({ url: '/system/node', method: 'delete', params: { id } })
}
export function submitNodeData(id: string, data: Record<string, unknown>): Promise<null> {
  return request<null>({ url: `/node/${id}/submit`, method: 'post', data })
}

// ---------- 完整可分配树（角色分配权限用） ----------
export function getAllMenuTree(): Promise<MenuNode[]> {
  return request<MenuNode[]>({ url: '/system/menu/all', method: 'get' })
}
