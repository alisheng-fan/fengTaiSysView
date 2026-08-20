# fengTaiSysView 项目全周期业务化 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 fengTaiSysView 通用基座扩展为"丰台区项目全周期跟踪平台"：项目主数据、流程节点挂项目、进展填报记录（新增/编辑）、问题上报闭环、监测统计、移动端 4-tab。

**Architecture:** 数据模型扩展（ProjectItem / NodeItem 升级挂项目 / FillRecordItem / IssueItem / StatisticsOverview）；接口层 shared/api 扩展；mock 用 globalThis 共享数组（沿用既有模式，跨文件跨进程单源）；PC 加项目管理页 + 节点管理升级；移动端 TabBar 改 首页/监测/我的/进度，项目查询 → 项目详情（流程节点）→ 节点填报（记录+编辑）+ 问题上报 + 监测。RBAC 保留：节点可见性仍来自 /auth/me 菜单（角色→节点）。

**Tech Stack:** 沿用现有（Vite 5 + Vue 3 + TS + Vant 4 + Element Plus + mock + Vitest）。

**Spec:** [docs/superpowers/specs/2026-08-20-feng-tai-sys-view-project-fullcycle-design.md](../specs/2026-08-20-feng-tai-sys-view-project-fullcycle-design.md)
**业务依据:** [docs/business/2026-08-20-fengtai-mobile-prototype-requirements.md](../../business/2026-08-20-fengtai-mobile-prototype-requirements.md)

## Global Constraints

- 沿用全部约定：shared/ 唯一接口契约、TDD、conventional commits、`@`/`@shared` 别名。
- **NodeItem 升级**：新增必填 `projectId: string`、`step: number`、可选 `date?: string`；`status` 语义为节点状态（1 进行中 / 2 已完成）。现有种子与测试同步更新。
- **mock 数组用 globalThis 单源**（`__fengtaiProjects` / `__fengtaiIssues`，沿用 nodes/roles 既有模式）：跨文件读取同一实例，统计聚合才能反映实时改动。
- `submitNodeData` 保留至 Task 5 移除（避免中间破坏移动端）；Task 5 起移动端改用 `createFillRecord`/`getNodeRecords`/`updateFillRecord`。
- 移动端 TabBar 4-tab：首页(项目查询) / 监测 / 我的 / 进度；原"填报"tab 移除，填报入口改为项目详情 → 节点。
- 节点可见性仍走 /auth/me 菜单（角色→节点），移动端项目详情的节点列表从 fill store（getMe）按 projectId 过滤，**不绕过 RBAC**。
- 演示账号 admin/user 沿用；admin 见全部，user 见分配节点。

## 文件结构总览

| 路径 | 职责 |
|---|---|
| `shared/types/index.ts` | 新增 ProjectItem/FillRecordItem/IssueItem/IssueStatus/StatisticsOverview；NodeItem 升级 |
| `shared/api/system.ts` | 新增 project/node-records/issue/statistics 接口 |
| `mock/project.ts` | 项目种子 + CRUD + 统计聚合（globalThis） |
| `mock/nodes.ts` | 节点升级挂项目 + 填报记录数组 + records 端点（globalThis） |
| `mock/issue.ts` | 问题种子 + CRUD（globalThis） |
| `mock/auth.ts` / `mock/menus.ts` | 不变（菜单构建沿用，节点仍带 fields 下发） |
| `mock/nodes.test.ts` / `mock/auth.test.ts` | 同步 NodeItem 新字段 |
| `src/views/system/project/index.vue` | PC 项目管理页 |
| `src/views/system/node/index.vue` | 节点管理加 所属项目/步骤 字段 |
| `mobile/src/router/index.ts` | 4-tab 路由（home/monitor/profile/password/progress + project 详情/填报） |
| `mobile/src/layouts/MainTab.vue` | 4-tab TabBar |
| `mobile/src/stores/project.ts` | 项目 store |
| `mobile/src/stores/fill.ts` | 节点 store（改造：nodesByProject） |
| `mobile/src/views/home/index.vue` | 首页项目查询（卡片+筛选+搜索） |
| `mobile/src/views/project/detail.vue` | 项目详情（流程节点列表 + 问题入口） |
| `mobile/src/views/project/node-fill.vue` | 节点填报（记录列表 + 新增/编辑动态表单） |
| `mobile/src/views/monitor/index.vue` | 监测统计 |
| `mobile/src/views/progress/index.vue` | 进度（我参与项目列表，简化） |
| `mobile/src/views/fill/*` | 移除（旧填报入口被新结构取代） |

---

### Task 1: 数据模型 + 接口层扩展

**Files:**
- Modify: `shared/types/index.ts`
- Modify: `shared/api/system.ts`

**Interfaces:**
- Produces: ProjectItem/FillRecordItem/IssueItem/IssueStatus/StatisticsOverview；NodeItem 升级（projectId/step/date）；`getProjectList/createProject/updateProject/deleteProject`、`getNodeRecords/createFillRecord/updateFillRecord`、`getIssueList/createIssue/updateIssue`、`getStatisticsOverview`；`submitNodeData` 暂保留

- [ ] **Step 1: 扩展类型**

`shared/types/index.ts` 追加：

```ts
/** 项目主数据 */
export interface ProjectItem {
  id: string
  name: string
  type: 'first' | 'second'
  builder?: string
  location?: string
  landSize?: number
  buildingSize?: number
  status: number
  createTime: string
}

/** 填报记录（进展录入） */
export interface FillRecordItem {
  id: string
  nodeId: string
  projectId: string
  values: Record<string, unknown>
  createBy: string
  createTime: string
}

/** 问题状态：已解决/部分解决/再商议/搁置 */
export type IssueStatus = 'solved' | 'partial' | 'discuss' | 'shelved'

/** 问题上报 */
export interface IssueItem {
  id: string
  nodeId: string
  projectId: string
  nodeName: string
  dept: string
  description: string
  status: IssueStatus
  createTime: string
}

/** 监测统计 */
export interface StatisticsOverview {
  totalProjects: number
  firstCount: number
  secondCount: number
  issueTotal: number
  issueSolved: number
  bizTotal: number
}
```

`NodeItem` 升级为：

