# fengTaiSysView 节点管理与动态表单设计

- 日期：2026-08-19
- 状态：设计已确认，待实现
- 类型：架构扩展（在既有 RBAC 基座上新增节点管理与动态表单）

## 1. 目标与范围

### 1.1 系统定位

在既有基座（登录 / 布局 / 系统管理三页 / 权限体系）之上新增：

1. **节点管理**：管理员配置"填报节点"及其表单字段（动态字段配置）。
2. **动态填报**：按节点配置动态渲染填报表单页面；不同角色可见不同节点。
3. **修改密码**：系统管理内新增修改密码，所有角色可用。
4. **权限收紧**：非管理员在系统管理模块内**只能使用修改密码**。

### 1.2 已确认决策

| 项 | 决定 |
|---|---|
| 节点语义 | 现有系统页保留 + 新增可配置的填报节点（两者都要） |
| 填报数据流程 | 仅填报提交（不做数据列表/管理，后续需要再加） |
| 导航组织 | 新增顶级菜单"业务填报"，子菜单 = 角色可见的填报节点 |
| 字段下发 | 方案 A：节点字段配置随 /auth/me 菜单树一并下发，单个表单组件渲染所有节点 |
| 角色→节点 | 角色分配权限时勾选系统菜单 + 填报节点，统一 id 体系 |
| 非管理员 | 系统管理仅显示"修改密码" |

### 1.3 非目标

- 填报数据的查看/编辑/删除/审批（后续再评估）
- 表单布局（栅格/分组）配置（YAGNI）
- 字段类型扩展至上传/富文本（本期仅 input/textarea/number/select/date/radio）

## 2. 数据模型（src/types/index.ts）

```ts
/** 节点字段类型（填报表单控件） */
export type FieldType = 'input' | 'textarea' | 'number' | 'select' | 'date' | 'radio'

/** 一个字段的配置 */
export interface FieldConfig {
  prop: string          // 字段名（英文标识）
  label: string         // 显示名
  type: FieldType
  required?: boolean    // 是否必填
  options?: { label: string; value: string }[]  // select/radio 用
  placeholder?: string
}

/** 填报节点 */
export interface NodeItem {
  id: string
  name: string          // 节点名（同时作填报页标题、侧栏菜单名）
  sort: number
  status: number        // 1 启用 / 0 停用
  fields: FieldConfig[]
}

/** 修改密码请求 */
export interface ChangePasswordParams {
  oldPassword: string
  newPassword: string
}
```

**MenuNode 扩展**：增加可选 `fields?: FieldConfig[]`，供填报节点携带字段配置（方案 A）。

## 3. ProForm 扩展

现有控件 input/textarea/number/select，扩展：

- 新增 `date`（el-date-picker，value-format `YYYY-MM-DD`）
- 新增 `radio`（el-radio-group，选项来自 `options`）
- 新增 `dialog` prop（默认 `true`=弹窗外壳；`false`=只渲染表单本体，无弹窗），供填报页整页表单复用现有校验/提交逻辑

## 4. 节点管理页（系统管理 → 节点管理，`/system/node`）

页面 `src/views/system/node/index.vue`：

- 节点列表 el-table：名称 / 排序 / 状态(tag) / 字段数 / 操作（配置字段、编辑、删除）+ 顶部"新增节点"
- 新增/编辑节点：ProForm 弹窗（名称、排序、状态）
- 删除：ElMessageBox.confirm
- v-perm：`system:node:add` / `system:node:edit` / `system:node:delete` / `system:node:config`

### 字段配置编辑器（核心）

"配置字段"打开一个弹窗，内含**字段编辑表**：

| 列 | 控件 | 说明 |
|---|---|---|
| 标签 | el-input | 显示名 |
| 字段名 | el-input | prop，默认自动生成 `field_1`…，可改 |
| 类型 | el-select | 输入框/多行文本/数字/下拉/日期/单选 |
| 必填 | el-checkbox | required |
| 选项 | el-input textarea | 仅 select/radio 显示，每行一个选项 |
| 操作 | 删除按钮 | 移除该行 |

- "添加字段"按钮追加空行
- 保存 → `updateNode` 写入该节点的 `fields`

## 5. 填报页（业务填报 → 各节点）

