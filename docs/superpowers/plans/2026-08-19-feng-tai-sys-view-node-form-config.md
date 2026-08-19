# fengTaiSysView 节点管理与动态表单 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在既有 RBAC 基座上新增节点管理（配置填报节点及其表单字段）、动态填报页、修改密码，并收紧非管理员权限（系统管理仅修改密码）。

**Architecture:** 方案 A——节点字段配置随 `/auth/me` 菜单树一并下发（MenuNode 增加 `fields`），所有填报节点复用单个 `fill/node.vue` 组件按路由 meta 渲染。`/auth/me` 由写死的 adminMenus/userMenus 改为按角色 menuIds 动态构建（系统菜单 + 节点合并）。ProForm 扩展 date/radio 控件与 `dialog` 属性以复用校验/提交逻辑。

**Tech Stack:** 沿用既有 Vite 5 + Vue 3 + TS + Pinia + Element Plus + mock（vite-plugin-mock）+ Vitest。

**Spec:** [docs/superpowers/specs/2026-08-19-feng-tai-sys-view-node-form-config-design.md](../specs/2026-08-19-feng-tai-sys-view-node-form-config-design.md)（本计划从 spec 推导，执行者需同时阅读 spec 与本计划）

## Global Constraints

以下约束全局生效，所有任务隐式包含：

- 沿用基座全部约定：`api/` 唯一 axios 层、权限数据驱动、conventional commits、TDD（vitest，jsdom，include 覆盖 `src/**` 与 `mock/**`）、`@/` 别名。
- **节点菜单 id 体系**：系统菜单 `'1'` 仪表盘、`'2'` 系统管理组、`'21'` 部门、`'22'` 角色、`'23'` 用户、`'24'` 节点管理、`'25'` 修改密码、`'3'` 业务填报组、节点 `'n1'`/`'n2'` 由 mock/nodes.ts 定义。
- 节点字段类型 `FieldType = 'input' | 'textarea' | 'number' | 'select' | 'date' | 'radio'`。
- `/auth/me` 返回的菜单树由角色 `menuIds` 动态构建：仪表盘 + 系统管理（只含勾选子节点）+ 业务填报（只含勾选且启用的节点，带 `fields`）。
- 填报仅提交（`POST /api/node/{id}/submit`），无数据列表。
- ProForm 默认 `dialog: true`（弹窗）；`false` 时渲染整页表单（无弹窗外壳），供填报页使用。
- 修改密码：所有角色可用；非管理员在系统管理内仅此一项。
- 演示账号效果：admin 系统管理全 4 项 + 全部节点；user 系统管理仅修改密码 + 业务填报（n1）。

## 文件结构总览

| 文件 | 职责 |
|---|---|
| `src/types/index.ts` | 新增 FieldType/FieldConfig/NodeItem/ChangePasswordParams；MenuNode 加 `fields?` |
| `src/api/system.ts` | 新增节点 CRUD + `getAllMenuTree` + `submitNodeData` |
| `src/api/auth.ts` | 新增 `changePassword` |
| `src/utils/form.ts` | `toFormFields(FieldConfig[] → FormField[])` 纯函数（可单测） |
| `src/components/ProForm/types.ts` | FormField.type 加 'date'/'radio'；加 `dialog?` 相关 |
| `src/components/ProForm/index.vue` | 渲染 date/radio；`dialog` prop（false=整页表单，含提交按钮） |
| `src/router/dynamic.ts` | buildRoutes 把 `nodeId`/`fields` 带入路由 meta |
| `mock/nodes.ts` | 节点内存数组 + CRUD + submit + `buildNodeMenuChildren`（纯函数） |
| `mock/menus.ts` | 重构：导出 dashboardMenu/systemGroup/systemChildren/businessGroup + `allMenusForTree` |
| `mock/auth.ts` | `/auth/me` 动态构建（`buildMenuTree` 纯函数）+ `PUT /api/auth/password` |
| `mock/system.ts` | 角色 seed 的 menuIds 更新 |
| `src/views/system/node/index.vue` | 节点管理页 + 字段配置编辑器 |
| `src/views/fill/node.vue` | 填报页（单组件渲染所有节点） |
| `src/views/system/password/index.vue` | 修改密码页 |

---

### Task 1: 类型 + 接口层 + 字段转换纯函数

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/api/system.ts`
- Modify: `src/api/auth.ts`
- Create: `src/utils/form.ts`
- Test: `src/utils/form.test.ts`

**Interfaces:**
- Consumes: `request<T>`（基座）、`FormField`（ProForm types）
- Produces:
  - 类型：`FieldType`、`FieldConfig`、`NodeItem`、`ChangePasswordParams`；`MenuNode` 增加 `fields?: FieldConfig[]`
  - api：`getNodeList()`、`createNode(data)`、`updateNode(data)`、`deleteNode(id)`、`getAllMenuTree()`、`submitNodeData(id, data)`、`changePassword(data)`
  - `toFormFields(fields: FieldConfig[]): FormField[]`

- [ ] **Step 1: 扩展类型**

`src/types/index.ts` 末尾追加：

```ts
/** 节点字段类型（填报表单控件） */
export type FieldType = 'input' | 'textarea' | 'number' | 'select' | 'date' | 'radio'

/** 一个字段的配置 */
export interface FieldConfig {
  prop: string
  label: string
  type: FieldType
  required?: boolean
  options?: { label: string; value: string }[]
  placeholder?: string
}

/** 填报节点 */
export interface NodeItem {
  id: string
  name: string
  sort: number
  status: number
  fields: FieldConfig[]
}

/** 修改密码请求 */
export interface ChangePasswordParams {
  oldPassword: string
  newPassword: string
}
```

`MenuNode` 增加可选字段：

```ts
export interface MenuNode {
  id: string
  parentId: string | null
  name: string
  title: string
  path: string
  component: string
  icon: string
  sort: number
  perms: string[]
  children?: MenuNode[]
  /** 填报节点时携带字段配置（方案 A：随菜单下发） */
  fields?: FieldConfig[]
}
```

- [ ] **Step 2: 扩展 system 接口层**

`src/api/system.ts` 末尾追加：

```ts
import type { MenuNode, NodeItem } from '@/types'