```ts
/** 流程节点（挂项目、带流程顺序与状态） */
export interface NodeItem {
  id: string
  projectId: string
  name: string
  step: number
  sort: number
  status: number        // 1 进行中 / 2 已完成
  date?: string
  fields: FieldConfig[]
}
```

- [ ] **Step 2: 扩展接口层**

`shared/api/system.ts` 追加（`submitNodeData` 保留）：

```ts
import type {
  FillRecordItem, IssueItem, ProjectItem, StatisticsOverview,
} from '../types'

// ---------- 项目 ----------
export function getProjectList(): Promise<ProjectItem[]> {
  return request<ProjectItem[]>({ url: '/system/project/list', method: 'get' })
}
export function createProject(data: Partial<ProjectItem>): Promise<null> {
  return request<null>({ url: '/system/project', method: 'post', data })
}
export function updateProject(data: Partial<ProjectItem>): Promise<null> {
  return request<null>({ url: '/system/project', method: 'put', data })
}
export function deleteProject(id: string): Promise<null> {
  return request<null>({ url: '/system/project', method: 'delete', params: { id } })
}

// ---------- 填报记录（进展录入） ----------
export function getNodeRecords(nodeId: string): Promise<FillRecordItem[]> {
  return request<FillRecordItem[]>({ url: `/node/${nodeId}/records`, method: 'get' })
}
export function createFillRecord(data: {
  nodeId: string
  projectId: string
  values: Record<string, unknown>
}): Promise<null> {
  return request<null>({ url: `/node/${data.nodeId}/records`, method: 'post', data })
}
export function updateFillRecord(nodeId: string, recordId: string, values: Record<string, unknown>): Promise<null> {
  return request<null>({ url: `/node/${nodeId}/records/${recordId}`, method: 'put', data: { values } })
}

// ---------- 问题 ----------
export function getIssueList(projectId?: string): Promise<IssueItem[]> {
  return request<IssueItem[]>({ url: '/issue/list', method: 'get', params: projectId ? { projectId } : {} })
}
export function createIssue(data: Partial<IssueItem>): Promise<null> {
  return request<null>({ url: '/issue', method: 'post', data })
}
export function updateIssue(data: Partial<IssueItem>): Promise<null> {
  return request<null>({ url: '/issue', method: 'put', data })
}

// ---------- 监测统计 ----------
export function getStatisticsOverview(): Promise<StatisticsOverview> {
  return request<StatisticsOverview>({ url: '/statistics/overview', method: 'get' })
}
```

- [ ] **Step 3: 回归验证**

运行：`npm run test`（37 全绿）、`npm run build`。
预期：通过（NodeItem 新增必填字段不影响既有 src 代码，均用 Partial 或对象解构）。

- [ ] **Step 4: Commit**

```bash
git add shared
git commit -m "feat: 项目全周期数据模型与接口层扩展"
```

---

### Task 2: mock 改造（项目/节点升级/填报记录/问题/统计）

**Files:**
- Create: `mock/project.ts`、`mock/issue.ts`
- Modify: `mock/nodes.ts`、`mock/nodes.test.ts`、`mock/auth.test.ts`
- Test: `mock/project.test.ts`（统计聚合纯函数）

**Interfaces:**
- Produces: `/api/system/project/*`、`/api/node/{id}/records`、`/api/issue/*`、`/api/statistics/overview`；节点种子挂项目

- [ ] **Step 1: mock/project.ts（globalThis 单源 + 统计纯函数）**

`mock/project.ts`：

```ts
import type { MockMethod } from 'vite-plugin-mock'
import type { ProjectItem, StatisticsOverview } from '@/types'
import { issues } from './issue'

const g = globalThis as { __fengtaiProjects?: ProjectItem[] }
/** 项目数据单源（globalThis，跨 mock 文件/跨 dev server 进程内共享） */
g.__fengtaiProjects ??= [
  { id: 'p1', name: '丰台区城乡一体化槐房村和新宫村改造项目', type: 'first', builder: 'xxx单位', location: '丰台区xxx', landSize: 32000, buildingSize: 22323, status: 1, createTime: '2026-01-01 09:00:00' },
  { id: 'p2', name: '中央民族大学公交首末站项目', type: 'second', builder: 'xxx单位', location: '丰台区xxx', landSize: 3200, buildingSize: 2232, status: 1, createTime: '2026-02-01 09:00:00' },
]
export const projects = g.__fengtaiProjects

/** 监测统计聚合（纯函数，可单测） */
export function buildOverview(
  projs: ProjectItem[],
  iss: { status: string }[],
  bizTotal = 500,
): StatisticsOverview {
  return {
    totalProjects: projs.length,
    firstCount: projs.filter((p) => p.type === 'first').length,
    secondCount: projs.filter((p) => p.type === 'second').length,
    issueTotal: iss.length,
    issueSolved: iss.filter((i) => i.status === 'solved').length,
    bizTotal,
  }
}

const ok = (data: unknown) => ({ code: 0, message: 'ok', data })

export default [
  { url: '/api/system/project/list', method: 'get', response: () => ok(projects) },
  {
    url: '/api/system/project',
    method: 'post',
    response: ({ body }: { body: Partial<ProjectItem> }) => {
      projects.push({ id: `p${Date.now()}`, name: body.name ?? '', type: body.type ?? 'second', builder: body.builder, location: body.location, landSize: body.landSize, buildingSize: body.buildingSize, status: body.status ?? 1, createTime: new Date().toLocaleString() })
      return ok(null)
    },
  },
  {
    url: '/api/system/project',
    method: 'put',
    response: ({ body }: { body: ProjectItem }) => {
      const i = projects.findIndex((p) => p.id === body.id)
      if (i > -1) projects[i] = { ...projects[i], ...body }
      return ok(null)
    },
  },
  {
    url: '/api/system/project',
    method: 'delete',
    response: ({ query }: { query: { id: string } }) => {
      const i = projects.findIndex((p) => p.id === query.id)
      if (i > -1) projects.splice(i, 1)
      return ok(null)
    },
  },
  { url: '/api/statistics/overview', method: 'get', response: () => ok(buildOverview(projects, issues)) },
] as MockMethod[]
```

- [ ] **Step 2: mock/issue.ts**

`mock/issue.ts`：

