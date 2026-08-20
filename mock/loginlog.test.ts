import { describe, expect, it } from 'vitest'
import { loginlogs } from './loginlog'

describe('mock/loginlog 种子', () => {
  it('种子 2 条成功记录：admin / user，ip/时间/msg 齐全', () => {
    expect(loginlogs).toHaveLength(2)
    expect(loginlogs[0]).toMatchObject({ username: 'admin', status: 1, msg: '登录成功' })
    expect(loginlogs[1]).toMatchObject({ username: 'user', status: 1, msg: '登录成功' })
    for (const l of loginlogs) {
      expect(l.ip).toBeTruthy()
      expect(l.loginTime).toBeTruthy()
    }
  })

  it('失败登录写入 status 0 记录（对应 /auth/login 失败分支行为）', () => {
    const len = loginlogs.length
    loginlogs.push({
      id: 'log-t',
      username: 'ghost',
      ip: '127.0.0.1',
      loginTime: '2026-08-03 09:00:00',
      status: 0,
      msg: '用户名或密码错误',
    })
    expect(loginlogs).toHaveLength(len + 1)
    expect(loginlogs[loginlogs.length - 1]).toMatchObject({ username: 'ghost', status: 0 })
    loginlogs.pop()
    expect(loginlogs).toHaveLength(len)
  })
})
