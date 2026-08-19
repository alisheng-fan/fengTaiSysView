import type { MockMethod } from 'vite-plugin-mock'
import type { DeptItem, RoleItem, UserItem } from '@/types'
import { allMenusForTree } from './menus'
import { buildNodeMenuChildren, nodes } from './nodes'

const depts: DeptItem[] = [
  {
    id: '1',
    parentId: null,
    name: '丰台区',
    sort: 1,
    leader: '张主任',
    phone: '010-1234',
    status: 1,
  },
  { id: '11', parentId: '1', name: '政务科', sort: 1, leader: '李科长', status: 1 },
  { id: '12', parentId: '1', name: '数据科', sort: 2, leader: '王科长', status: 1 },
  { id: '121', parentId: '12', name: '平台组', sort: 1, status: 1 },
]

/**
 * 共享可变状态：vite-plugin-mock 用 bundleRequire 独立打包每个 mock 文件，
 * 直接 import 会把数据副本内联进各自的包、互不相通。用 globalThis 挂一份权威 roles，
 * 使 /system/role 的保存与 /auth/me 的解析（auth.ts 经 './system' 读到同一引用）实时打通。
 */
const g = globalThis as unknown as { __fengtaiMockRoles?: RoleItem[] }

export const roles: RoleItem[] = (g.__fengtaiMockRoles ??= [
  { id: '1', name: '系统管理员', code: 'admin', sort: 1, status: 1, menuIds: ['1', '2', '21', '22', '23', '24', '25', '3', 'n1', 'n2'], remark: '全部权限' },
  { id: '2', name: '普通用户', code: 'user', sort: 2, status: 1, menuIds: ['1', '2', '25', '3', 'n1'], remark: '仅仪表盘+修改密码+台账' },
])

const users: UserItem[] = [
  {
    id: '1',
    username: 'admin',
    nickname: '系统管理员',
    deptId: '1',
    roleIds: ['1'],
    phone: '13800000001',
    status: 1,
    createTime: '2026-01-01 10:00:00',
  },
  {
    id: '2',
    username: 'user',
    nickname: '普通用户',
    deptId: '11',
    roleIds: ['2'],
    phone: '13800000002',
    status: 1,
    createTime: '2026-02-01 10:00:00',
  },
]

const ok = (data: unknown) => ({ code: 0, message: 'ok', data })

/** 扁平 depts → 树形（按 parentId 嵌套） */
export function buildDeptTree(depts: DeptItem[]): DeptItem[] {
  const map = new Map<string, DeptItem>()
  depts.forEach((d) => map.set(d.id, { ...d, children: [] }))
  const roots: DeptItem[] = []
  map.forEach((d) => {
    if (d.parentId && map.has(d.parentId)) {
      map.get(d.parentId)!.children!.push(d)
    } else {
      roots.push(d)
    }
  })
  return roots
}

export default [
  // ---------- 部门 ----------
  { url: '/api/system/dept/list', method: 'get', response: () => ok(buildDeptTree(depts)) },
  {
    url: '/api/system/dept',
    method: 'post',
    response: ({ body }: { body: Partial<DeptItem> }) => {
      const item: DeptItem = {
        id: String(Date.now()),
        parentId: body.parentId ?? null,
        name: body.name ?? '',
        sort: body.sort ?? 1,
        status: body.status ?? 1,
        leader: body.leader,
        phone: body.phone,
      }
      depts.push(item)
      return ok(null)
    },
  },
  {
    url: '/api/system/dept',
    method: 'put',
    response: ({ body }: { body: DeptItem }) => {
      const i = depts.findIndex((d) => d.id === body.id)
      if (i > -1) depts[i] = { ...depts[i], ...body }
      return ok(null)
    },
  },
  {
    url: '/api/system/dept',
    method: 'delete',
    response: ({ query }: { query: { id: string } }) => {
      const i = depts.findIndex((d) => d.id === query.id)
      if (i > -1) depts.splice(i, 1)
      return ok(null)
    },
  },
  // ---------- 角色 ----------
  { url: '/api/system/role/list', method: 'get', response: () => ok(roles) },
  {
    url: '/api/system/role',
    method: 'post',
    response: ({ body }: { body: Partial<RoleItem> }) => {
      const item: RoleItem = {
        id: String(Date.now()),
        name: body.name ?? '',
        code: body.code ?? '',
        sort: body.sort ?? 1,
        status: body.status ?? 1,
        menuIds: body.menuIds ?? [],
        remark: body.remark,
      }
      roles.push(item)
      return ok(null)
    },
  },
  {
    url: '/api/system/role',
    method: 'put',
    response: ({ body }: { body: RoleItem }) => {
      const i = roles.findIndex((r) => r.id === body.id)
      if (i > -1) roles[i] = { ...roles[i], ...body }
      return ok(null)
    },
  },
  {
    url: '/api/system/role',
    method: 'delete',
    response: ({ query }: { query: { id: string } }) => {
      const i = roles.findIndex((r) => r.id === query.id)
      if (i > -1) roles.splice(i, 1)
      return ok(null)
    },
  },
  // ---------- 用户 ----------
  {
    url: '/api/system/user/list',
    method: 'get',
    response: ({ query }: { query: Record<string, string> }) => {
      const page = Number(query.page ?? 1)
      const pageSize = Number(query.pageSize ?? 10)
      const username = query.username ?? ''
      const nickname = query.nickname ?? ''
      const status = query.status === '' || query.status === undefined ? '' : query.status
      let list = users.filter(
        (u) =>
          u.username.includes(username) &&
          u.nickname.includes(nickname) &&
          (status === '' || String(u.status) === status),
      )
      const total = list.length
      list = list.slice((page - 1) * pageSize, page * pageSize)
      return ok({ list, total, page, pageSize })
    },
  },
  {
    url: '/api/system/user',
    method: 'post',
    response: ({ body }: { body: Partial<UserItem> }) => {
      const item: UserItem = {
        id: String(Date.now()),
        username: body.username ?? '',
        nickname: body.nickname ?? '',
        deptId: body.deptId ?? null,
        roleIds: body.roleIds ?? [],
        phone: body.phone,
        email: body.email,
        status: body.status ?? 1,
        createTime: new Date().toLocaleString(),
      }
      users.push(item)
      return ok(null)
    },
  },
  {
    url: '/api/system/user',
    method: 'put',
    response: ({ body }: { body: UserItem }) => {
      const i = users.findIndex((u) => u.id === body.id)
      if (i > -1) users[i] = { ...users[i], ...body }
      return ok(null)
    },
  },
  {
    url: '/api/system/user',
    method: 'delete',
    response: ({ query }: { query: { id: string } }) => {
      const i = users.findIndex((u) => u.id === query.id)
      if (i > -1) users.splice(i, 1)
      return ok(null)
    },
  },
  // ---------- 菜单 ----------
  {
    url: '/api/system/menu/all',
    method: 'get',
    response: () => ok(allMenusForTree(buildNodeMenuChildren(nodes.map((n) => n.id)))),
  },
] as MockMethod[]