```ts
import type { MockMethod } from 'vite-plugin-mock'
import type { IssueItem } from '@/types'

const g = globalThis as { __fengtaiIssues?: IssueItem[] }
g.__fengtaiIssues ??= [
  { id: 'i1', nodeId: 'n1', projectId: 'p2', nodeName: '征地>草拟征地公告', dept: '规划实施科', description: '前期沟通时效，现面积核准有误，无法发布征地公告。标准不一致，影响项目进度。', status: 'solved', createTime: '2026-01-01 10:00:00' },
  { id: 'i2', nodeId: 'n2', projectId: 'p2', nodeName: '项目实施方案审批', dept: '规划实施科', description: '指标不一致，需统一项目指标，与规划相关部门确认。', status: 'partial', createTime: '2026-02-01 10:00:00' },
]
export const issues = g.__fengtaiIssues

const ok = (data: unknown) => ({ code: 0, message: 'ok', data })

export default [
  {
    url: '/api/issue/list',
    method: 'get',
    response: ({ query }: { query: { projectId?: string } }) =>
      ok(issues.filter((i) => !query.projectId || i.projectId === query.projectId)),
  },
  {
    url: '/api/issue',
    method: 'post',
    response: ({ body }: { body: Partial<IssueItem> }) => {
      issues.push({ id: `i${Date.now()}`, nodeId: body.nodeId ?? '', projectId: body.projectId ?? '', nodeName: body.nodeName ?? '', dept: body.dept ?? '', description: body.description ?? '', status: body.status ?? 'discuss', createTime: new Date().toLocaleString() })
      return ok(null)
    },
  },
  {
    url: '/api/issue',
    method: 'put',
    response: ({ body }: { body: IssueItem }) => {
      const i = issues.findIndex((x) => x.id === body.id)
      if (i > -1) issues[i] = { ...issues[i], ...body }
      return ok(null)
    },
  },
] as MockMethod[]
```

- [ ] **Step 3: mock/nodes.ts 升级（挂项目 + 填报记录）**

`mock/nodes.ts` 改造：
- 种子节点加 `projectId/step/date/status`（n1、n2 挂 p2 二级项目，step 1/2）
- `buildNodeMenuChildren` 不变（仍产出 /fill/{id} 菜单，带 fields）
- 新增 `fillRecords` 数组（globalThis）+ records 端点

```ts
const g = globalThis as { __fengtaiFillRecords?: FillRecordItem[] }
g.__fengtaiFillRecords ??= []
export const fillRecords = g.__fengtaiFillRecords
```

节点种子改为：

```ts
export const nodes: NodeItem[] = [
  {
    id: 'n1', projectId: 'p2', name: '台账填报', step: 1, sort: 1, status: 1, date: '2026-01-01',
    fields: [ /* 原 5 字段不变 */ ],
  },
  {
    id: 'n2', projectId: 'p2', name: '报表填报', step: 2, sort: 2, status: 1, date: '2026-02-01',
    fields: [ /* 原 3 字段不变 */ ],
  },
]
```

末尾追加 records 端点：

```ts
  // ---------- 填报记录（进展录入） ----------
  {
    url: '/api/node/:id/records',
    method: 'get',
    response: ({ params }: { params: { id: string } }) => ok(fillRecords.filter((r) => r.nodeId === params.id)),
  },
  {
    url: '/api/node/:id/records',
    method: 'post',
    response: ({ params, body }: { params: { id: string }; body: { projectId: string; values: Record<string, unknown> } }) => {
      fillRecords.push({ id: `r${Date.now()}`, nodeId: params.id, projectId: body.projectId ?? '', values: body.values ?? {}, createBy: 'demo', createTime: new Date().toLocaleString() })
      return ok(null)
    },
  },
  {
    url: '/api/node/:id/records/:rid',
    method: 'put',
    response: ({ params, body }: { params: { rid: string }; body: { values: Record<string, unknown> } }) => {
      const r = fillRecords.find((x) => x.id === params.rid)
      if (r) r.values = body.values
      return ok(null)
    },
  },
```

- [ ] **Step 4: 同步测试 + 新增统计测试**

`mock/nodes.test.ts`：自定义 NodeItem 数组补 `projectId/step`（如 `{ id:'x1', projectId:'p1', name:'启用节点', step:1, sort:1, status:1, fields:[] }`），断言不变。

`mock/project.test.ts`：

```ts
import { describe, expect, it } from 'vitest'
import { buildOverview } from './project'
import type { ProjectItem } from '@/types'

const projects: ProjectItem[] = [
  { id: 'p1', name: 'A', type: 'first', status: 1, createTime: '' },
  { id: 'p2', name: 'B', type: 'second', status: 1, createTime: '' },
  { id: 'p3', name: 'C', type: 'second', status: 2, createTime: '' },
]

describe('mock/project buildOverview', () => {
  it('聚合项目/问题统计', () => {
    const r = buildOverview(projects, [{ status: 'solved' }, { status: 'partial' }, { status: 'shelved' }])
    expect(r).toEqual({ totalProjects: 3, firstCount: 1, secondCount: 2, issueTotal: 3, issueSolved: 1, bizTotal: 500 })
  })
})
```

`mock/auth.test.ts`：若断言节点结构，补 projectId 即可（通常只断言标题/id，不受影响）。

- [ ] **Step 5: 全量测试 + build**

运行：`npm run test`（37 既有 + 新增）、`npm run build`。

- [ ] **Step 6: Commit**

```bash
git add mock
git commit -m "feat: mock 项目/填报记录/问题/统计数据"
```

---

### Task 3: PC 项目管理页 + 节点管理升级

**Files:**
- Create: `src/views/system/project/index.vue`
- Modify: `src/views/system/node/index.vue`

**Interfaces:**
- Consumes: project/node api（Task 1）、mock（Task 2）
- Produces: `/system/project` 页（项目 CRUD）；节点管理加 所属项目/步骤

- [ ] **Step 1: 项目管理页**

`src/views/system/project/index.vue`（仿节点管理页结构，字段：名称/分类(radio first/second)/建设单位/位置/用地/建筑面积/状态）：

