/**
 * 用户状态：登录 token 与当前用户信息
 * - token 持久化到 localStorage（刷新后保持登录态），与 utils/auth 同步读写
 * - 登出时清空本地凭证并联动重置 permission store（防止跨账号残留权限）
 */
import { defineStore } from 'pinia'
import { login as apiLogin, logout as apiLogout, getMe } from '@/api/auth'
import type { UserInfo } from '@/types'
import { getToken, removeToken, setToken } from '@/utils/auth'
import { usePermissionStore } from './permission'

export const useUserStore = defineStore('user', {
  state: () => ({
    /** 登录 token（初始化时从 localStorage 读取） */
    token: getToken(),
    /** 当前登录用户信息（登录成功后由 fetchMe 拉取） */
    userInfo: null as UserInfo | null,
  }),
  actions: {
    /** 登录：调用接口换取 token，写入 state 并持久化到 localStorage */
    async login(username: string, password: string) {
      const { token } = await apiLogin({ username, password })
      this.token = token
      setToken(token)
    },
    /** 拉取当前用户信息，写入 state 并返回（路由守卫初始化用户态用） */
    async fetchMe() {
      const { userInfo } = await getMe()
      this.userInfo = userInfo
      return userInfo
    },
    /** 登出：先调登出接口（异常忽略，本地凭证必须清），再重置本地状态 */
    async logout() {
      try {
        await apiLogout()
      } catch {
        // 忽略登出接口异常，本地凭证必须清
      }
      this.reset()
    },
    /** 重置用户态：清空 token/userInfo，移除本地 token，并重置 permission store */
    reset() {
      this.token = ''
      this.userInfo = null
      removeToken()
      usePermissionStore().reset()
    },
  },
})