- 单个通用组件 `src/views/fill/node.vue` 渲染所有节点
- 路由：每个节点一条字面路由 `/fill/{nodeId}`（复用 buildRoutes，path 来自菜单节点），component `fill/node`；`buildRoutes` 把节点 `id`/`title`/`fields` 带入路由 `meta.nodeId`/`meta.title`/`meta.fields`，填报组件从 meta 取
- 页面：卡片 + 标题（meta.title）+ `<ProForm :dialog="false" :fields="fields" :submit-api="submit" />`
- 字段转换：`FieldConfig[]` → ProForm `FormField[]`（label/prop/type/required→rules/options）
- 提交 → `POST /api/node/{meta.nodeId}/submit`（body 为表单数据）→ 成功提示 + 表单重置

## 6. 修改密码页（系统管理 → 修改密码，`/system/password`）

页面 `src/views/system/password/index.vue`：

- 表单：原密码 / 新密码 / 确认新密码
- 校验：新密码 ≠ 原密码、两次一致、新密码长度 ≥ 6
- 提交 → `PUT /api/auth/password { oldPassword, newPassword }`
- Mock：按 token 解析当前用户，校验原密码，更新
- 成功提示；所有角色可见（非管理员系统管理内仅此一项）

## 7. 权限联动

### 7.1 完整可分配树

mock 新增 `GET /api/system/menu/all`，返回完整可分配树：仪表盘 + 系统管理（节点管理/角色管理/用户管理/修改密码）+ 业务填报（全部启用节点）。角色管理"分配权限"树改用此数据源（替换现在直接 import 的 `mock/menus` 的 adminMenus）。

### 7.2 角色 menuIds 统一 id 体系

`RoleItem.menuIds` 现在同时包含系统菜单 id 与节点 id：

```
系统菜单：'1' 仪表盘, '2' 系统管理组, '21' 部门, '22' 角色, '23' 用户, '24' 节点管理, '25' 修改密码
业务填报组：'3'
节点：'n1'、'n2'（由 mock/nodes.ts 定义）
```

### 7.3 /auth/me 动态构建

`/auth/me` 由写死的 adminMenus/userMenus 改为：token → 用户 → 角色 → `role.menuIds` → 构建菜单树。

- 仪表盘：所有角色
- 系统管理：children = menuIds 中勾选的系统子节点（admin 全 4 项；user 仅 '25' 修改密码）
- 业务填报：children = menuIds 中勾选的节点（带 `fields`）

### 7.4 演示账号效果

| 账号 | 可见 |
|---|---|
| admin | 仪表盘 + 系统管理（节点管理/角色管理/用户管理/修改密码）+ 业务填报（全部节点） |
| user | 仪表盘 + 系统管理（仅修改密码）+ 业务填报（分配到的节点） |

## 8. Mock 改造

- 新增 `mock/nodes.ts`：
  - 内存数组 `nodes`（种子 2 个：台账填报 / 报表填报，各含不同 fields）
  - 节点 CRUD：`GET/POST/PUT/DELETE /api/system/node`
  - 填报提交：`POST /api/node/:id/submit`（仅接收，返回 ok）
- `mock/auth.ts`：
  - `/auth/me` 动态构建菜单树（按 role.menuIds 合并系统菜单与节点）
  - 新增 `PUT /api/auth/password`（校验原密码 → 更新）
- `mock/menus.ts`：系统管理补"节点管理(24)、修改密码(25)"子节点；新增"业务填报"顶级组（id '3'，component ''，children 由 /auth/me 填充）
- `mock/system.ts`：角色 seed 的 menuIds 更新（admin 全选、user 仅仪表盘+修改密码+某节点）

## 9. 首期交付范围

1. 数据模型 + ProForm 扩展（date/radio/dialog）
2. 节点管理页 + 字段配置编辑器 + 节点 CRUD mock
3. 填报页（动态表单渲染 + 提交）
4. 修改密码页 + mock 接口
5. /auth/me 动态菜单构建 + 完整可分配树接口 + 角色管理接入
6. 演示账号权限差异验证（admin 全量 / user 仅修改密码 + 分配节点）

## 10. 测试策略

- 单测（Vitest）：`/auth/me` 菜单树构建纯函数（按 menuIds 合并系统菜单与节点、带 fields）、`buildRoutes` 的 fields→meta、FieldConfig→FormField 转换
- 端到端手测：admin 配节点字段 → user 登录看到对应填报节点可填可提交 → user 系统管理仅修改密码 → 改密码后原密码失效

## 11. 风险与后续

- 字段配置随菜单下发（方案 A）：接真实后端时 `/auth/me` 需携带节点 fields，或填报页改为按 id 拉取（切换成本低）
- 填报数据仅提交不落库展示：后续需数据管理时加查询接口 + 数据页
- 字段编辑器为简版（每行编辑、无拖拽排序）：后续需要再加排序/分组
