import { request } from './request'
import type { GetMeResult, LoginParams, LoginResult } from '@/types'

export function login(data: LoginParams): Promise<LoginResult> {
  return request<LoginResult>({ url: '/auth/login', method: 'post', data })
}

export function logout(): Promise<null> {
  return request<null>({ url: '/auth/logout', method: 'post' })
}

export function getMe(): Promise<GetMeResult> {
  return request<GetMeResult>({ url: '/auth/me', method: 'get' })
}

import type { ChangePasswordParams } from '@/types'

export function changePassword(data: ChangePasswordParams): Promise<null> {
  return request<null>({ url: '/auth/password', method: 'put', data })
}
