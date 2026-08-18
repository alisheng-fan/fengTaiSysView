import { describe, expect, it, vi, beforeEach } from 'vitest'
import { injectToken, normalizeResponse, handleHttpError } from './request'

vi.mock('element-plus', () => ({
  ElMessage: { error: vi.fn(), success: vi.fn() },
}))

function makeConfig(overrides: Record<string, unknown> = {}) {
  return { headers: {}, ...overrides } as any
}

function makeError(status: number, message = '') {
  return { response: { status, data: { message } }, message: 'Network Error' } as any
}

describe('api/request 拦截器纯函数', () => {
  beforeEach(() => vi.clearAllMocks())

  it('injectToken 在有 token 时注入 Authorization', () => {
    localStorage.setItem('fengtai_token', 't-123')
    const config = injectToken(makeConfig())
    expect(config.headers.Authorization).toBe('Bearer t-123')
  })

  it('injectToken 无 token 时不注入', () => {
    localStorage.removeItem('fengtai_token')
    const config = injectToken(makeConfig())
    expect(config.headers.Authorization).toBeUndefined()
  })

  it('normalizeResponse code===0 原样返回', () => {
    const res = { data: { code: 0, message: 'ok', data: 1 } } as any
    expect(normalizeResponse(res)).toBe(res)
  })

  it('normalizeResponse code!==0 抛错', () => {
    const res = { data: { code: 500, message: '业务失败', data: null } } as any
    expect(() => normalizeResponse(res)).toThrow('业务失败')
  })

  it('handleHttpError 对 401 清除 token', () => {
    localStorage.setItem('fengtai_token', 't-123')
    handleHttpError(makeError(401)).catch(() => {})
    expect(localStorage.getItem('fengtai_token')).toBeNull()
  })

  it('handleHttpError 返回 rejected Promise', async () => {
    await expect(handleHttpError(makeError(500, '服务器错误'))).rejects.toThrow()
  })
})
