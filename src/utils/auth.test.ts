import { describe, expect, it, beforeEach } from 'vitest'
import { getToken, setToken, removeToken } from './auth'

describe('utils/auth', () => {
  beforeEach(() => localStorage.clear())

  it('setToken 写入，getToken 读取', () => {
    setToken('abc')
    expect(getToken()).toBe('abc')
  })

  it('未设置时返回空串', () => {
    expect(getToken()).toBe('')
  })

  it('removeToken 清除', () => {
    setToken('abc')
    removeToken()
    expect(getToken()).toBe('')
  })
})
