import { defineStore } from 'pinia'
import { login as apiLogin } from '@shared/api/auth'
import { getToken, removeToken, setToken } from '@shared/utils/auth'

/** 移动端用户 store：token 复用 shared，刷新不丢 */
export const useUserStore = defineStore('user', {
  state: () => ({ token: getToken() }),
  actions: {
    async login(username: string, password: string) {
      const { token } = await apiLogin({ username, password })
      this.token = token
      setToken(token)
    },
    logout() {
      this.token = ''
      removeToken()
    },
  },
})
