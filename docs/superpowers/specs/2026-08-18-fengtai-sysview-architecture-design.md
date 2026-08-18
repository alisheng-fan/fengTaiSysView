# fengtaiSysView 前端架构设计

- 日期：2026-08-18
- 状态：设计已确认，待实现
- 类型：企业级 RBAC 中后台（Vue 3）

## 1. 目标与范围

### 1.1 系统定位

一套企业级中后台系统，核心功能：

- 登录认证
- 部门 / 角色 / 用户管理（RBAC）
- 不同角色展示不同的左侧树菜单
- 不同菜单展示不同的表单页面
- 表单、表格、图表等常见功能

### 1.2 技术前提（已确认）

| 项 | 决定 |
|---|---|
| 语言 | TypeScript |
| UI 组件库 | Element Plus（按需导入） |
| 后端 | 未定，前端先行，用 Mock 模拟，接口层隔离以便后续切换 |

### 1.3 非目标

- 不做 SSR / SEO 支持（内部系统，无此需求）
- 不引入重型脚手架（如 vue-element-admin、vben 全量），避免继承无用代码
- 不实现与业务无关的通用能力（如国际化多语言，后续需要再评估）

## 2. 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 构建 | Vite + TypeScript | 启动快，配置简单 |
| 框架 | Vue 3（Composition API + `<script setup>`） | 主流写法 |
| 路由 | Vue Router 4 | 静态路由 + 权限动态路由 |
| 状态 | Pinia + persist | 存 token、用户信息、权限菜单，刷新不丢 |
| UI | Element Plus | 按需自动导入（unplugin-vue-components） |
| 请求 | Axios 封装 | 拦截器统一处理 token、错误、401 |
| 图表 | ECharts | 封装成通用图表组件 ChartBox |
| Mock | vite-plugin-mock | 前端先行，模拟登录 / 菜单 / CRUD |
| 规范 | ESLint + Prettier + husky + commitlint | 提交前自动检查 |

## 3. 核心设计原则

1. **分层清晰**：视图层（views）→ 状态层（stores）→ 接口层（api）。各层只依赖下一层，UI 里不直接发请求。
2. **权限驱动一切**：左侧菜单、动态路由、按钮显隐，全部由后端返回的权限数据驱动，前端不写死。
3. **接口层隔离**：后端未定，`api/` 目录按模块隔离，换后端只改这里 + 环境变量，不动业务代码。
4. **轻量不臃肿**：只装用得上的依赖，不夹带没用的示例页面。

## 4. 目录结构

```
fengtaiSysView/
├── .env.development / .env.production      # 环境变量（接口地址、标题等）
├── vite.config.ts                          # Vite 配置（插件、代理、别名）
├── mock/                                   # Mock 数据（登录、菜单、CRUD）
├── src/
│   ├── main.ts                             # 入口
│   ├── App.vue
│   ├── api/                                # ★ 接口层，按模块分文件，只此层碰 axios
│   │   ├── request.ts                      #   axios 实例 + 拦截器
│   │   ├── auth.ts                         #   登录 / 登出 / 获取用户信息
│   │   ├── user.ts                         #   用户、部门、角色 CRUD
│   │   └── ...
│   ├── router/                             # 路由
│   │   ├── index.ts                        #   静态路由（登录、404、布局）
│   │   └── dynamic.ts                      #   根据权限生成动态路由的工具
│   ├── stores/                             # Pinia
│   │   ├── user.ts                         #   token、用户信息
│   │   └── permission.ts                   #   菜单树、动态路由、按钮权限
│   ├── layouts/                            # 主布局
│   │   └── MainLayout/                     #   侧栏、顶栏、面包屑、多标签页
│   ├── views/                              # 页面（按业务模块分文件夹）
│   │   ├── login/
│   │   ├── dashboard/
│   │   ├── system/                         #   部门、角色、用户管理
│   │   │   ├── user/
│   │   │   ├── role/
│   │   │   └── dept/
│   │   └── ...
│   ├── components/                         # 通用组件
│   │   ├── ProTable/                       #   表格封装（分页、搜索、操作列）
│   │   ├── ProForm/                        #   表单封装（校验、弹窗）
│   │   └── ChartBox/                       #   ECharts 封装
│   ├── composables/                        # 组合式函数（usePagination 等）
│   ├── directives/                         # v-perm 按钮权限指令
│   ├── utils/                              # 工具（格式化、防抖等）
│   ├── styles/                             # 全局样式、CSS 变量、Element Plus 主题覆盖
│   └── types/                              # 全局 TS 类型（ApiResult、MenuItem 等）
└── ...
```

### 4.1 设计要点

- `api/` 是唯一碰 axios 的地方——"换后端只改这里"的关键。
- `stores/permission.ts` 是权限中枢：菜单树、动态路由、按钮权限三个数据都从它来。
- 页面按业务模块分组，各模块页面 + 私有组件放在自己的目录里。
- `ProTable` / `ProForm` 抽取高频逻辑，避免每个页面重复写分页、搜索、弹窗。

## 5. 权限体系（核心）

### 5.1 访问流程

```
用户访问页面
   ├─ 路由守卫：有 token？──没有──► 跳 /login
   ├─ 有 token，但权限菜单还没加载？
   │      └─ 调 /auth/me ──► 返回 { 用户信息, 角色, 菜单树, 按钮权限码 }
   │             ├─ 菜单树 ──► permission store ──► 生成侧栏树菜单
   │             ├─ 菜单树 ──► 转为动态路由 ──► router.addRoute() 注册
   │             └─ 按钮权限码 ──► v-perm 指令 / usePerm
   └─ 进入页面，正常渲染
```

### 5.2 登录与凭证

