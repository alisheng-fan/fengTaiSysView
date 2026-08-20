import { describe, expect, it } from 'vitest'
import { announcements } from './announcement'

describe('mock/announcement 种子', () => {
  it('种子 2 条公示公告：a1 公示(p2) / a2 公告(p1)，字段齐全', () => {
    expect(announcements).toHaveLength(2)
    expect(announcements.find((a) => a.id === 'a1')).toMatchObject({
      projectId: 'p2',
      annType: '公示',
      title: '征地公告公示',
      source: '规划实施科',
    })
    expect(announcements.find((a) => a.id === 'a2')).toMatchObject({
      projectId: 'p1',
      annType: '公告',
      title: '土地供应公告',
    })
  })

  it('annType 取值均在合法集合内，标题/内容/发布时间齐全', () => {
    const valid = ['公示', '公告', '发布信息']
    for (const a of announcements) {
      expect(valid).toContain(a.annType)
      expect(a.title).toBeTruthy()
      expect(a.content).toBeTruthy()
      expect(a.publishDate).toBeTruthy()
    }
  })
})