```vue
<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createProject, deleteProject, getProjectList, updateProject } from '@/api/system'
import ProForm from '@/components/ProForm/index.vue'
import type { ProjectItem } from '@/types'

/** 项目列表数据 */
const list = ref<ProjectItem[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const form = reactive<Partial<ProjectItem>>({})

/** 加载项目列表 */
async function load() {
  loading.value = true
  try {
    list.value = await getProjectList()
  } finally {
    loading.value = false
  }
}

/** 打开新增项目弹窗 */
function openAdd() {
  isEdit.value = false
  Object.assign(form, { name: '', type: 'second', status: 1 })
  dialogVisible.value = true
}

/** 打开编辑项目弹窗，回填数据 */
function openEdit(row: ProjectItem) {
  isEdit.value = true
  Object.assign(form, { ...row })
  dialogVisible.value = true
}

/** 新增/编辑提交 */
async function handleSubmit(values: Record<string, unknown>) {
  if (isEdit.value) await updateProject({ ...(form as ProjectItem), ...values } as ProjectItem)
  else await createProject(values as Partial<ProjectItem>)
  load()
}

/** 删除项目 */
async function handleDelete(row: ProjectItem) {
  await ElMessageBox.confirm(`确定删除项目「${row.name}」？`, '提示', { type: 'warning' })
  await deleteProject(row.id)
  ElMessage.success('删除成功')
  load()
}

const typeLabel = { first: '一级开发', second: '二级开发' } as const

onMounted(load)
</script>

<template>
  <el-card>
    <div class="toolbar">
      <el-button v-perm="'system:project:add'" type="primary" @click="openAdd">新增项目</el-button>
    </div>

    <el-table v-loading="loading" :data="list" border>
      <el-table-column prop="name" label="项目名称" min-width="220" />
      <el-table-column label="分类" width="100">
        <template #default="{ row }">{{ typeLabel[row.type as keyof typeof typeLabel] ?? row.type }}</template>
      </el-table-column>
      <el-table-column prop="builder" label="建设单位" min-width="120" />
      <el-table-column prop="location" label="项目位置" min-width="140" />
      <el-table-column prop="landSize" label="用地规模" width="100" />
      <el-table-column prop="buildingSize" label="建筑面积" width="100" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '进行中' : '已完成' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150">
        <template #default="{ row }">
          <el-button v-perm="'system:project:edit'" type="primary" link @click="openEdit(row)">编辑</el-button>
          <el-button v-perm="'system:project:delete'" type="danger" link @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <ProForm
      v-model="dialogVisible"
      :title="isEdit ? '编辑项目' : '新增项目'"
      :initial-values="form as Record<string, unknown>"
      :submit-api="handleSubmit"
      :fields="[
        { prop: 'name', label: '项目名称', rules: [{ required: true, message: '请输入项目名称', trigger: 'blur' }] },
        { prop: 'type', label: '分类', type: 'radio', options: [{ label: '一级开发', value: 'first' }, { label: '二级开发', value: 'second' }] },
        { prop: 'builder', label: '建设单位' },
        { prop: 'location', label: '项目位置' },
        { prop: 'landSize', label: '用地规模', type: 'number' },
        { prop: 'buildingSize', label: '建筑面积', type: 'number' },
      ]"
    />
  </el-card>
</template>

<style scoped>
.toolbar {
  margin-bottom: 12px;
}
</style>
```

- [ ] **Step 2: 节点管理升级（所属项目 + 步骤）**

`src/views/system/node/index.vue`：
- script 加 `projects` 列表（onMounted 并行加载 getProjectList）+ `projectName(id)` 查找函数
- 表格加"所属项目"列（`projectName(row.projectId)`）与"步骤"列
- 新增/编辑 ProForm fields 增加：
  ```ts
  { prop: 'projectId', label: '所属项目', type: 'select', options: projects.map((p) => ({ label: p.name, value: p.id })) },
  { prop: 'step', label: '步骤', type: 'number' },
  ```
- `openAdd` 默认值补 `projectId: ''`、`step: 1`

- [ ] **Step 3: dev 验证 + Commit**

运行 `npm run dev`，admin 登录：系统管理 → 项目管理（列表/新增/编辑/删除）；节点管理 → 台账填报显示 所属项目=公交首末站、步骤=1。杀掉 dev。

```bash
git add src/views/system
git commit -m "feat: PC 项目管理页与节点管理升级"
```

---

### Task 4: 移动端 TabBar 4-tab + 首页项目查询

**Files:**
- Modify: `mobile/src/router/index.ts`、`mobile/src/layouts/MainTab.vue`
- Create: `mobile/src/stores/project.ts`、`mobile/src/views/home/index.vue`、`mobile/src/views/progress/index.vue`、`mobile/src/views/monitor/index.vue`（占位，Task 6 填充）
- Delete: `mobile/src/views/fill/index.vue`、`mobile/src/views/fill/detail.vue`

**Interfaces:**
- Produces: 4-tab 路由 + 首页项目查询

- [ ] **Step 1: 路由 4-tab**

`mobile/src/router/index.ts`：

```ts
import { createRouter, createWebHistory } from 'vue-router'
import MainTab from '@/layouts/MainTab.vue'
import { getToken } from '@shared/utils/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: () => import('@/views/login/index.vue') },
    {
      path: '/',
      component: MainTab,
      redirect: '/home',
      children: [
        { path: 'home', name: 'home', component: () => import('@/views/home/index.vue') },
        { path: 'monitor', name: 'monitor', component: () => import('@/views/monitor/index.vue') },
        { path: 'profile', name: 'profile', component: () => import('@/views/profile/index.vue') },
        { path: 'password', name: 'password', component: () => import('@/views/password/index.vue') },
        { path: 'progress', name: 'progress', component: () => import('@/views/progress/index.vue') },
        { path: 'project/:id', name: 'project-detail', component: () => import('@/views/project/detail.vue') },
        { path: 'project/:id/node/:nodeId', name: 'node-fill', component: () => import('@/views/project/node-fill.vue') },
      ],
    },
  ],
})

router.beforeEach((to) => {
  if (!getToken() && to.path !== '/login') return { path: '/login', query: { redirect: to.fullPath } }
  if (getToken() && to.path === '/login') return { path: '/' }
  return true
})

export default router
```

- [ ] **Step 2: MainTab 4-tab**

`mobile/src/layouts/MainTab.vue`：

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const active = computed(() => {
  if (route.path.startsWith('/monitor')) return 'monitor'
  if (route.path.startsWith('/progress')) return 'progress'
  if (route.path.startsWith('/profile') || route.path.startsWith('/password')) return 'profile'
  return 'home'
})
</script>