// ---------- 节点 ----------
export function getNodeList(): Promise<NodeItem[]> {
  return request<NodeItem[]>({ url: '/system/node/list', method: 'get' })
}
export function createNode(data: Partial<NodeItem>): Promise<null> {
  return request<null>({ url: '/system/node', method: 'post', data })
}
export function updateNode(data: Partial<NodeItem>): Promise<null> {
  return request<null>({ url: '/system/node', method: 'put', data })
}
export function deleteNode(id: string): Promise<null> {
  return request<null>({ url: '/system/node', method: 'delete', params: { id } })
}
export function submitNodeData(id: string, data: Record<string, unknown>): Promise<null> {
  return request<null>({ url: `/node/${id}/submit`, method: 'post', data })
}

// ---------- 完整可分配树（角色分配权限用） ----------
export function getAllMenuTree(): Promise<MenuNode[]> {
  return request<MenuNode[]>({ url: '/system/menu/all', method: 'get' })
}
```

（注意：`submitNodeData` 的 url 是 `/node/{id}/submit`，与 mock 路由 `/api/node/:id/submit` 对应。）

- [ ] **Step 3: 扩展 auth 接口层**

`src/api/auth.ts` 追加：

```ts
import type { ChangePasswordParams } from '@/types'

export function changePassword(data: ChangePasswordParams): Promise<null> {
  return request<null>({ url: '/auth/password', method: 'put', data })
}
```

- [ ] **Step 4: 写字段转换纯函数 + 失败测试**

`src/utils/form.test.ts`：

```ts
import { describe, expect, it } from 'vitest'
import { toFormFields } from './form'
import type { FieldConfig } from '@/types'

const fields: FieldConfig[] = [
  { prop: 'street', label: '街道名称', type: 'input', required: true },
  { prop: 'district', label: '所属区', type: 'select', options: [{ label: '东城区', value: '东城区' }] },
  { prop: 'note', label: '备注', type: 'textarea' },
]

describe('utils/form toFormFields', () => {
  it('把 FieldConfig 转成 ProForm FormField，required 生成必填规则', () => {
    const result = toFormFields(fields)
    expect(result).toHaveLength(3)
    expect(result[0]).toMatchObject({ prop: 'street', label: '街道名称', type: 'input' })
    expect(result[0].rules?.[0].required).toBe(true)
    expect(result[1].options).toEqual([{ label: '东城区', value: '东城区' }])
    expect(result[2].rules ?? []).toHaveLength(0)
  })

  it('select/radio 必填时提示"请选择"，其余"请输入"', () => {
    const sel = toFormFields([{ prop: 'x', label: '类型', type: 'radio', required: true }])
    expect(sel[0].rules?.[0].message).toBe('请选择类型')
    const inp = toFormFields([{ prop: 'y', label: '姓名', type: 'input', required: true }])
    expect(inp[0].rules?.[0].message).toBe('请输入姓名')
  })

  it('空数组返回空', () => {
    expect(toFormFields([])).toEqual([])
  })
})
```

- [ ] **Step 5: 运行测试确认失败**

运行：`npm run test -- src/utils/form.test.ts`
预期：FAIL，`./form` 不存在。

- [ ] **Step 6: 实现转换函数**

`src/utils/form.ts`：

```ts
import type { FormField } from '@/components/ProForm/types'
import type { FieldConfig } from '@/types'

/** 填报字段配置 → ProForm 字段（必填规则随类型区分提示词） */
export function toFormFields(fields: FieldConfig[]): FormField[] {
  return fields.map((f) => {
    const choose = f.type === 'select' || f.type === 'radio'
    return {
      prop: f.prop,
      label: f.label,
      type: f.type,
      options: f.options,
      placeholder: f.placeholder,
      rules: f.required
        ? [{ required: true, message: `${choose ? '请选择' : '请输入'}${f.label}`, trigger: 'blur' }]
        : [],
    }
  })
}
```

- [ ] **Step 7: 运行测试确认通过**

运行：`npm run test -- src/utils/form.test.ts`
预期：PASS（3 个用例）。

- [ ] **Step 8: build 验证 + Commit**

运行：`npm run build`
预期：`vue-tsc` + vite 通过。

```bash
git add src/types src/api src/utils/form.ts src/utils/form.test.ts
git commit -m "feat: 节点/字段类型、接口层与字段转换纯函数"
```

---

### Task 2: ProForm 扩展（date/radio 控件 + dialog 整页模式）

**Files:**
- Modify: `src/components/ProForm/types.ts`
- Modify: `src/components/ProForm/index.vue`

**Interfaces:**
- Consumes: 无
- Produces: `FormField.type` 增加 `'date' | 'radio'`；ProForm 增加 props `dialog?: boolean`（默认 true）、`successMessage?: string`（默认 '保存成功'）；`dialog=false` 时渲染整页表单 + 底部提交按钮，提交成功后重置表单并 emit `success`

- [ ] **Step 1: 扩展 FormField 类型**

`src/components/ProForm/types.ts`：

```ts
export interface FormField {
  prop: string
  label: string
  type?: 'input' | 'textarea' | 'number' | 'select' | 'date' | 'radio'
  options?: { label: string; value: string | number }[]
  placeholder?: string
  rules?: FormItemRule[]
  /** 多选（select 时生效） */
  multiple?: boolean
}
```

- [ ] **Step 2: 重写 ProForm 组件**

`src/components/ProForm/index.vue`（完整替换）：

```vue
<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormField } from './types'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title: string
    fields: FormField[]
    submitApi: (values: Record<string, unknown>) => Promise<unknown>
    initialValues?: Record<string, unknown>
    /** true=弹窗表单；false=整页表单（无弹窗外壳，底部自带提交按钮） */
    dialog?: boolean
    successMessage?: string
  }>(),
  { initialValues: () => ({}), dialog: true, successMessage: '保存成功' },
)

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'success'): void
}>()

const formRef = ref()
const submitting = ref(false)
const form = reactive<Record<string, unknown>>({})

function resetForm() {
  Object.keys(form).forEach((k) => delete form[k])
  Object.assign(form, props.initialValues)
  formRef.value?.clearValidate?.()
}

