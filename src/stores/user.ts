import { defineStore } from 'pinia'
import { login as apiLogin, logout as apiLogout, getMe } from '@/api/auth'
import type { UserInfo } from '@/types'
import { getToken, removeToken, setToken } from '@/utils/auth'
import { usePermissionStore } from './permission'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: getToken(),
    userInfo: null as UserInfo | null,
  }),
  actions: {
    async login(username: string, password: string) {
      const { token } = await apiLogin({ username, password })
      this.token = token
      setToken(token)
    },
    async fetchMe() {
      const { userInfo } = await getMe()
      this.userInfo = userInfo
      return userInfo
    },
    async logout() {
      try {
        await apiLogout()
      } catch {
        // 忽略登出接口异常，本地凭证必须清
      }
      this.reset()
    },
    reset() {
      this.token = ''
      this.userInfo = null
      removeToken()
      usePermissionStore().reset()
    },
  },
})
