import type { MenuNode } from '@/types'

export const adminMenus: MenuNode[] = [
  {
    id: '1',
    parentId: null,
    name: 'Dashboard',
    title: '仪表盘',
    path: '/dashboard',
    component: 'dashboard/index',
    icon: 'Odometer',
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
    icon: 'Setting',
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
        perms: ['system:dept:add', 'system:dept:edit', 'system:dept:delete'],
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
        perms: ['system:role:add', 'system:role:edit', 'system:role:delete'],
      },
      {
        id: '23',
        parentId: '2',
        name: 'User',
        title: '用户管理',
        path: '/system/user',
        component: 'system/user/index',
        icon: '',
        sort: 3,
        perms: ['system:user:add', 'system:user:edit', 'system:user:delete'],
      },
    ],
  },
]

/** 普通用户：无系统管理菜单，仅有仪表盘（演示菜单差异） */
export const userMenus: MenuNode[] = [
  {
    id: '1',
    parentId: null,
    name: 'Dashboard',
    title: '仪表盘',
    path: '/dashboard',
    component: 'dashboard/index',
    icon: 'Odometer',
    sort: 1,
    perms: [],
  },
]