watch(
  () => props.modelValue,
  (visible) => {
    if (visible && props.dialog) resetForm()
  },
)

function rulesOf(field: FormField) {
  return field.rules ?? []
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate()
  submitting.value = true
  try {
    await props.submitApi({ ...form })
    ElMessage.success(props.successMessage)
    emit('success')
    if (props.dialog) {
      emit('update:modelValue', false)
    } else {
      resetForm()
    }
  } catch {
    // 错误已由请求层提示
  } finally {
    submitting.value = false
  }
}

defineExpose({ reset: resetForm, submit: handleSubmit })
</script>

<template>
  <!-- 弹窗模式 -->
  <el-dialog
    v-if="dialog"
    :model-value="modelValue"
    :title="title"
    width="520px"
    :close-on-click-modal="false"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-form ref="formRef" :model="form" label-width="90px">
      <el-form-item v-for="f in fields" :key="f.prop" :label="f.label" :prop="f.prop" :rules="rulesOf(f)">
        <el-input v-if="f.type === 'input' || !f.type" v-model="form[f.prop]" :placeholder="f.placeholder ?? `请输入${f.label}`" />
        <el-input v-else-if="f.type === 'textarea'" v-model="form[f.prop]" type="textarea" :rows="3" :placeholder="f.placeholder ?? `请输入${f.label}`" />
        <el-input-number v-else-if="f.type === 'number'" v-model="form[f.prop] as number" style="width: 100%" />
        <el-select v-else-if="f.type === 'select'" v-model="form[f.prop]" :multiple="f.multiple" :placeholder="f.placeholder ?? `请选择${f.label}`" style="width: 100%">
          <el-option v-for="o in f.options ?? []" :key="o.value" :label="o.label" :value="o.value" />
        </el-select>
        <el-date-picker v-else-if="f.type === 'date'" v-model="form[f.prop]" type="date" value-format="YYYY-MM-DD" :placeholder="f.placeholder ?? `请选择${f.label}`" style="width: 100%" />
        <el-radio-group v-else-if="f.type === 'radio'" v-model="form[f.prop]">
          <el-radio v-for="o in f.options ?? []" :key="o.value" :value="o.value">{{ o.label }}</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>

  <!-- 整页模式 -->
  <div v-else class="pro-form-page">
    <el-form ref="formRef" :model="form" label-width="110px">
      <el-form-item v-for="f in fields" :key="f.prop" :label="f.label" :prop="f.prop" :rules="rulesOf(f)">
        <el-input v-if="f.type === 'input' || !f.type" v-model="form[f.prop]" :placeholder="f.placeholder ?? `请输入${f.label}`" />
        <el-input v-else-if="f.type === 'textarea'" v-model="form[f.prop]" type="textarea" :rows="4" :placeholder="f.placeholder ?? `请输入${f.label}`" />
        <el-input-number v-else-if="f.type === 'number'" v-model="form[f.prop] as number" style="width: 100%" />
        <el-select v-else-if="f.type === 'select'" v-model="form[f.prop]" :multiple="f.multiple" :placeholder="f.placeholder ?? `请选择${f.label}`" style="width: 100%">
          <el-option v-for="o in f.options ?? []" :key="o.value" :label="o.label" :value="o.value" />
        </el-select>
        <el-date-picker v-else-if="f.type === 'date'" v-model="form[f.prop]" type="date" value-format="YYYY-MM-DD" :placeholder="f.placeholder ?? `请选择${f.label}`" style="width: 100%" />
        <el-radio-group v-else-if="f.type === 'radio'" v-model="form[f.prop]">
          <el-radio v-for="o in f.options ?? []" :key="o.value" :value="o.value">{{ o.label }}</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">提交</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped>
.pro-form-page {
  max-width: 640px;
}
</style>
```

注意：弹窗/整页两分支的字段渲染块有重复（v-if/v-else 分支各自一份）。这是为了保持结构简单、避免抽出子组件的复杂度；后续如字段渲染持续增长再抽 `ProFormField.vue`。

- [ ] **Step 3: build 验证**

运行：`npm run build`
预期：`vue-tsc` + vite 通过（`el-date-picker`/`el-radio`/`el-radio-group` 由 Element PlusResolver 自动解析）。

- [ ] **Step 4: Commit**

```bash
git add src/components/ProForm
git commit -m "feat: ProForm 扩展 date/radio 控件与整页模式"
```

---

### Task 3: mock 结构改造（节点 + 完整可分配树）

**Files:**
- Create: `mock/nodes.ts`
- Create: `mock/nodes.test.ts`
- Modify: `mock/menus.ts`（重构导出结构）
- Modify: `mock/system.ts`（加 `GET /api/system/menu/all`，角色 seed 更新在 Task 4）

**Interfaces:**
- Consumes: `NodeItem`/`MenuNode` 类型（Task 1）
- Produces:
  - `buildNodeMenuChildren(nodeIds: string[]): MenuNode[]`（纯函数，可单测）
  - mock 端点：`GET/POST/PUT/DELETE /api/system/node`、`GET /api/system/menu/all`、`POST /api/node/{id}/submit`
  - `mock/menus.ts` 导出 `dashboardMenu`/`systemGroup`/`businessGroup`/`allMenusForTree()`

- [ ] **Step 1: 重构 mock/menus.ts**

`mock/menus.ts`（完整替换，导出结构化菜单供 /auth/me 动态构建与分配树使用）：

```ts
import type { MenuNode } from '@/types'

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

/** 完整可分配树：仪表盘 + 系统管理（全子节点）+ 业务填报（全部节点），供角色分配权限与 admin 登录使用 */
export function allMenusForTree(allNodes: MenuNode[]): MenuNode[] {
  return [
    dashboardMenu,
    { ...systemGroup, children: [...systemChildren] },
    { ...businessGroup, children: [...allNodes] },
  ]
}
```

（原 `adminMenus`/`userMenus` 删除；角色管理页不再直接 import 它们，改在 Task 8 接入 `/api/system/menu/all`。）

- [ ] **Step 2: 写 mock/nodes.ts + 测试（先失败）**

`mock/nodes.test.ts`：

```ts
import { describe, expect, it } from 'vitest'
import { buildNodeMenuChildren, nodes } from './nodes'
import type { NodeItem } from '@/types'