<template>
  <div class="main-tab">
    <router-view />
    <van-tabbar :model-value="active" route>
      <van-tabbar-item name="home" to="/home" icon="apps-o">首页</van-tabbar-item>
      <van-tabbar-item name="monitor" to="/monitor" icon="bar-chart-o">监测</van-tabbar-item>
      <van-tabbar-item name="profile" to="/profile" icon="user-o">我的</van-tabbar-item>
      <van-tabbar-item name="progress" to="/progress" icon="clock-o">进度</van-tabbar-item>
    </van-tabbar>
  </div>
</template>
```

- [ ] **Step 3: 项目 store + 首页项目查询**

`mobile/src/stores/project.ts`：

```ts
import { defineStore } from 'pinia'
import { getProjectList } from '@shared/api/system'
import type { ProjectItem } from '@shared/types'

/** 项目 store */
export const useProjectStore = defineStore('project', {
  state: () => ({ projects: [] as ProjectItem[] }),
  actions: {
    async loadProjects() {
      this.projects = await getProjectList()
    },
  },
})
```

`mobile/src/views/home/index.vue`（首页项目查询：筛选 + 搜索 + 卡片列表）：

```vue
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useProjectStore } from '@/stores/project'

const projectStore = useProjectStore()
const router = useRouter()
const loading = ref(false)
const keyword = ref('')
const filterType = ref('')

const typeLabel = { first: '一级开发', second: '二级开发' } as const

const filtered = computed(() =>
  projectStore.projects.filter(
    (p) =>
      (!filterType.value || p.type === filterType.value) &&
      (!keyword.value || p.name.includes(keyword.value) || (p.builder ?? '').includes(keyword.value)),
  ),
)

