import { describe, expect, it } from 'vitest'
import { notices } from './notice'

describe('mock/notice 种子', () => {
  it('种子 1 条未读提醒：nt1 REMIND(p2/n2)，read 为 false', () => {
    expect(notices).toHaveLength(1)
    expect(notices[0]).toMatchObject({
      id: 'nt1',
      projectId: 'p2',
      nodeId: 'n2',
      noticeType: 'REMIND',
      read: false,
    })
    expect(notices[0].title).toBeTruthy()
    expect(notices[0].content).toContain('报表填报')
  })

  it('标记已读：read 置为 true（对应 /notice/read 端点行为）后不再是未读', () => {
    const n = notices.find((x) => x.id === 'nt1')!
    const backup = n.read
    try {
      n.read = true
      expect(notices.find((x) => x.id === 'nt1')!.read).toBe(true)
    } finally {
      n.read = backup
    }
  })
})