describe('mock/nodes buildNodeMenuChildren', () => {
  it('按传入 nodeIds 过滤启用节点并按 sort 排序，携带 fields', () => {
    const result = buildNodeMenuChildren(['n2', 'n1'])
    expect(result.map((m) => m.id)).toEqual(['n1', 'n2'])
    expect(result[0].title).toBe('台账填报')
    expect(result[0].path).toBe('/fill/n1')
    expect(result[0].component).toBe('fill/node')
    expect(result[0].fields?.length).toBeGreaterThan(0)
  })

  it('停用节点不返回；未传入的 nodeId 不返回', () => {
    const custom: NodeItem[] = [
      { id: 'x1', name: '启用节点', sort: 1, status: 1, fields: [] },
      { id: 'x2', name: '停用节点', sort: 2, status: 0, fields: [] },
    ]
    const result = buildNodeMenuChildren(['x1', 'x2'], custom)
    expect(result.map((m) => m.id)).toEqual(['x1'])
  })

  it('空数组返回空', () => {
    expect(buildNodeMenuChildren([])).toEqual([])
  })
})
```

说明：`buildNodeMenuChildren(nodeIds: string[], source: NodeItem[] = nodes)`，默认用 `nodes` 种子；测试可传自造数组（含 status:0）验证停用过滤。

- [ ] **Step 3: 运行测试确认失败**

运行：`npm run test -- mock/nodes.test.ts`
预期：FAIL，`./nodes` 不存在。

- [ ] **Step 4: 实现 mock/nodes.ts**

`mock/nodes.ts`：

```ts
import type { MockMethod } from 'vite-plugin-mock'
import type { MenuNode, NodeItem } from '@/types'

export const nodes: NodeItem[] = [
  {
    id: 'n1', name: '台账填报', sort: 1, status: 1,
    fields: [
      { prop: 'street', label: '街道名称', type: 'input', required: true },
      { prop: 'population', label: '人口数量', type: 'number', required: true },
      { prop: 'dataDate', label: '数据日期', type: 'date' },
      {
        prop: 'district', label: '所属区', type: 'select',
        options: [{ label: '东城区', value: '东城区' }, { label: '西城区', value: '西城区' }],
      },
      { prop: 'remark', label: '备注', type: 'textarea' },
    ],
  },
  {
    id: 'n2', name: '报表填报', sort: 2, status: 1,
    fields: [
      { prop: 'title', label: '报表标题', type: 'input', required: true },
      {
        prop: 'kind', label: '报表类型', type: 'radio',
        options: [{ label: '月报', value: '月报' }, { label: '年报', value: '年报' }],
      },
      { prop: 'note', label: '说明', type: 'textarea' },
    ],
  },
]

/** 节点 → 业务填报子菜单（纯函数：按传入 nodeIds 过滤启用节点、按 sort 排序、携带 fields） */
export function buildNodeMenuChildren(nodeIds: string[], source: NodeItem[] = nodes): MenuNode[] {
  return source
    .filter((n) => nodeIds.includes(n.id) && n.status === 1)
    .sort((a, b) => a.sort - b.sort)
    .map((n) => ({
      id: n.id,
      parentId: '3',
      name: `Node${n.id}`,
      title: n.name,
      path: `/fill/${n.id}`,
      component: 'fill/node',
      icon: '',
      sort: n.sort,
      perms: [],
      fields: n.fields,
    }))
}

const ok = (data: unknown) => ({ code: 0, message: 'ok', data })

export default [
  { url: '/api/system/node/list', method: 'get', response: () => ok(nodes) },
  {
    url: '/api/system/node',
    method: 'post',
    response: ({ body }: { body: Partial<NodeItem> }) => {
      const item: NodeItem = { id: `n${Date.now()}`, name: body.name ?? '', sort: body.sort ?? 1, status: body.status ?? 1, fields: body.fields ?? [] }
      nodes.push(item)
      return ok(null)
    },
  },
  {
    url: '/api/system/node',
    method: 'put',
    response: ({ body }: { body: NodeItem }) => {
      const i = nodes.findIndex((n) => n.id === body.id)
      if (i > -1) nodes[i] = { ...nodes[i], ...body }
      return ok(null)
    },
  },
  {
    url: '/api/system/node',
    method: 'delete',
    response: ({ query }: { query: { id: string } }) => {
      const i = nodes.findIndex((n) => n.id === query.id)
      if (i > -1) nodes.splice(i, 1)
      return ok(null)
    },
  },
  { url: '/api/node/:id/submit', method: 'post', response: () => ok(null) },
] as MockMethod[]
```

- [ ] **Step 5: 运行测试确认通过**

运行：`npm run test -- mock/nodes.test.ts`
预期：PASS（按上一步实现签名调整断言）。

- [ ] **Step 6: 在 mock/system.ts 加 menu/all 端点**

`mock/system.ts` 顶部 import 并新增端点：

```ts
import { allMenusForTree } from './menus'
import { buildNodeMenuChildren, nodes } from './nodes'
```

末尾追加：

```ts
{
  url: '/api/system/menu/all',
  method: 'get',
  response: () => ok(allMenusForTree(buildNodeMenuChildren(nodes.map((n) => n.id)))),
},
```

（完整可分配树 = 系统菜单全量 + 业务填报全部启用节点。）

- [ ] **Step 7: 全量测试 + Commit**

运行：`npm run test`
预期：全绿（22 既有 + nodes 新增）。

```bash
git add mock
git commit -m "feat: mock 节点数据与完整可分配树"
```

---

### Task 4: /auth/me 动态菜单构建 + 修改密码接口

**Files:**
- Modify: `mock/auth.ts`
- Modify: `mock/auth.test.ts`
- Modify: `mock/system.ts`（角色 seed 更新）

**Interfaces:**
- Consumes: `dashboardMenu`/`systemGroup`/`businessGroup`（Task 3）、`buildNodeMenuChildren`（Task 3）
- Produces: `buildMenuTree(menuIds: string[]): MenuNode[]`（纯函数，可单测）；`PUT /api/auth/password`

- [ ] **Step 1: 写 buildMenuTree 测试（先失败）**

`mock/auth.test.ts`（替换原有内容）：

```ts
import { describe, expect, it } from 'vitest'
import { buildMenuTree, resolveUserByToken, users } from './auth'

