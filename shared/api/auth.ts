/**
 * 认证相关接口：登录 / 登出 / 获取当前用户信息 / 修改密码
 * 返回值均已被 request<T> 收窄为后端 data 字段
 */
import { request } from './request'
import type { GetMeResult, LoginParams, LoginResult } from '../types'

/** 登录：校验账号密码，返回登录 token */
export function login(data: LoginParams): Promise<LoginResult> {
  return request<LoginResult>({ url: '/auth/login', method: 'post', data })
}

/** 登出：结束服务端会话（本地凭证清理由 user store 负责） */
export function logout(): Promise<null> {
  return request<null>({ url: '/auth/logout', method: 'post' })
}

/** 获取当前登录用户信息与可访问菜单树（权限初始化用） */
export function getMe(): Promise<GetMeResult> {
  return request<GetMeResult>({ url: '/auth/me', method: 'get' })
}

import type { ChangePasswordParams } from '../types'

/** 修改当前用户密码 */
export function changePassword(data: ChangePasswordParams): Promise<null> {
  return request<null>({ url: '/auth/password', method: 'put', data })
}
