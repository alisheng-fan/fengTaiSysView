/**
 * 系统管理相关接口：部门 / 角色 / 用户 / 填报节点 / 完整权限树
 * 通用约定：列表类除用户走分页（getUserPage）外均一次返回全部；删除类以 params.id 传参，其余以 body(data) 传参
 */
import { request } from './request'
import type { DeptItem, PageParams, PageResult, RoleItem, UserItem } from '../types'

// ---------- 部门 ----------
/** 部门列表（树形结构，含 children） */
export function getDeptList(): Promise<DeptItem[]> {
  return request<DeptItem[]>({ url: '/system/dept/list', method: 'get' })
}
/** 新增部门 */
export function createDept(data: Partial<DeptItem>): Promise<null> {
  return request<null>({ url: '/system/dept', method: 'post', data })
}
/** 更新部门 */
export function updateDept(data: Partial<DeptItem>): Promise<null> {
  return request<null>({ url: '/system/dept', method: 'put', data })
}
/** 删除部门 */
export function deleteDept(id: string): Promise<null> {
  return request<null>({ url: '/system/dept', method: 'delete', params: { id } })
}

// ---------- 角色 ----------
/** 角色列表 */
export function getRoleList(): Promise<RoleItem[]> {
  return request<RoleItem[]>({ url: '/system/role/list', method: 'get' })
}
/** 新增角色 */
export function createRole(data: Partial<RoleItem>): Promise<null> {
  return request<null>({ url: '/system/role', method: 'post', data })
}
/** 更新角色 */
export function updateRole(data: Partial<RoleItem>): Promise<null> {
  return request<null>({ url: '/system/role', method: 'put', data })
}
/** 删除角色 */
export function deleteRole(id: string): Promise<null> {
  return request<null>({ url: '/system/role', method: 'delete', params: { id } })
}

// ---------- 用户 ----------
/** 用户分页列表 */
export function getUserPage(params: PageParams): Promise<PageResult<UserItem>> {
  return request<PageResult<UserItem>>({ url: '/system/user/list', method: 'get', params })
}
/** 新增用户 */
export function createUser(data: Partial<UserItem>): Promise<null> {
  return request<null>({ url: '/system/user', method: 'post', data })
}
/** 更新用户 */
export function updateUser(data: Partial<UserItem>): Promise<null> {
  return request<null>({ url: '/system/user', method: 'put', data })
}
/** 删除用户 */
export function deleteUser(id: string): Promise<null> {
  return request<null>({ url: '/system/user', method: 'delete', params: { id } })
}

import type { MenuNode, NodeItem } from '../types'

// ---------- 节点 ----------
/** 填报节点列表 */
export function getNodeList(): Promise<NodeItem[]> {
  return request<NodeItem[]>({ url: '/system/node/list', method: 'get' })
}
/** 新增填报节点 */
export function createNode(data: Partial<NodeItem>): Promise<null> {
  return request<null>({ url: '/system/node', method: 'post', data })
}
/** 更新填报节点（含字段配置 fields） */
export function updateNode(data: Partial<NodeItem>): Promise<null> {
  return request<null>({ url: '/system/node', method: 'put', data })
}
/** 删除填报节点 */
export function deleteNode(id: string): Promise<null> {
  return request<null>({ url: '/system/node', method: 'delete', params: { id } })
}
/** 提交某节点的填报数据（业务填报页用） */
export function submitNodeData(id: string, data: Record<string, unknown>): Promise<null> {
  return request<null>({ url: `/node/${id}/submit`, method: 'post', data })
}

// ---------- 完整可分配树（角色分配权限用） ----------
/** 完整菜单树（含系统管理/仪表盘/全部填报节点），供角色分配权限时勾选 */
export function getAllMenuTree(): Promise<MenuNode[]> {
  return request<MenuNode[]>({ url: '/system/menu/all', method: 'get' })
}
