/** 登录 token 在 localStorage 中使用的 key */
const TOKEN_KEY = 'fengtai_token'

/** 读取登录 token，不存在时返回空字符串 */
export function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) ?? ''
}

/** 写入登录 token */
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

/** 清除登录 token */
export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}