- 登录接口返回 token，存 Pinia + localStorage（刷新不丢）。
- axios 拦截器自动给请求头加 `Authorization: Bearer <token>`。
- **401** 统一处理：清空凭证 → 跳登录页。
- 路由守卫三种状态：
  - 未登录 → 去登录页
  - 已登录但权限未加载 → 拉取后再 `next({ ...to, replace: true })`
  - 已加载 → 放行

### 5.3 菜单数据模型（接口层契约）

```ts
interface MenuNode {
  id: string
  parentId: string | null
  name: string          // 路由 name
  path: string          // 路由路径，如 /system/user
  component: string     // 组件路径，如 system/user/index
  icon: string
  sort: number
  perms: string[]       // 按钮权限码，如 ['system:user:add']
  children?: MenuNode[]
}
```

- 后端返回什么角色能看什么菜单，前端只渲染、不判断权限归属，权限判断全在服务端。
- 动态路由用 `import.meta.glob('/src/views/**/*.vue')` 把 `component: 'system/user/index'` 映射到真实组件。

### 5.4 按钮级权限

- 后端返回的菜单节点带 `perms`（如 `system:user:add`）。
- `<el-button v-perm="'system:user:add'">新增</el-button>`——无权限时指令移除该元素。
- 提供 `usePerm()` composable，供 v-if / 逻辑判断场景使用。

### 5.5 系统管理模块

- 部门：树形表格。
- 角色：表格 + 分配权限（勾选菜单树与按钮权限）。
- 用户：表格 + 指派部门/角色。
- 权限配置在角色管理页保存后后端生效，前端无需感知。

## 6. 请求层 + Mock

### 6.1 统一响应约定

```ts
interface ApiResult<T> {
  code: number        // 0 = 成功，非 0 = 业务失败
  message: string
  data: T
}
```

- `api/request.ts` 拦截器只认这套结构：`code !== 0` 统一弹错误提示；`401` 清凭证跳登录。
- 页面代码只关心 `data`，不重复写 try/catch。

### 6.2 请求层职责

```
api/request.ts   →  axios 实例 + 拦截器（token、错误、401、loading）
api/auth.ts      →  login / logout / getMe
api/user.ts      →  用户、部门、角色 CRUD
api/xxx.ts       →  未来业务模块，一个模块一个文件
```

- 请求函数统一返回 `Promise<ApiResult<T>>`，页面不 import axios，只 import api 模块。
- 支持请求级 loading 开关、取消请求（AbortController）。

### 6.3 Mock 方案（vite-plugin-mock）

- `mock/` 下按模块建文件：`auth.ts`、`system.ts`、`user.ts` 等。
- 提供可登录的假数据：演示账号 `admin`（全部菜单权限）、`user`（部分权限），分别返回不同菜单树，用于验证动态菜单与权限差异。
- CRUD 用内存数组 + 延迟模拟真实接口。
- Mock 只在 dev 环境生效，切真实后端时关闭即可。

### 6.4 换后端动作清单

1. 改 `.env.development` 接口地址，配 Vite 代理（`server.proxy`）。
2. 关闭 Mock（一个开关）。
3. 按真实返回微调 `api/` 请求函数和类型。
4. 业务页面零改动。

## 7. 通用组件 + 工程化

### 7.1 高频封装组件

| 组件 | 解决什么 | 核心能力 |
|---|---|---|
| `ProTable` | 列表页重复的"搜索 + 表格 + 分页 + 加载 + 操作列" | 传列配置 + 搜索表单配置，自动发请求、分页、刷新；操作列插槽留给按钮 |
| `ProForm` | 新增/编辑弹窗表单重复 | 传字段配置 + 校验规则，自动出表单、校验、提交、重置 |
| `ChartBox` | ECharts 配置啰嗦、需要自适应 | 传 option 自动渲染，监听窗口 resize，统一空数据/加载态 |

- 配置驱动、可插槽：简单场景全配置，特殊场景用插槽插自定义内容。

### 7.2 工程化

- ESLint + Prettier：统一代码风格，保存即格式化。
- husky + lint-staged + commitlint：提交前自动 lint，commit message 规范（`feat:` / `fix:` 等）。
- 环境变量：`.env.development` / `.env.production`，区分接口地址、是否开 Mock、应用标题。
- 类型规范：接口返回类型集中在 `types/`，组件 props 全部写类型。
- 路径别名：`@/` 指向 `src/`。
- Element Plus 按需自动导入 + 图标统一管理，避免全量引入。

## 8. 首期交付范围

一个可运行的基座：

1. 登录页 + 鉴权流程跑通
2. 主布局（侧栏树菜单、顶栏、面包屑、多标签页）
3. 动态路由 + 按钮权限 + 两个演示账号验证权限差异
4. 仪表盘首页（含图表）
5. 系统管理三页：部门（树表）、角色（含分配权限）、用户（含指派角色）
6. ProTable / ProForm / ChartBox + Mock 全套
7. 工程化配置齐全

## 9. 测试策略

- 核心逻辑（权限守卫、动态路由生成、v-perm 指令、请求拦截器）以单测覆盖（Vitest）。
- 登录 → 不同角色菜单渲染 → 按钮权限 的端到端流程后续用 Playwright 覆盖（首期可延后）。
- 手动验证：用 `admin` / `user` 两个账号分别登录，确认菜单与按钮差异。

## 10. 风险与后续

- 后端接口契约（统一 `ApiResult`、菜单结构）需在接入真实后端时确认，接口层已隔离，改动面小。
- 国际化暂不做，后续需要时在布局与组件层预留（文案不散落到业务逻辑）。
- 多标签页、面包屑依赖路由 meta，动态路由生成时统一补充。
