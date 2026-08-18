import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { usePermissionStore } from './permission'
import type { MenuNode } from '@/types'

vi.mock('@/api/auth', () => ({
  getMe: vi.fn(),
}))

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
    ],
  },
]

describe('stores/permission', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('loadPermission 填充菜单、权限码与动态路由', async () => {
    const { getMe } = await import('@/api/auth')
    vi.mocked(getMe).mockResolvedValue({
      userInfo: { id: 'a', username: 'admin', nickname: '管理员', roles: ['admin'], deptId: null },
      menus,
    })

    const store = usePermissionStore()
    await store.loadPermission()

    expect(store.loaded).toBe(true)
    expect(store.menus).toEqual(menus)
    expect(store.perms).toContain('system:dept:add')
    expect(store.dynamicRoutes.map((r) => r.path)).toEqual(['/dashboard', '/system/dept'])
    expect(store.hasPerm('system:dept:add')).toBe(true)
    expect(store.hasPerm('system:user:add')).toBe(false)
  })

  it('reset 清空全部状态', async () => {
    const { getMe } = await import('@/api/auth')
    vi.mocked(getMe).mockResolvedValue({
      userInfo: { id: 'a', username: 'admin', nickname: '管理员', roles: ['admin'], deptId: null },
      menus,
    })

    const store = usePermissionStore()
    await store.loadPermission()
    store.reset()

    expect(store.loaded).toBe(false)
    expect(store.menus).toHaveLength(0)
    expect(store.perms).toHaveLength(0)
    expect(store.dynamicRoutes).toHaveLength(0)
  })
})
