import type { MenuNode } from '@/types'

// ---- 结构化导出：仪表盘 + 系统管理(全子节点) + 业务填报，供 /auth/me 与 /system/menu/all 使用 ----

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
  {
    id: '26', parentId: '2', name: 'Project', title: '项目管理', path: '/system/project',
    component: 'system/project/index', icon: '', sort: 6,
    perms: ['system:project:add', 'system:project:edit', 'system:project:delete'],
  },
  {
    id: '27', parentId: '2', name: 'Phase', title: '阶段管理', path: '/system/phase',
    component: 'system/phase/index', icon: '', sort: 7,
    perms: ['system:phase:add', 'system:phase:edit', 'system:phase:delete'],
  },
  {
    id: '28', parentId: '2', name: 'Cond', title: '触发条件', path: '/system/cond',
    component: 'system/cond/index', icon: '', sort: 8,
    perms: ['system:condition:add', 'system:condition:edit', 'system:condition:delete'],
  },
  {
    id: '29', parentId: '2', name: 'Announcement', title: '公示公告', path: '/system/announcement',
    component: 'system/announcement/index', icon: '', sort: 9,
    perms: ['system:announcement:add', 'system:announcement:edit', 'system:announcement:delete'],
  },
  {
    id: '30', parentId: '2', name: 'Notice', title: '通知提醒', path: '/system/notice',
    component: 'system/notice/index', icon: '', sort: 10, perms: [],
  },
  {
    id: '31', parentId: '2', name: 'Per', title: '人员管理', path: '/system/per',
    component: 'system/per/index', icon: '', sort: 11,
    perms: ['system:per:add', 'system:per:edit', 'system:per:delete'],
  },
  {
    id: '32', parentId: '2', name: 'LoginLog', title: '登录日志', path: '/system/loginlog',
    component: 'system/loginlog/index', icon: '', sort: 12, perms: [],
  },
  {
    id: '33', parentId: '2', name: 'Stats', title: '统计增强', path: '/system/stats',
    component: 'system/stats/index', icon: '', sort: 13, perms: [],
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
  sort: 3,
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
  sort: 2,
  perms: [],
  children: [],
}

/** 完整可分配树：仪表盘 + 业务填报（全部节点）+ 系统管理（置于底部，全子节点），供角色分配权限与 admin 使用 */
export function allMenusForTree(allNodes: MenuNode[]): MenuNode[] {
  return [
    dashboardMenu,
    { ...businessGroup, children: [...allNodes] },
    { ...systemGroup, children: [...systemChildren] },
  ]
}