onMounted(async () => {
  loading.value = true
  try {
    await projectStore.loadProjects()
  } catch {
    showToast('加载失败')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="home">
    <van-nav-bar title="丰台区项目全周期跟踪平台" />
    <van-search v-model="keyword" placeholder="搜索项目/建设单位" />
    <van-dropdown-menu>
      <van-dropdown-item v-model="filterType" :options="[
        { text: '全部', value: '' },
        { text: '一级开发', value: 'first' },
        { text: '二级开发', value: 'second' },
      ]" />
    </van-dropdown-menu>

    <van-loading v-if="loading" class="page-loading">加载中...</van-loading>
    <van-empty v-else-if="!filtered.length" description="暂无项目" />
    <van-cell-group v-else inset>
      <van-cell
        v-for="p in filtered"
        :key="p.id"
        :title="p.name"
        :label="`${typeLabel[p.type as keyof typeof typeLabel] ?? p.type} · ${p.location ?? ''}\n用地 ${p.landSize ?? '-'} · 建面 ${p.buildingSize ?? '-'}`"
        is-link
        @click="router.push(`/project/${p.id}`)"
      >
        <template #value>
          <van-tag :type="p.status === 1 ? 'primary' : 'default'">{{ p.status === 1 ? '进行中' : '已完成' }}</van-tag>
        </template>
      </van-cell>
    </van-cell-group>
  </div>
</template>
```

`mobile/src/views/progress/index.vue`（进度：复用项目列表，简化展示我的项目）：

```vue
<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectStore } from '@/stores/project'

const projectStore = useProjectStore()
const router = useRouter()

onMounted(async () => {
  await projectStore.loadProjects()
})
</script>

<template>
  <div class="progress">
    <van-nav-bar title="项目进度" />
    <van-cell-group inset>
      <van-cell
        v-for="p in projectStore.projects"
        :key="p.id"
        :title="p.name"
        :label="p.status === 1 ? '进行中' : '已完成'"
        is-link
        @click="router.push(`/project/${p.id}`)"
      />
    </van-cell-group>
  </div>
</template>
```

`mobile/src/views/monitor/index.vue`：占位 `<template><div>监测</div></template>`（Task 6 填充）。

删除 `mobile/src/views/fill/index.vue` 与 `fill/detail.vue`；`mobile/src/stores/fill.ts` 保留（Task 5 改造）。

- [ ] **Step 4: dev 验证**

运行 `cd mobile && npm run dev`：登录 user → 底部 4-tab；首页显示 2 个项目卡片 + 筛选/搜索；进度页列表。杀掉 dev。

- [ ] **Step 5: Commit**

```bash
git add mobile/src
git commit -m "feat: 移动端 4-tab 与首页项目查询"
```

---

### Task 5: 移动端项目详情 + 节点填报（记录+编辑）

**Files:**
- Modify: `mobile/src/stores/fill.ts`
- Create: `mobile/src/views/project/detail.vue`、`mobile/src/views/project/node-fill.vue`

**Interfaces:**
- Consumes: `getNodeRecords/createFillRecord/updateFillRecord`、fill store（getMe 节点）
- Produces: 项目详情（流程节点列表）+ 节点填报（记录列表 + 新增/编辑动态表单）

- [ ] **Step 1: fill store 改造（按项目过滤节点）**

`mobile/src/stores/fill.ts`：

```ts
import { defineStore } from 'pinia'
import { getMe } from '@shared/api/auth'
import type { MenuNode } from '@shared/types'

/** 填报 store：从 /auth/me 菜单筛出业务填报节点（含 fields），保留 RBAC 可见性 */
export const useFillStore = defineStore('fill', {
  state: () => ({ nodes: [] as MenuNode[] }),
  actions: {
    async loadNodes() {
      const { menus } = await getMe()
      this.nodes = menus.find((m) => m.children?.some((c) => c.fields))?.children ?? []
    },
  },
})
```

注意：MenuNode 是菜单节点（含 id/title/fields），但节点详情需要 projectId/step/status/date——这些在 /auth/me 菜单里不带。方案：项目详情用 `/auth/me` 菜单筛出可见节点（保 RBAC），同时用 `getNodeList` 拿节点元数据（projectId/step）合并。但当前 mock 没有 `GET /api/node/list?projectId=`。Task 2 的节点端点只有 records；`/api/system/node/list` 已有（PC 节点管理用，返回全部节点含 projectId/step）。移动端项目详情可调 `/api/system/node/list`（shared getNodeList）→ 按 projectId 过滤 → 与可见菜单节点交集（保 RBAC）。

简化方案：项目详情里节点 = `getNodeList()` 按 projectId 过滤，再与 fill store 可见节点（getMe 菜单）取交集。这保留 RBAC 且拿到 projectId/step。

```ts
// project/detail.vue
const allNodes = await getNodeList()            // 全部节点元数据
const visibleIds = new Set(fillStore.nodes.map((n) => n.id))  // 角色可见
const nodes = allNodes
  .filter((n) => n.projectId === projectId && visibleIds.has(n.id))
  .sort((a, b) => a.step - b.step)
```

- [ ] **Step 2: 项目详情页**

`mobile/src/views/project/detail.vue`：

```vue
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { getNodeList } from '@shared/api/system'
import { useFillStore } from '@/stores/fill'
import type { NodeItem } from '@shared/types'

const route = useRoute()
const router = useRouter()
const fillStore = useFillStore()
const projectId = route.params.id as string

const allNodes = ref<NodeItem[]>([])
const loading = ref(false)

/** 流程节点：getNodeList 按项目过滤 ∩ 角色可见节点，按 step 排序 */
const nodes = computed(() => {
  const visible = new Set(fillStore.nodes.map((n) => n.id))
  return allNodes.value
    .filter((n) => n.projectId === projectId && visible.has(n.id))
    .sort((a, b) => a.step - b.step)
})

onMounted(async () => {
  loading.value = true
  try {
    if (!fillStore.nodes.length) await fillStore.loadNodes()
    allNodes.value = await getNodeList()
  } catch {
    showToast('加载失败')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="project-detail">
    <van-nav-bar title="项目流程" left-arrow @click-left="router.back()" />
    <van-loading v-if="loading" class="page-loading">加载中...</van-loading>
    <van-empty v-else-if="!nodes.length" description="暂无流程节点" />
    <van-cell-group v-else inset>
      <van-cell
        v-for="n in nodes"
        :key="n.id"
        :title="`${n.step}. ${n.name}`"
        :label="`${n.date ?? ''} · ${n.status === 1 ? '进行中' : '已完成'}`"
        is-link
        @click="router.push(`/project/${projectId}/node/${n.id}`)"
      />
    </van-cell-group>
  </div>
</template>
```

- [ ] **Step 3: 节点填报页（记录 + 新增/编辑）**

`mobile/src/views/project/node-fill.vue`：

```vue
<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showConfirmDialog, showSuccessToast, showToast } from 'vant'
import { createFillRecord, getNodeList, getNodeRecords, updateFillRecord } from '@shared/api/system'
import { toVantFields, type VantField } from '@/utils/toVantFields'
import type { FillRecordItem } from '@shared/types'

const route = useRoute()
const router = useRouter()
const projectId = route.params.id as string
const nodeId = route.params.nodeId as string

const node = ref<{ name: string; fields: VantField[]; projectId: string } | null>(null)
const records = ref<FillRecordItem[]>([])
const loading = ref(false)
const showForm = ref(false)
const editingId = ref('')
const form = reactive<Record<string, unknown>>({})

const pickerVisible = ref(false)
const activeField = ref<VantField | null>(null)
const calendarVisible = ref(false)

/** 加载节点配置 + 填报记录 */
async function load() {
  loading.value = true
  try {
    const nodes = await getNodeList()
    const n = nodes.find((x) => x.id === nodeId)
    node.value = n ? { name: n.name, fields: toVantFields(n.fields), projectId: n.projectId } : null
    records.value = await getNodeRecords(nodeId)
  } catch {
    showToast('加载失败')
  } finally {
    loading.value = false
  }
}

/** 打开新增填报表单 */
function openAdd() {
  editingId.value = ''
  Object.keys(form).forEach((k) => delete form[k])
  showForm.value = true
}

/** 打开编辑填报表单，回填记录 */
function openEdit(r: FillRecordItem) {
  editingId.value = r.id
  Object.keys(form).forEach((k) => delete form[k])
  Object.assign(form, r.values)
  showForm.value = true
}

/** 提交新增/编辑填报 */
async function submit() {
  if (!node.value) return
  for (const f of node.value.fields) {
    if (f.required && (form[f.prop] === undefined || form[f.prop] === '')) {
      showToast(`请填写${f.label}`)
      return
    }
  }
  try {
    if (editingId.value) {
      await updateFillRecord(nodeId, editingId.value, { ...form })
    } else {
      await createFillRecord({ nodeId, projectId: node.value.projectId, values: { ...form } })
    }
    showSuccessToast('保存成功')
    showForm.value = false
    await load()
  } catch {
    // 错误已提示
  }
}

/** 删除填报记录（本期提供删除） */
async function removeRecord(r: FillRecordItem) {
  await showConfirmDialog({ title: '提示', message: '确定删除这条填报记录？' })
  // mock 未提供 delete 端点，本期暂不实现删除（仅前端确认占位）
  showToast('删除功能待接入')
}

function openPicker(field: VantField) {
  activeField.value = field
  pickerVisible.value = true
}
function onPickerConfirm({ selectedOptions }: { selectedOptions: { text: string; value: string }[] }) {
  if (activeField.value) form[activeField.value.prop] = selectedOptions[0]?.value ?? ''
  pickerVisible.value = false
}
function openDate(field: VantField) {
  activeField.value = field
  calendarVisible.value = true
}
function onCalendarConfirm(value: Date) {
  if (activeField.value) {
    const y = value.getFullYear()
    const m = String(value.getMonth() + 1).padStart(2, '0')
    const d = String(value.getDate()).padStart(2, '0')
    form[activeField.value.prop] = `${y}-${m}-${d}`
  }
  calendarVisible.value = false
}

onMounted(load)
</script>

<template>
  <div class="node-fill">
    <van-nav-bar :title="node?.name ?? '填报'" left-arrow @click-left="router.back()" />

    <van-loading v-if="loading" class="page-loading">加载中...</van-loading>
    <template v-else-if="node">
      <!-- 记录列表 -->
      <div class="record-toolbar">
        <van-button size="small" round type="primary" @click="openAdd">新增填报</van-button>
      </div>
      <van-empty v-if="!records.length" description="暂无填报记录" />
      <van-cell-group v-else inset>
        <van-cell
          v-for="r in records"
          :key="r.id"
          :title="`${r.createTime} · ${r.createBy}`"
          :label="Object.entries(r.values).map(([k, v]) => `${k}: ${v}`).join('；')"
          is-link
          @click="openEdit(r)"
        />
      </van-cell-group>

      <!-- 填报弹窗 -->
      <van-popup v-model:show="showForm" position="bottom" round style="height: 80%">
        <van-nav-bar :title="editingId ? '编辑填报' : '新增填报'" @click-left="showForm = false" />
        <van-form @submit="submit">
          <van-cell-group inset>
            <template v-for="field in node.fields" :key="field.prop">
              <van-field
                v-if="field.type === 'input' || field.type === 'number'"
                v-model="form[field.prop]"
                :name="field.prop"
                :label="field.label"
                :type="field.type === 'number' ? 'number' : 'text'"
                :placeholder="field.placeholder"
              />
              <van-field
                v-else-if="field.type === 'textarea'"
                v-model="form[field.prop]"
                :name="field.prop"
                :label="field.label"
                type="textarea"
                rows="3"
                autosize
                :placeholder="field.placeholder"
              />
              <van-field
                v-else-if="field.type === 'select'"
                :model-value="String(form[field.prop] ?? '')"
                :name="field.prop"
                :label="field.label"
                is-link
                readonly
                :placeholder="field.placeholder"
                @click="openPicker(field)"
              />
              <van-field
                v-else-if="field.type === 'date'"
                :model-value="String(form[field.prop] ?? '')"
                :name="field.prop"
                :label="field.label"
                is-link
                readonly
                :placeholder="field.placeholder"
                @click="openDate(field)"
              />
              <van-field v-else-if="field.type === 'radio'" :name="field.prop" :label="field.label">
                <template #input>
                  <van-radio-group v-model="form[field.prop]">
                    <van-radio v-for="o in field.options ?? []" :key="o.value" :name="o.value">{{ o.label }}</van-radio>
                  </van-radio-group>
                </template>
              </van-field>
            </template>
          </van-cell-group>
          <div style="margin: 16px">
            <van-button round block type="primary" native-type="submit">保存</van-button>
          </div>
        </van-form>
      </van-popup>

      <van-popup v-model:show="pickerVisible" position="bottom">
        <van-picker
          :columns="(activeField?.options ?? []).map((o) => ({ text: o.label, value: o.value }))"
          @confirm="onPickerConfirm"
          @cancel="pickerVisible = false"
        />
      </van-popup>
      <van-popup v-model:show="calendarVisible" position="bottom">
        <van-calendar
          :poppable="false"
          :min-date="new Date(2000, 0, 1)"
          :max-date="new Date(2100, 11, 31)"
          @confirm="onCalendarConfirm"
        />
      </van-popup>
    </template>
  </div>
</template>

<style scoped>
.record-toolbar {
  margin: 12px 16px;
  text-align: right;
}
</style>
```

- [ ] **Step 4: 移除旧填报入口 + 清理**

- 删除 `mobile/src/views/fill/` 目录（旧填报列表/详情已被 home/project-detail/node-fill 取代）
- `shared/api/system.ts` 移除 `submitNodeData`（已无引用）

- [ ] **Step 5: dev 验证 + Commit**

运行 `cd mobile && npm run dev`：登录 user → 首页 → 项目详情（节点流程列表）→ 台账填报（新增填报 → 表单 → 保存 → 记录列表出现 → 点记录编辑 → 保存更新）。杀掉 dev。PC 侧跑 `npm run test`（37）+ build。

```bash
git add mobile/src shared/api src/views/fill 2>/dev/null; git add -A mobile shared
git commit -m "feat: 移动端项目详情与进展填报记录"
```

---

### Task 6: 移动端问题上报 + 监测页

**Files:**
- Create: `mobile/src/views/project/issues.vue`（问题列表 + 上报弹窗）、`mobile/src/views/monitor/index.vue`（统计）
- Modify: `mobile/src/views/project/detail.vue`（加问题入口）

**Interfaces:**
- Consumes: `getIssueList/createIssue/updateIssue/getStatisticsOverview`
- Produces: 问题闭环 + 监测统计页

- [ ] **Step 1: 问题页（列表 + 上报 + 状态更新）**

`mobile/src/views/project/issues.vue`：

```vue
<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showSuccessToast, showToast } from 'vant'
import { createIssue, getIssueList, updateIssue } from '@shared/api/system'
import type { IssueItem, IssueStatus } from '@shared/types'

const route = useRoute()
const router = useRouter()
const projectId = route.params.id as string
const nodeId = (route.query.nodeId as string) ?? ''
const nodeName = (route.query.nodeName as string) ?? ''

const list = ref<IssueItem[]>([])
const loading = ref(false)
const showForm = ref(false)
const form = reactive({ dept: '', description: '', status: 'discuss' as IssueStatus })

const statusLabel: Record<IssueStatus, string> = {
  solved: '已解决', partial: '部分解决', discuss: '再商议', shelved: '搁置',
}
const statusTag: Record<IssueStatus, 'success' | 'warning' | 'primary' | 'default'> = {
  solved: 'success', partial: 'warning', discuss: 'primary', shelved: 'default',
}

async function load() {
  loading.value = true
  try {
    list.value = await getIssueList(projectId)
  } finally {
    loading.value = false
  }
}

/** 打开上报弹窗 */
function openAdd() {
  Object.assign(form, { dept: '', description: '', status: 'discuss' })
  showForm.value = true
}

/** 提交问题 */
async function submit() {
  if (!form.description.trim()) {
    showToast('请填写问题描述')
    return
  }
  try {
    await createIssue({
      projectId,
      nodeId,
      nodeName,
      dept: form.dept || '规划实施科',
      description: form.description,
      status: form.status,
    })
    showSuccessToast('上报成功')
    showForm.value = false
    await load()
  } catch {
    // 错误已提示
  }
}

/** 更新解决状态 */
async function updateStatus(item: IssueItem, status: IssueStatus) {
  await updateIssue({ ...item, status })
  await load()
}

onMounted(load)
</script>

<template>
  <div class="issues">
    <van-nav-bar title="问题协助记录" left-arrow @click-left="router.back()">
      <template #right>
        <van-button size="small" type="primary" @click="openAdd">上报问题</van-button>
      </template>
    </van-nav-bar>

    <van-loading v-if="loading" class="page-loading">加载中...</van-loading>
    <van-empty v-else-if="!list.length" description="暂无问题" />
    <van-cell-group v-else inset>
      <van-cell
        v-for="item in list"
        :key="item.id"
        :title="item.nodeName"
        :label="`${item.dept} · ${item.createTime}\n${item.description}`"
      >
        <template #value>
          <van-tag :type="statusTag[item.status]">{{ statusLabel[item.status] }}</van-tag>
        </template>
      </van-cell>
    </van-cell-group>

    <van-popup v-model:show="showForm" position="bottom" round style="height: 60%">
      <van-nav-bar title="上报问题" @click-left="showForm = false" />
      <van-form @submit="submit">
        <van-cell-group inset>
          <van-field v-model="form.dept" label="提出部门" placeholder="请输入部门" />
          <van-field v-model="form.description" label="问题描述" type="textarea" rows="4" autosize placeholder="请输入问题描述" />
        </van-cell-group>
        <div style="margin: 16px">
          <van-button round block type="primary" native-type="submit">提交</van-button>
        </div>
      </van-form>
    </van-popup>
  </div>
</template>
```

- [ ] **Step 2: 监测统计页**

`mobile/src/views/monitor/index.vue`：

```vue
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { showToast } from 'vant'
import { getStatisticsOverview } from '@shared/api/system'
import type { StatisticsOverview } from '@shared/types'

const stat = ref<StatisticsOverview | null>(null)
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    stat.value = await getStatisticsOverview()
  } catch {
    showToast('加载失败')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="monitor">
    <van-nav-bar title="项目监测" />
    <van-loading v-if="loading" class="page-loading">加载中...</van-loading>
    <template v-else-if="stat">
      <van-grid :column-num="3" :border="false">
        <van-grid-item icon="records-o" :text="`项目 ${stat.totalProjects}`" />
        <van-grid-item icon="label-o" :text="`一级 ${stat.firstCount}`" />
        <van-grid-item icon="label-o" :text="`二级 ${stat.secondCount}`" />
        <van-grid-item icon="warning-o" :text="`问题 ${stat.issueTotal}`" />
        <van-grid-item icon="success" :text="`已解决 ${stat.issueSolved}`" />
        <van-grid-item icon="chart-trending-o" :text="`业务量 ${stat.bizTotal}`" />
      </van-grid>
    </template>
  </div>
</template>
```

- [ ] **Step 3: 项目详情加问题入口**

`mobile/src/views/project/detail.vue` 底部加按钮：

```vue
<div style="margin: 16px">
  <van-button round block plain type="warning" @click="router.push(`/project/${projectId}/issues`)">问题协助记录</van-button>
</div>
```

路由加 `{ path: 'project/:id/issues', name: 'project-issues', component: () => import('@/views/project/issues.vue') }`。

- [ ] **Step 4: dev 验证 + Commit**

运行 `cd mobile && npm run dev`：登录 user → 首页 → 项目详情 → 问题协助记录（看到 2 条种子问题、状态 tag）→ 上报新问题 → 列表出现；监测页显示统计卡。杀掉 dev。

```bash
git add mobile/src
git commit -m "feat: 移动端问题上报与监测统计"
```

---

### Task 7: 端到端验证 + 文档更新

**Files:**
- Modify: `README.md`、`docs/business/2026-08-20-fengtai-mobile-prototype-requirements.md`（状态标注）

**Interfaces:**
- Consumes: 全部完成功能

- [ ] **Step 1: 全量测试 + build**

PC：`npm run test`（37+）、`npm run build`；移动端：`cd mobile && npm run test`（2）、`npm run build`。

- [ ] **Step 2: 端到端验证（单进程 mock）**

1. PC admin：项目管理新增项目 → 节点管理把新节点挂项目（选 projectId + step）
2. 移动端 user：首页看到项目 → 详情节点 → 新增填报 → 记录列表 → 编辑 → 问题上报 → 监测数字变化（问题数 +1）
3. RBAC：user 只看到分配节点（fill store 从 getMe 过滤）
4. 验证后重启 dev 恢复种子

- [ ] **Step 3: 文档更新**

`README.md` 功能模块表更新：系统管理（部门/角色/用户/**项目**/节点管理）、业务填报 → **项目全周期（项目/流程节点/进展填报/问题/监测）**。
需求文档 `docs/business/...` 状态加"已进入实现"。

- [ ] **Step 4: Commit**

```bash
git add README.md docs/business
git commit -m "docs: README 与需求文档更新至项目全周期功能"
```

---

## Self-Review

**1. Spec 覆盖检查：**

| Spec 要求 | 对应 Task |
|---|---|
| 数据模型扩展（Project/Node 升级/Record/Issue/Statistics） | Task 1 |
| 接口层扩展 | Task 1 |
| mock（项目/节点/记录/问题/统计） | Task 2 |
| PC 项目管理页 + 节点管理升级 | Task 3 |
| 移动端 4-tab + 首页项目查询 | Task 4 |
| 项目详情（流程节点）+ 节点填报（记录+编辑） | Task 5 |
| 问题上报 + 监测 | Task 6 |
| 端到端 + 文档 | Task 7 |

**2. 占位符扫描：** 无 TBD/TODO；每任务有完整代码。

**3. 类型一致性：**
- `NodeItem` 新字段在 types、mock 种子、PC 节点页、移动端统一。
- `createFillRecord({nodeId,projectId,values})` / `updateFillRecord(nodeId,rid,values)` 与 mock 端点参数一致。
- `buildOverview(projects, issues, bizTotal?)` 纯函数签名与 statistics 端点一致。
- `toVantFields` 复用（node-fill 用 `toVantFields(n.fields)`）。

**已知待办（非计划缺陷）：**
- 填报记录"删除"本期仅前端占位（mock 未加 delete 端点；需要时补 `/api/node/:id/records/:rid` DELETE）。
- 移动端节点列表 = getNodeList 按项目过滤 ∩ 角色可见节点（RBAC 保留），比原"仅菜单"多一次请求。
- 项目详情流程用纵向列表（原型是横排图），后续可加图。
- 移动端监测/进度为简化版；原型的同比/环比/供地分布未做（mock 数据不足）。
- `submitNodeData` 在 Task 5 移除（先保留至 Task 5 防中间破坏）。
