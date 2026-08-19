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

// ---- T3 追加：节点/动态表单的结构化导出（adminMenus/userMenus 保留至 T4/T8 移除） ----

export const dashboardMenu: MenuNode = {
  id: '1',
  parentId: null,
  name: 'Dashboard',
  title: '仪表盘',
  path: '/dashboard',
  component: 'dashboard/index',
  icon: 'Odometer',
  sort: 1,
  perms: [],
}

export const systemChildren: MenuNode[] = [
  {
    id: '21', parentId: '2', name: 'Dept', title: '部门管理', path: '/system/dept',
    component: 'system/dept/index', icon: '', sort: 1,
    perms: ['system:dept:add', 'system:dept:edit', 'system:dept:delete'],
  },
  {
    id: '22', parentId: '2', name: 'Role', title: '角色管理', path: '/system/role',
    component: 'system/role/index', icon: '', sort: 2,
    perms: ['system:role:add', 'system:role:edit', 'system:role:delete'],
  },
  {
    id: '23', parentId: '2', name: 'User', title: '用户管理', path: '/system/user',
    component: 'system/user/index', icon: '', sort: 3,
    perms: ['system:user:add', 'system:user:edit', 'system:user:delete'],
  },
  {
    id: '24', parentId: '2', name: 'Node', title: '节点管理', path: '/system/node',
    component: 'system/node/index', icon: '', sort: 4,
    perms: ['system:node:add', 'system:node:edit', 'system:node:delete', 'system:node:config'],
  },
  {
    id: '25', parentId: '2', name: 'Password', title: '修改密码', path: '/system/password',
    component: 'system/password/index', icon: '', sort: 5, perms: [],
  },
]

export const systemGroup: MenuNode = {
  id: '2',
  parentId: null,
  name: 'System',
  title: '系统管理',
  path: '/system',
  component: '',
  icon: 'Setting',
  sort: 2,
  perms: [],
  children: systemChildren,
}

export const businessGroup: MenuNode = {
  id: '3',
  parentId: null,
  name: 'Fill',
  title: '业务填报',
  path: '/fill',
  component: '',
  icon: 'EditPen',
  sort: 3,
  perms: [],
  children: [],
}

/** 完整可分配树：仪表盘 + 系统管理（全子节点）+ 业务填报（全部节点），供角色分配权限与 admin 使用 */
export function allMenusForTree(allNodes: MenuNode[]): MenuNode[] {
  return [
    dashboardMenu,
    { ...systemGroup, children: [...systemChildren] },
    { ...businessGroup, children: [...allNodes] },
  ]
}