describe('mock 登录鉴权', () => {
  it('admin 的 token 能解析出全量菜单', () => {
    const result = resolveUserByToken('token-admin')
    expect(result?.userInfo.username).toBe('admin')
    expect(buildMenuTree(users.admin.menuIds).some((m) => m.title === '系统管理')).toBe(true)
  })

  it('非法 token 返回 null', () => {
    expect(resolveUserByToken('token-ghost')).toBeNull()
  })
})

describe('mock/auth buildMenuTree', () => {
  it('按 menuIds 构建：admin 系统管理含 4 子节点 + 业务填报 2 节点', () => {
    const tree = buildMenuTree(users.admin.menuIds)
    expect(tree.map((m) => m.title)).toEqual(['仪表盘', '系统管理', '业务填报'])
    const system = tree.find((m) => m.title === '系统管理')!
    expect(system.children?.map((c) => c.id)).toEqual(['21', '22', '23', '24', '25'])
    const fill = tree.find((m) => m.title === '业务填报')!
    expect(fill.children?.map((c) => c.id)).toEqual(['n1', 'n2'])
    expect(fill.children?.[0].fields?.length).toBeGreaterThan(0)
  })

  it('非管理员：系统管理仅修改密码(25)，业务填报仅 n1', () => {
    const tree = buildMenuTree(users.user.menuIds)
    const system = tree.find((m) => m.title === '系统管理')!
    expect(system.children?.map((c) => c.id)).toEqual(['25'])
    const fill = tree.find((m) => m.title === '业务填报')!
    expect(fill.children?.map((c) => c.id)).toEqual(['n1'])
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

运行：`npm run test -- mock/auth.test.ts`
预期：FAIL，`buildMenuTree`/`users` 不存在或结构不符。

- [ ] **Step 3: 重构 mock/auth.ts**

`mock/auth.ts`（完整替换）：

```ts
import type { MockMethod } from 'vite-plugin-mock'
import type { MenuNode } from '@/types'
import { businessGroup, dashboardMenu, systemGroup, systemChildren } from './menus'
import { buildNodeMenuChildren } from './nodes'

export interface MockUser {
  password: string
  nickname: string
  roles: string[]
  deptId: string | null
  menuIds: string[]
}

export const users: Record<string, MockUser> = {
  admin: { password: 'admin123', nickname: '系统管理员', roles: ['admin'], deptId: '1', menuIds: ['1', '2', '21', '22', '23', '24', '25', '3', 'n1', 'n2'] },
  user: { password: 'user123', nickname: '普通用户', roles: ['user'], deptId: '1', menuIds: ['1', '2', '25', '3', 'n1'] },
}

/** 按角色 menuIds 动态构建菜单树：仪表盘 + 系统管理(只含勾选子节点) + 业务填报(只含勾选节点) */
export function buildMenuTree(menuIds: string[]): MenuNode[] {
  const tree: MenuNode[] = []
  if (menuIds.includes('1')) tree.push(dashboardMenu)
  if (menuIds.includes('2')) {
    const children = systemChildren.filter((c) => menuIds.includes(c.id))
    tree.push({ ...systemGroup, children })
  }
  if (menuIds.includes('3')) {
    const nodeIds = menuIds.filter((id) => id.startsWith('n'))
    const nodeChildren = buildNodeMenuChildren(nodeIds)
    if (nodeChildren.length) tree.push({ ...businessGroup, children: nodeChildren })
  }
  return tree
}

export function resolveUserByToken(token: string): {
  userInfo: { id: string; username: string; nickname: string; roles: string[]; deptId: string | null }
  menus: MenuNode[]
} | null {
  const username = token.replace(/^token-/, '')
  const u = users[username]
  if (!u) return null
  return {
    userInfo: { id: username, username, nickname: u.nickname, roles: u.roles, deptId: u.deptId },
    menus: buildMenuTree(u.menuIds),
  }
}

export default [
  {
    url: '/api/auth/login',
    method: 'post',
    response: ({ body }: { body: { username: string; password: string } }) => {
      const u = users[body.username]
      if (!u || u.password !== body.password) {
        return { code: 1, message: '用户名或密码错误', data: null }
      }
      return { code: 0, message: 'ok', data: { token: `token-${body.username}` } }
    },
  },
  {
    url: '/api/auth/logout',
    method: 'post',
    response: () => ({ code: 0, message: 'ok', data: null }),
  },
  {
    url: '/api/auth/me',
    method: 'get',
    response: ({ headers }: { headers: Record<string, string> }) => {
      const token = headers.authorization?.replace('Bearer ', '') ?? ''
      const result = resolveUserByToken(token)
      if (!result) return { code: 1, message: '登录状态失效，请重新登录', data: null }
      return { code: 0, message: 'ok', data: result }
    },
  },
  {
    url: '/api/auth/password',
    method: 'put',
    response: ({ headers, body }: { headers: Record<string, string>; body: { oldPassword: string; newPassword: string } }) => {
      const token = headers.authorization?.replace('Bearer ', '') ?? ''
      const username = token.replace(/^token-/, '')
      const u = users[username]
      if (!u) return { code: 401, message: '未登录', data: null }
      if (u.password !== body.oldPassword) return { code: 1, message: '原密码错误', data: null }
      u.password = body.newPassword
      return { code: 0, message: 'ok', data: null }
    },
  },
] as MockMethod[]
```

（`nodes` import 用于……实际上 `buildNodeMenuChildren` 已内部用 `nodes`，这里可不 import `nodes`——去掉未用 import，避免 lint 报错。）

- [ ] **Step 4: 运行测试确认通过**

运行：`npm run test -- mock/auth.test.ts`
预期：PASS（admin/user/非法 token + 动态树断言）。

- [ ] **Step 5: 更新 mock/system.ts 角色 seed**

`mock/system.ts` 中 `roles` 数组的 menuIds 更新为统一 id 体系（与 users 对齐）：

```ts
const roles: RoleItem[] = [
  { id: '1', name: '系统管理员', code: 'admin', sort: 1, status: 1, menuIds: ['1', '2', '21', '22', '23', '24', '25', '3', 'n1', 'n2'], remark: '全部权限' },
  { id: '2', name: '普通用户', code: 'user', sort: 2, status: 1, menuIds: ['1', '2', '25', '3', 'n1'], remark: '仅仪表盘+修改密码+台账' },
]
```

- [ ] **Step 6: 全量测试 + Commit**

运行：`npm run test`
预期：全绿。

```bash
git add mock
git commit -m "feat: /auth/me 动态菜单构建与修改密码接口"
```

---

### Task 5: 修改密码页

**Files:**
- Create: `src/views/system/password/index.vue`

**Interfaces:**
- Consumes: `changePassword`（Task 1）、`useUserStore`（退出登录）
- Produces: `/system/password` 页面（原密码/新密码/确认新密码，提交后跳登录）

- [ ] **Step 1: 实现修改密码页**

`src/views/system/password/index.vue`：

```vue
<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { changePassword } from '@/api/auth'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref()
const submitting = ref(false)
const form = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })

const rules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '新密码至少 6 位', trigger: 'blur' },
    {
      validator: (_: unknown, value: string, callback: (e?: Error) => void) => {
        if (value && value === form.oldPassword) callback(new Error('新密码不能与原密码相同'))
        else callback()
      },
      trigger: 'blur',
    },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (_: unknown, value: string, callback: (e?: Error) => void) => {
        if (value && value !== form.newPassword) callback(new Error('两次输入不一致'))
        else callback()
      },
      trigger: 'blur',
    },
  ],
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate()
  submitting.value = true
  try {
    await changePassword({ oldPassword: form.oldPassword, newPassword: form.newPassword })
    ElMessage.success('密码修改成功，请重新登录')
    userStore.reset()
    router.replace('/login')
  } catch {
    // 错误已由请求层提示
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <el-card class="password-card">
    <template #header>修改密码</template>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="110px" style="max-width: 420px">
      <el-form-item label="原密码" prop="oldPassword">
        <el-input v-model="form.oldPassword" type="password" show-password placeholder="请输入原密码" />
      </el-form-item>
      <el-form-item label="新密码" prop="newPassword">
        <el-input v-model="form.newPassword" type="password" show-password placeholder="至少 6 位" />
      </el-form-item>
      <el-form-item label="确认新密码" prop="confirmPassword">
        <el-input v-model="form.confirmPassword" type="password" show-password placeholder="再次输入新密码" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确认修改</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<style scoped>
.password-card {
  max-width: 640px;
}
</style>
```

- [ ] **Step 2: dev 验证**

运行 `npm run dev`，登录 `admin` → 系统管理 → 修改密码：原密码 `admin123`、新密码 `newpass123`、确认一致 → 提交 → 提示成功并跳登录；再用 `newpass123` 登录成功（说明 mock 已更新）。验证后**把 mock 里 admin 密码改回 `admin123`**（`mock/auth.ts` 的 users seed，改回后重新登录验证）。杀掉 dev（端口释放）。

- [ ] **Step 3: build + Commit**

运行：`npm run build`

```bash
git add src/views/system/password
git commit -m "feat: 修改密码页"
```

---

### Task 6: 填报页（buildRoutes meta + 动态表单渲染）

**Files:**
- Modify: `src/router/dynamic.ts`
- Create: `src/views/fill/node.vue`

**Interfaces:**
- Consumes: `toFormFields`（Task 1）、ProForm `dialog=false`（Task 2）、路由 meta（本任务 buildRoutes 写入）
- Produces: buildRoutes 的 meta 携带 `nodeId`/`fields`；`/fill/{nodeId}` 填报页

- [ ] **Step 1: buildRoutes 扩展 meta**

`src/router/dynamic.ts` 中 buildRoutes 的 route 构造改为：

```ts
if (m.component) {
  routes.push({
    path: m.path,
    name: m.name,
    component: resolveComponent(m.component),
    meta: { title: m.title ?? m.name, icon: m.icon, perms: m.perms, nodeId: m.id, fields: m.fields },
  })
}
```

（其余逻辑不变；非节点菜单的 nodeId/fields 为 undefined，无害。）

- [ ] **Step 2: 扩展 dynamic 测试断言 meta**

`src/router/dynamic.test.ts` 追加用例：

```ts
it('节点菜单的 meta 携带 nodeId 与 fields', () => {
  const nodeMenus: MenuNode[] = [
    {
      id: 'n1', parentId: '3', name: 'Noden1', title: '台账填报', path: '/fill/n1',
      component: 'fill/node', icon: '', sort: 1, perms: [],
      fields: [{ prop: 'street', label: '街道名称', type: 'input', required: true }],
    },
  ]
  const routes = buildRoutes(nodeMenus)
  expect(routes[0].meta?.nodeId).toBe('n1')
  expect(routes[0].meta?.fields).toHaveLength(1)
})
```

运行 `npm run test -- src/router/dynamic.test.ts`，确认新旧用例全过。

- [ ] **Step 3: 实现填报页**

`src/views/fill/node.vue`：

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import ProForm from '@/components/ProForm/index.vue'
import type { FormField } from '@/components/ProForm/types'
import { submitNodeData } from '@/api/system'
import { toFormFields } from '@/utils/form'

const route = useRoute()

const nodeId = computed(() => (route.meta.nodeId as string) ?? '')
const title = computed(() => (route.meta.title as string) ?? '填报')
const fields = computed<FormField[]>(() => toFormFields((route.meta.fields as FieldConfig[]) ?? []))

async function submit(values: Record<string, unknown>): Promise<void> {
  await submitNodeData(nodeId.value, values)
}
</script>

<template>
  <el-card>
    <template #header>{{ title }}</template>
    <ProForm
      :dialog="false"
      :title="title"
      :fields="fields"
      :submit-api="submit"
      success-message="提交成功"
    />
  </el-card>
</template>
```

（`FieldConfig` 类型需 import：`import type { FieldConfig } from '@/types'`。）

- [ ] **Step 4: dev 验证**

运行 `npm run dev`，登录 `admin` → 业务填报 → 台账填报：渲染 街道名称/人口数量/数据日期/所属区/备注 表单，填后提交 → "提交成功"并重置。报表填报 → 渲染不同字段（含单选）。杀掉 dev（端口释放）。

- [ ] **Step 5: Commit**

```bash
git add src/router/dynamic.ts src/router/dynamic.test.ts src/views/fill
git commit -m "feat: 填报页动态表单渲染"
```

---

### Task 7: 节点管理页 + 字段配置编辑器

**Files:**
- Create: `src/views/system/node/index.vue`

**Interfaces:**
- Consumes: `getNodeList`/`createNode`/`updateNode`/`deleteNode`（Task 1）、ProForm（Task 2）、v-perm
- Produces: `/system/node` 页面（节点列表 + 新增/编辑 + 字段配置编辑器弹窗）

- [ ] **Step 1: 实现节点管理页**

`src/views/system/node/index.vue`：

```vue
<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createNode, deleteNode, getNodeList, updateNode } from '@/api/system'
import ProForm from '@/components/ProForm/index.vue'
import type { FieldConfig, FieldType, NodeItem } from '@/types'

const list = ref<NodeItem[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const form = reactive<Partial<NodeItem>>({})

async function load() {
  loading.value = true
  try {
    list.value = await getNodeList()
  } finally {
    loading.value = false
  }
}

function openAdd() {
  isEdit.value = false
  Object.assign(form, { name: '', sort: 1, status: 1 })
  dialogVisible.value = true
}

function openEdit(row: NodeItem) {
  isEdit.value = true
  Object.assign(form, { ...row })
  dialogVisible.value = true
}

async function handleSubmit(values: Record<string, unknown>) {
  if (isEdit.value) {
    await updateNode({ ...(form as NodeItem), ...values } as NodeItem)
  } else {
    await createNode(values as Partial<NodeItem>)
  }
  load()
}

async function handleDelete(row: NodeItem) {
  await ElMessageBox.confirm(`确定删除节点「${row.name}」？`, '提示', { type: 'warning' })
  await deleteNode(row.id)
  ElMessage.success('删除成功')
  load()
}

// ---------- 字段配置编辑器 ----------
const fieldVisible = ref(false)
const fieldRows = ref<(FieldConfig & { optionsText?: string })[]>([])
const editingNode = ref<NodeItem | null>(null)

function openFieldConfig(row: NodeItem) {
  editingNode.value = row
  fieldRows.value = row.fields.map((f) => ({
    ...f,
    optionsText: (f.options ?? []).map((o) => o.label).join('\n'),
  }))
  fieldVisible.value = true
}

function addFieldRow() {
  fieldRows.value.push({ prop: `field_${fieldRows.value.length + 1}`, label: '', type: 'input' })
}

function removeFieldRow(index: number) {
  fieldRows.value.splice(index, 1)
}

async function saveFieldConfig() {
  const empty = fieldRows.value.find((f) => !f.label.trim() || !f.prop.trim())
  if (empty) {
    ElMessage.warning('字段的标签和字段名不能为空')
    return
  }
  const finalRows: FieldConfig[] = fieldRows.value.map((row) => {
    const base: FieldConfig = { prop: row.prop, label: row.label, type: row.type, required: row.required ?? false }
    const isChoice = row.type === 'select' || row.type === 'radio'
    if (isChoice) {
      base.options = (row.optionsText ?? '')
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => ({ label: s, value: s }))
    }
    return base
  })
  if (!editingNode.value) return
  await updateNode({ ...editingNode.value, fields: finalRows })
  ElMessage.success('字段配置已保存')
  fieldVisible.value = false
  load()
}

const typeLabel: Record<FieldType, string> = {
  input: '输入框', textarea: '多行文本', number: '数字', select: '下拉', date: '日期', radio: '单选',
}

onMounted(load)
</script>

<template>
  <el-card>
    <div class="toolbar">
      <el-button v-perm="'system:node:add'" type="primary" @click="openAdd">新增节点</el-button>
    </div>

    <el-table v-loading="loading" :data="list" border>
      <el-table-column prop="name" label="节点名称" min-width="140" />
      <el-table-column prop="sort" label="排序" width="80" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'">{{ row.status === 1 ? '启用' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="字段数" width="90">
        <template #default="{ row }">{{ row.fields.length }}</template>
      </el-table-column>
      <el-table-column label="操作" width="240">
        <template #default="{ row }">
          <el-button v-perm="'system:node:config'" type="primary" link @click="openFieldConfig(row)">配置字段</el-button>
          <el-button v-perm="'system:node:edit'" type="primary" link @click="openEdit(row)">编辑</el-button>
          <el-button v-perm="'system:node:delete'" type="danger" link @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <ProForm
      v-model="dialogVisible"
      :title="isEdit ? '编辑节点' : '新增节点'"
      :initial-values="form as Record<string, unknown>"
      :submit-api="handleSubmit"
      :fields="[
        { prop: 'name', label: '节点名称', rules: [{ required: true, message: '请输入节点名称', trigger: 'blur' }] },
        { prop: 'sort', label: '排序', type: 'number' },
      ]"
    />

    <!-- 字段配置编辑器 -->
    <el-dialog v-model="fieldVisible" :title="`配置字段：${editingNode?.name ?? ''}`" width="680px" destroy-on-close>
      <el-table :data="fieldRows" border>
        <el-table-column label="标签" min-width="120">
          <template #default="{ row }">
            <el-input v-model="row.label" placeholder="显示名" />
          </template>
        </el-table-column>
        <el-table-column label="字段名" min-width="120">
          <template #default="{ row }">
            <el-input v-model="row.prop" placeholder="prop" />
          </template>
        </el-table-column>
        <el-table-column label="类型" width="120">
          <template #default="{ row }">
            <el-select v-model="row.type" style="width: 100%">
              <el-option v-for="(label, type) in typeLabel" :key="type" :label="label" :value="type" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="必填" width="60">
          <template #default="{ row }">
            <el-checkbox v-model="row.required" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80">
          <template #default="{ $index }">
            <el-button type="danger" link @click="removeFieldRow($index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 选项（仅 select/radio 显示） -->
      <div v-if="fieldRows.some((f) => f.type === 'select' || f.type === 'radio')" class="field-options">
        <template v-for="(row, i) in fieldRows" :key="i">
          <div v-if="row.type === 'select' || row.type === 'radio'" class="field-option-row">
            <span class="option-label">{{ row.label || row.prop }} 选项（每行一个）：</span>
            <el-input
              v-model="row.optionsText"
              type="textarea"
              :rows="2"
              placeholder="每行一个选项，如：&#10;东城区&#10;西城区"
            />
          </div>
        </template>
      </div>

      <template #footer>
        <el-button @click="fieldVisible = false">取消</el-button>
        <el-button type="primary" @click="addFieldRow">添加字段</el-button>
        <el-button type="primary" @click="saveFieldConfig">保存</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<style scoped>
.toolbar {
  margin-bottom: 12px;
}
.field-options {
  margin-top: 12px;
}
.field-option-row {
  margin-bottom: 8px;
}
.option-label {
  font-size: 13px;
  color: #666;
}
</style>
```

说明：选项输入用 `row.optionsText`（textarea 字符串，每行一个选项），`saveFieldConfig` 里转成 `options` 数组；`fieldRows` 类型为 `(FieldConfig & { optionsText?: string })[]`（`optionsText` 仅编辑器内使用，不持久化）。

- [ ] **Step 2: dev 验证**

运行 `npm run dev`，登录 `admin` → 系统管理 → 节点管理：
1. 列表显示 台账填报/报表填报
2. 新增节点 → 列表刷新
3. 台账填报"配置字段"→ 加一行（标签=电话、类型=输入框、必填）→ 保存 → 字段数 +1
4. 删除某节点 → 确认后消失
杀掉 dev（端口释放）。

- [ ] **Step 3: build + Commit**

运行：`npm run build`

```bash
git add src/views/system/node
git commit -m "feat: 节点管理页与字段配置编辑器"
```

---

### Task 8: 角色管理接入完整树 + 权限联动端到端验证

**Files:**
- Modify: `src/views/system/role/index.vue`（分配权限树数据源改为 `getAllMenuTree`）

**Interfaces:**
- Consumes: `getAllMenuTree`（Task 1）、mock `menu/all`（Task 3）
- Produces: 角色分配权限树含系统菜单 + 填报节点；端到端验证非管理员权限

- [ ] **Step 1: 角色管理改用接口数据**

`src/views/system/role/index.vue` 顶部：

```ts
import { getAllMenuTree } from '@/api/system'
```

删除 `import { adminMenus } from '../../../../mock/menus'`。`openPerm` 前确保树数据就绪：

```ts
const menuTree = ref<MenuNode[]>([])

async function loadMenuTree() {
  menuTree.value = await getAllMenuTree()
}

function openPerm(row: RoleItem) {
  currentRole.value = row
  checkedKeys.value = row.menuIds ?? []
  permVisible.value = true
}
```

模板中 el-tree 的 `:data` 改为 `menuTree`；`onMounted` 里加 `loadMenuTree()`（与 `load()` 并行）。

- [ ] **Step 2: 端到端权限验证**

运行 `npm run dev`：
1. **admin**：登录 → 系统管理含 节点管理/角色管理/用户管理/修改密码；业务填报含 台账填报/报表填报；各系统页按钮齐全
2. **admin**：角色管理 → 分配权限 → 树含仪表盘/系统管理(5 子)/业务填报(2 节点)；给"普通用户"角色勾选 系统管理→修改密码 + 业务填报→台账填报 → 保存
3. **user**：登录 → 系统管理**仅修改密码**；业务填报**仅台账填报**；直接访问 `/system/node`、`/system/role`、`/system/user` → 404
4. **user**：台账填报可填可提交；修改密码可用
5. 验证完把角色勾选恢复默认（或说明：user 角色的 menuIds 已由 mock seed 定义，前端分配操作会改 mock 内存数据，重启 dev 后恢复 seed）
杀掉 dev（端口释放）。

- [ ] **Step 3: 全量测试 + build + Commit**

运行：`npm run test`（全绿）、`npm run build`

```bash
git add src/views/system/role
git commit -m "feat: 角色分配权限接入完整菜单树"
```

---

## Self-Review

**1. Spec 覆盖检查：**

| Spec 要求 | 对应 Task |
|---|---|
| 数据模型（FieldConfig/NodeItem/ChangePasswordParams/MenuNode.fields） | Task 1 |
| ProForm 扩展（date/radio/dialog） | Task 2 |
| 节点管理页 + 字段配置编辑器 | Task 7 |
| 填报页（单组件 + meta.fields） | Task 6 |
| 修改密码页 + mock 接口 | Task 5 + Task 4 |
| /auth/me 动态构建 + 完整可分配树 + 角色接入 | Task 3 + Task 4 + Task 8 |
| 非管理员系统管理仅修改密码 | Task 4（seed）+ Task 8（验证） |
| 填报仅提交 | Task 3（submit 端点） |
| 演示账号差异 | Task 4 + Task 8 |

**2. 占位符扫描：** 无 TBD/TODO；每个代码步骤有完整代码。

**3. 类型一致性：**
- `FieldType`/`FieldConfig`/`NodeItem` 在 types、mock、页面、toFormFields 中一致。
- ProForm `FormField.type` 与 `FieldConfig.type` 同为 `'input'|'textarea'|'number'|'select'|'date'|'radio'`。
- `buildNodeMenuChildren` 产出 `MenuNode[]`（含 fields），`buildMenuTree` 消费，`allMenusForTree` 消费。
- buildRoutes meta 的 `nodeId`/`fields` 与填报页读取一致。
- `toFormFields` 返回 `FormField[]`，填报页传给 ProForm 的 `:fields`。

**已知待办（非计划缺陷）：**
- ProForm 弹窗/整页两分支的字段渲染块有重复（Task 2 注明，字段渲染继续增长再抽组件）。
- 修改密码验证会临时改 mock 里 admin 密码，需在验证后改回（Task 5 Step 2）。
- 角色分配操作改 mock 内存数据，重启 dev 恢复 seed（Task 8 Step 2 注明）。
- mock/auth.test.ts 断言依赖 seed menuIds（admin 4 子节点 + 2 节点；user 仅 25 + n1），改 seed 需同步改断言。
