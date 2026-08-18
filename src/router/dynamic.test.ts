import { describe, expect, it } from 'vitest'
import { buildRoutes } from './dynamic'
import type { MenuNode } from '@/types'

const menus: MenuNode[] = [
  {
    id: '1',
    parentId: null,
    name: 'Dashboard',
    title: '仪表盘',
    path: '/dashboard',
    component: 'dashboard/index',
    icon: '',
    sort: 1,
    perms: [],
  },
  {
    id: '2',
    parentId: null,
    name: 'System',
    title: '系统管理',
    path: '/system',
    component: '',
    icon: '',
    sort: 2,
    perms: [],
    children: [
      {
        id: '21',
        parentId: '2',
        name: 'Dept',
        title: '部门管理',
        path: '/system/dept',
        component: 'system/dept/index',
        icon: '',
        sort: 1,
        perms: ['system:dept:add'],
      },
      {
        id: '22',
        parentId: '2',
        name: 'Role',
        title: '角色管理',
        path: '/system/role',
        component: 'system/role/index',
        icon: '',
        sort: 2,
        perms: [],
      },
    ],
  },
]

describe('router/dynamic buildRoutes', () => {
  it('为每个有 component 的节点生成一条路由，组节点被拍平', () => {
    const routes = buildRoutes(menus)
    expect(routes.map((r) => r.path)).toEqual(['/dashboard', '/system/dept', '/system/role'])
    expect(routes.map((r) => r.name)).toEqual(['Dashboard', 'Dept', 'Role'])
  })

  it('路由 meta 携带 title 与 perms', () => {
    const routes = buildRoutes(menus)
    expect(routes[1].meta?.title).toBe('部门管理')
    expect(routes[1].meta?.perms).toEqual(['system:dept:add'])
  })
})
