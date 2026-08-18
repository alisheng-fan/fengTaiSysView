# fengtaiSysView 前端基座实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 从零搭建一套可运行的企业级 RBAC 中后台基座（登录、部门/角色/用户管理、动态菜单、表单/表格/图表）。

**Architecture:** 分层清晰的三层结构——视图层（`views/`）→ 状态层（`stores/`）→ 接口层（`api/`）。权限数据驱动：后端返回的菜单树生成动态路由、侧栏菜单和按钮权限。接口层隔离，Mock 只在 dev 生效，未来可直接切换真实后端。

**Tech Stack:** Vite 5 + Vue 3.5 + TypeScript + Pinia + Vue Router 4 + Element Plus（按需）+ Axios + ECharts + vite-plugin-mock + Vitest + ESLint/Prettier/husky/commitlint

**Spec:** [docs/superpowers/specs/2026-08-18-fengtai-sysview-architecture-design.md](../specs/2026-08-18-fengtai-sysview-architecture-design.md)（本计划从 spec 推导，执行者需同时阅读 spec 与本计划）

## Global Constraints

以下约束全局生效，所有任务隐式包含：

- **Vue 3 Composition API + `<script setup>`**；TypeScript 严格模式（`tsconfig` 默认开启 `strict`）。
- **接口统一返回 `ApiResult<T>`**：`{ code: number; message: string; data: T }`，`code === 0` 为成功。
- **`api/` 是唯一发请求的层**：页面和组件只 import api 模块，任何地方不得直接 `import axios`。
- **权限数据驱动**：菜单、路由、按钮显隐全部来自后端返回的 `MenuNode[]`，前端不写死任何菜单。
- **路径别名** `@/` → `src/`。
- **Vite 固定 5.x**（与 vite-plugin-mock、vitest@2 兼容）；Node >= 18。安装依赖用 `npm install`，如 npm 网络慢可配置 registry 镜像。
- **Mock 只在 dev 生效**：`.env.development` 中 `VITE_USE_MOCK=true`，生产为 `false`。
- **演示账号**：`admin / admin123`（全部菜单权限）、`user / user123`（部分权限）。
- **Element Plus 按需自动导入**（unplugin-vue-components + ElementPlusResolver）；程序化 API（ElMessage/ElMessageBox）样式由 `import 'element-plus/dist/index.css'` 兜底。
- **commit 规范**：conventional commits（`feat:` / `fix:` / `docs:` 等）；提交前 lint-staged 自动检查。
- **Spec 澄清（对设计文档的一处细化）**：`MenuNode` 增加 `title: string` 字段用于菜单显示（`name` 专作路由名），避免路由名用中文。
- **环境变量**：`VITE_API_BASE_URL`（接口前缀，dev 与 mock 均为 `/api`）、`VITE_APP_TITLE`（应用标题）、`VITE_USE_MOCK`（是否启用 mock）。

## 文件结构总览

| 文件 | 职责 |
|---|---|
| `package.json` | 依赖与脚本 |
| `vite.config.ts` | 插件、别名、mock、代理 |
| `vitest.config.ts` | 测试环境（jsdom） |
| `tsconfig.json` / `tsconfig.node.json` | TS 配置 |
| `eslint.config.js` / `.prettierrc` / `.husky/pre-commit` / `commitlint.config.js` | 工程化 |
| `.env.development` / `.env.production` | 环境变量 |
| `mock/auth.ts` / `mock/system.ts` / `mock/menus.ts` | Mock：登录鉴权 / CRUD / 菜单树数据 |
| `src/types/index.ts` | 全局类型（ApiResult、MenuNode、Dept/Role/User 等） |
| `src/utils/auth.ts` | token 读写（localStorage） |
| `src/api/request.ts` | axios 实例 + 拦截器（纯函数可单测） |
| `src/api/auth.ts` | login / logout / getMe |
| `src/api/system.ts` | 部门/角色/用户 CRUD |
| `src/router/index.ts` | 静态路由 + 全局守卫 |
| `src/router/dynamic.ts` | 菜单树 → 动态路由（纯函数可单测） |
| `src/stores/user.ts` | token、用户信息、登录/登出 |
| `src/stores/permission.ts` | 菜单、权限码、动态路由 |
| `src/layouts/MainLayout/index.vue` + 子组件 | 侧栏/顶栏/面包屑/多标签页 |
| `src/views/login/index.vue` | 登录页 |
| `src/views/error/404.vue` | 404 |
| `src/views/dashboard/index.vue` | 仪表盘 |
| `src/views/system/{dept,role,user}/index.vue` | 系统管理三页 |
| `src/components/ProTable/` | 表格封装 |
| `src/components/ProForm/` | 表单封装 |
| `src/components/ChartBox/index.vue` | ECharts 封装 |
| `src/composables/usePerm.ts` | 按钮权限逻辑判断 |
| `src/directives/perm.ts` | v-perm 指令 |
| `src/styles/index.scss` | 全局样式 |
| `src/vite-env.d.ts` | 环境变量类型 |

---

### Task 1: 工程化脚手架

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `tsconfig.json`, `tsconfig.node.json`
- Create: `index.html`, `src/main.ts`, `src/App.vue`, `src/vite-env.d.ts`
- Create: `eslint.config.js`, `.prettierrc`, `.prettierignore`, `commitlint.config.js`, `.husky/pre-commit`, `.husky/commit-msg`
- Create: `.env.development`, `.env.production`
- Create: `src/styles/index.scss`

**Interfaces:**
- Consumes: 无（空仓库）
- Produces: 可安装依赖、可跑 `dev`/`build`/`lint`/`test` 的工程骨架；`@/` 别名生效

- [ ] **Step 1: 写 package.json**

```json
{
  "name": "fengtai-sys-view",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "test": "vitest run",
    "test:watch": "vitest",
    "prepare": "husky"
  },
  "dependencies": {
    "@element-plus/icons-vue": "^2.3.1",
    "axios": "^1.7.7",
    "echarts": "^5.5.1",
    "element-plus": "^2.8.4",
    "pinia": "^2.2.4",
    "vue": "^3.5.12",
    "vue-router": "^4.4.5"
  },
  "devDependencies": {
    "@commitlint/cli": "^19.5.0",
    "@commitlint/config-conventional": "^19.5.0",
    "@eslint/js": "^9.13.0",
    "@types/node": "^20.16.11",
    "@vitejs/plugin-vue": "^5.1.4",
    "@vue/test-utils": "^2.4.6",
    "eslint": "^9.13.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-vue": "^9.30.0",
    "husky": "^9.1.6",
    "jsdom": "^24.1.3",
    "lint-staged": "^15.2.10",
    "prettier": "^3.3.3",
    "sass": "^1.80.4",
    "typescript": "^5.6.3",
    "typescript-eslint": "^8.11.0",
    "unplugin-auto-import": "^0.18.4",
    "unplugin-vue-components": "^0.27.4",
    "vite": "^5.4.9",
    "vite-plugin-mock": "^3.0.2",
    "vitest": "^2.1.3",
    "vue-tsc": "^2.1.6"
  },
  "lint-staged": {
    "*.{ts,vue}": "eslint --fix",
    "*.{ts,tsx,vue,json,md,css,scss}": "prettier --write"
  }
}
```

- [ ] **Step 2: 写核心配置文件**

`vite.config.ts`：

```ts
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { viteMockServe } from 'vite-plugin-mock'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      vue(),
      AutoImport({ imports: ['vue', 'vue-router', 'pinia'] }),
      Components({ resolvers: [ElementPlusResolver()] }),
      viteMockServe({ mockPath: 'mock', enable: env.VITE_USE_MOCK === 'true' }),
    ],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      port: 5173,
      proxy: {
        // 切真实后端时启用：'/api' → 后端地址
        // '/api': { target: 'http://your-backend', changeOrigin: true },
      },
    },
  }
})
```

`vitest.config.ts`：

```ts
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.ts', 'mock/**/*.{test,spec}.ts'],
    globals: true,
  },
})
```

`tsconfig.json`：

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.node.json" },
    { "path": "./tsconfig.app.json" }
  ]
}
```

`tsconfig.app.json`：

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] },
    "types": ["vite/client", "node"]
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.vue"]
}
```

`tsconfig.node.json`：

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "types": ["node"]
  },
  "include": ["vite.config.ts", "vitest.config.ts"]
}
```

`index.html`：

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>fengtaiSysView</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

`src/vite-env.d.ts`：

```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_APP_TITLE: string
  readonly VITE_USE_MOCK: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

`.env.development`：

```
VITE_APP_TITLE=fengtaiSysView
VITE_API_BASE_URL=/api
VITE_USE_MOCK=true
```

`.env.production`：

```
VITE_APP_TITLE=fengtaiSysView
VITE_API_BASE_URL=/api
VITE_USE_MOCK=false
```

- [ ] **Step 3: 写工程化配置**

`eslint.config.js`：

```js
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import prettier from 'eslint-config-prettier'

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'auto-imports.d.ts', 'components.d.ts'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.{ts,vue}'],
    languageOptions: { parserOptions: { parser: tseslint.parser } },
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/max-attributes-per-line': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  prettier,
)
```

`.prettierrc`：

```json
{
  "semi": false,
  "singleQuote": true,
  "printWidth": 100,
  "trailingComma": "all"
}
```

`.prettierignore`：

```
dist
node_modules
package-lock.json
```

`commitlint.config.js`：

```js
export default { extends: ['@commitlint/config-conventional'] }
```

`.husky/pre-commit`：

```sh
npx lint-staged
```

`.husky/commit-msg`：

```sh
npx --no -- commitlint --edit "$1"
```

- [ ] **Step 4: 写入口文件**

`src/main.ts`：

```ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import 'element-plus/dist/index.css'
import App from './App.vue'
import './styles/index.scss'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')
```

`src/App.vue`：

```vue
<template>
  <router-view />
</template>
```

`src/styles/index.scss`：

```scss
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body,
#app {
  height: 100%;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC',
    'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  -webkit-font-smoothing: antialiased;
  background-color: #f0f2f5;
}
```

- [ ] **Step 5: 安装依赖并验证骨架**

运行：`npm install`
运行：`npm run dev`，浏览器打开 `http://localhost:5173`，应看到空白页（无报错，控制台无红色错误）。
按 Ctrl+C 停止。

- [ ] **Step 6: 运行 lint / build 验证**

运行：`npm run lint`
预期：通过（可能提示 App.vue 未使用的 import 之类，按提示修正——main.ts 里 App 是本地变量可忽略，若 lint 报错则把 `const app = createApp(App)` 改为 `createApp(App).use(createPinia()).mount('#app')`）。

运行：`npm run build`
预期：`vue-tsc` 类型检查通过，`vite build` 产出 `dist/`。

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: 搭建 Vite + Vue3 + TS 工程骨架与规范配置"
```

---

### Task 2: 全局类型 + token 工具 + 请求层

**Files:**
- Create: `src/types/index.ts`
- Create: `src/utils/auth.ts`
- Create: `src/api/request.ts`
- Test: `src/api/request.test.ts`
- Test: `src/utils/auth.test.ts`

**Interfaces:**
- Consumes: 无
- Produces:
  - `request<T>(config: AxiosRequestConfig): Promise<T>` —— 唯一发请求入口，返回后端 `data` 字段
  - `getToken(): string` / `setToken(token: string): void` / `removeToken(): void`
  - 导出 `injectToken(config)` / `normalizeResponse(response)` / `handleHttpError(error)` 三个纯函数供测试
  - 类型：`ApiResult<T>`、`LoginParams`、`LoginResult`、`UserInfo`、`MenuNode`、`GetMeResult`、`DeptItem`、`RoleItem`、`UserItem`、`PageParams`、`PageResult<T>`

- [ ] **Step 1: 写全局类型**

`src/types/index.ts`：

```ts
export interface ApiResult<T = unknown> {
  code: number
  message: string
  data: T
}

export interface LoginParams {
  username: string
  password: string
}

export interface LoginResult {
  token: string
}

export interface UserInfo {
  id: string
  username: string
  nickname: string
  avatar?: string
  roles: string[]
  deptId: string | null
}

/** 菜单节点：name 作路由名，title 作菜单显示，component 为相对 src/views 的路径 */
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
}

export interface GetMeResult {
  userInfo: UserInfo
  menus: MenuNode[]
}

export interface DeptItem {
  id: string
  parentId: string | null
  name: string
  sort: number
  leader?: string
  phone?: string
  status: number
  children?: DeptItem[]
}

export interface RoleItem {
  id: string
  name: string
  code: string
  sort: number
  status: number
  menuIds: string[]
  remark?: string
}

export interface UserItem {
  id: string
  username: string
  nickname: string
  deptId: string | null
  roleIds: string[]
  phone?: string
  email?: string
  status: number
  createTime: string
}

export interface PageParams {
  page: number
  pageSize: number
  [key: string]: unknown
}

export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}
```

- [ ] **Step 2: 写 token 工具（先写失败测试）**

`src/utils/auth.test.ts`：

```ts
import { describe, expect, it, beforeEach } from 'vitest'
import { getToken, setToken, removeToken } from './auth'

describe('utils/auth', () => {
  beforeEach(() => localStorage.clear())

  it('setToken 写入，getToken 读取', () => {
    setToken('abc')
    expect(getToken()).toBe('abc')
  })

  it('未设置时返回空串', () => {
    expect(getToken()).toBe('')
  })

  it('removeToken 清除', () => {
    setToken('abc')
    removeToken()
    expect(getToken()).toBe('')
  })
})
```

- [ ] **Step 3: 运行测试确认失败**

运行：`npm run test -- src/utils/auth.test.ts`
预期：FAIL，`./auth` 模块不存在。

- [ ] **Step 4: 实现 token 工具**

`src/utils/auth.ts`：

```ts
const TOKEN_KEY = 'fengtai_token'

export function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) ?? ''
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}
```

- [ ] **Step 5: 运行测试确认通过**

运行：`npm run test -- src/utils/auth.test.ts`
预期：PASS（3 个用例）。

- [ ] **Step 6: 写请求层测试（先失败）**

`src/api/request.test.ts`：

```ts
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { injectToken, normalizeResponse, handleHttpError } from './request'

vi.mock('element-plus', () => ({
  ElMessage: { error: vi.fn(), success: vi.fn() },
}))

function makeConfig(overrides: Record<string, unknown> = {}) {
  return { headers: {}, ...overrides } as any
}

function makeError(status: number, message = '') {
  return { response: { status, data: { message } }, message: 'Network Error' } as any
}

describe('api/request 拦截器纯函数', () => {
  beforeEach(() => vi.clearAllMocks())

  it('injectToken 在有 token 时注入 Authorization', () => {
    localStorage.setItem('fengtai_token', 't-123')
    const config = injectToken(makeConfig())
    expect(config.headers.Authorization).toBe('Bearer t-123')
  })

  it('injectToken 无 token 时不注入', () => {
    localStorage.removeItem('fengtai_token')
    const config = injectToken(makeConfig())
    expect(config.headers.Authorization).toBeUndefined()
  })

  it('normalizeResponse code===0 原样返回', () => {
    const res = { data: { code: 0, message: 'ok', data: 1 } } as any
    expect(normalizeResponse(res)).toBe(res)
  })

  it('normalizeResponse code!==0 抛错', () => {
    const res = { data: { code: 500, message: '业务失败', data: null } } as any
    expect(() => normalizeResponse(res)).toThrow('业务失败')
  })

  it('handleHttpError 对 401 清除 token', () => {
    localStorage.setItem('fengtai_token', 't-123')
    handleHttpError(makeError(401)).catch(() => {})
    expect(localStorage.getItem('fengtai_token')).toBeNull()
  })

  it('handleHttpError 返回 rejected Promise', async () => {
    await expect(handleHttpError(makeError(500, '服务器错误'))).rejects.toThrow()
  })
})
```

- [ ] **Step 7: 运行测试确认失败**

运行：`npm run test -- src/api/request.test.ts`
预期：FAIL，`./request` 不存在。

- [ ] **Step 8: 实现请求层**

`src/api/request.ts`：

```ts
import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { ElMessage } from 'element-plus'
import type { ApiResult } from '@/types'
import { getToken, removeToken } from '@/utils/auth'

const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
})

/** 请求拦截器：注入 token（纯函数，可单测） */
export function injectToken(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}

/** 响应拦截器：统一校验业务码（纯函数，可单测） */
export function normalizeResponse(response: AxiosResponse): AxiosResponse {
  const res = response.data as ApiResult
  if (res.code !== 0) {
    ElMessage.error(res.message || '请求失败')
    throw new Error(res.message || '请求失败')
  }
  return response
}

/** 响应错误处理：401 清除凭证跳登录（纯函数，可单测） */
export function handleHttpError(error: AxiosError<ApiResult>): Promise<never> {
  if (error.response?.status === 401) {
    removeToken()
    ElMessage.error('登录已过期，请重新登录')
    window.location.href = '/login'
  } else {
    ElMessage.error(error.response?.data?.message || error.message || '网络错误')
  }
  return Promise.reject(error)
}

service.interceptors.request.use(injectToken)
service.interceptors.response.use(normalizeResponse, handleHttpError)

/** 统一请求入口：泛型 T 为后端 data 字段类型 */
export function request<T>(config: AxiosRequestConfig): Promise<T> {
  return service.request(config).then((res) => res.data.data as T)
}

export default service
```

- [ ] **Step 9: 运行测试确认通过**

运行：`npm run test -- src/api/request.test.ts`
预期：PASS（6 个用例）。

- [ ] **Step 10: Commit**

```bash
git add src/types src/utils src/api
git commit -m "feat: 全局类型、token 工具与请求层拦截器"
```

---

### Task 3: Mock 环境（登录鉴权 + 系统 CRUD）

**Files:**
- Create: `mock/menus.ts`
- Create: `mock/auth.ts`
- Create: `mock/system.ts`
- Test: `mock/auth.test.ts`（对登录逻辑抽出的纯函数做单测）

**Interfaces:**
- Consumes: `vite-plugin-mock`（Task 1 已装）、`MenuNode` 类型
- Produces: 接口 `POST /api/auth/login`、`POST /api/auth/logout`、`GET /api/auth/me`、`GET/POST/PUT/DELETE /api/system/dept|role|user`（`user` 为分页列表）。演示账号 `admin/admin123`、`user/user123`。

- [ ] **Step 1: 定义菜单树数据**

`mock/menus.ts`：

```ts
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
```

- [ ] **Step 2: 写登录鉴权纯函数 + 测试（先失败）**

`mock/auth.ts`（同时导出纯函数 `resolveUserByToken` 供测试）：

```ts
import type { MockMethod } from 'vite-plugin-mock'
import type { MenuNode } from '@/types'
import { adminMenus, userMenus } from './menus'

interface MockUser {
  password: string
  nickname: string
  roles: string[]
  deptId: string | null
}

const users: Record<string, MockUser> = {
  admin: { password: 'admin123', nickname: '系统管理员', roles: ['admin'], deptId: '1' },
  user: { password: 'user123', nickname: '普通用户', roles: ['user'], deptId: '1' },
}

export const menusByUsername = (username: string): MenuNode[] =>
  username === 'admin' ? adminMenus : userMenus

export function resolveUserByToken(token: string): {
  userInfo: { id: string; username: string; nickname: string; roles: string[]; deptId: string | null }
  menus: MenuNode[]
} | null {
  const username = token.replace(/^token-/, '')
  const u = users[username]
  if (!u) return null
  return {
    userInfo: { id: username, username, nickname: u.nickname, roles: u.roles, deptId: u.deptId },
    menus: menusByUsername(username),
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
] as MockMethod[]
```

`mock/auth.test.ts`：

```ts
import { describe, expect, it } from 'vitest'
import { resolveUserByToken, menusByUsername } from './auth'

describe('mock 登录鉴权', () => {
  it('admin 的 token 能解析出全量菜单', () => {
    const result = resolveUserByToken('token-admin')
    expect(result?.userInfo.username).toBe('admin')
    expect(result?.menus.length).toBe(2)
    expect(menusByUsername('admin').some((m) => m.title === '系统管理')).toBe(true)
  })

  it('user 的 token 只有仪表盘', () => {
    const result = resolveUserByToken('token-user')
    expect(result?.menus.length).toBe(1)
    expect(result?.menus[0].title).toBe('仪表盘')
  })

  it('非法 token 返回 null', () => {
    expect(resolveUserByToken('token-ghost')).toBeNull()
  })
})
```

- [ ] **Step 3: 运行测试确认失败**

运行：`npm run test -- mock/auth.test.ts`
预期：FAIL，`./auth` 不存在。

- [ ] **Step 4: 实现系统 CRUD Mock**

`mock/system.ts`（部门/角色/用户内存数据，含分页）：

```ts
import type { MockMethod } from 'vite-plugin-mock'
import type { DeptItem, RoleItem, UserItem } from '@/types'

const depts: DeptItem[] = [
  { id: '1', parentId: null, name: '丰台区', sort: 1, leader: '张主任', phone: '010-1234', status: 1 },
  { id: '11', parentId: '1', name: '政务科', sort: 1, leader: '李科长', status: 1 },
  { id: '12', parentId: '1', name: '数据科', sort: 2, leader: '王科长', status: 1 },
  { id: '121', parentId: '12', name: '平台组', sort: 1, status: 1 },
]

const roles: RoleItem[] = [
  { id: '1', name: '系统管理员', code: 'admin', sort: 1, status: 1, menuIds: ['1', '2', '21', '22', '23'], remark: '全部权限' },
  { id: '2', name: '普通用户', code: 'user', sort: 2, status: 1, menuIds: ['1'], remark: '仅仪表盘' },
]

const users: UserItem[] = [
  { id: '1', username: 'admin', nickname: '系统管理员', deptId: '1', roleIds: ['1'], phone: '13800000001', status: 1, createTime: '2026-01-01 10:00:00' },
  { id: '2', username: 'user', nickname: '普通用户', deptId: '11', roleIds: ['2'], phone: '13800000002', status: 1, createTime: '2026-02-01 10:00:00' },
]

const ok = (data: unknown) => ({ code: 0, message: 'ok', data })

export default [
  // ---------- 部门 ----------
  { url: '/api/system/dept/list', method: 'get', response: () => ok(depts) },
  {
    url: '/api/system/dept',
    method: 'post',
    response: ({ body }: { body: Partial<DeptItem> }) => {
      const item: DeptItem = { id: String(Date.now()), parentId: body.parentId ?? null, name: body.name ?? '', sort: body.sort ?? 1, status: body.status ?? 1, leader: body.leader, phone: body.phone }
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
      const item: RoleItem = { id: String(Date.now()), name: body.name ?? '', code: body.code ?? '', sort: body.sort ?? 1, status: body.status ?? 1, menuIds: body.menuIds ?? [], remark: body.remark }
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
      const item: UserItem = { id: String(Date.now()), username: body.username ?? '', nickname: body.nickname ?? '', deptId: body.deptId ?? null, roleIds: body.roleIds ?? [], phone: body.phone, email: body.email, status: body.status ?? 1, createTime: new Date().toLocaleString() }
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
] as MockMethod[]
```

- [ ] **Step 5: 运行测试确认通过**

运行：`npm run test -- mock/auth.test.ts`
预期：PASS（3 个用例）。

- [ ] **Step 6: 启动 dev 验证 mock 生效**

运行：`npm run dev`，另开终端执行：

```bash
curl -s -X POST http://localhost:5173/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}'
```

预期返回 `{"code":0,...,"data":{"token":"token-admin"}}`。
再验证错误密码返回 `code:1`。Ctrl+C 停止 dev。

- [ ] **Step 7: Commit**

```bash
git add mock
git commit -m "feat: mock 登录鉴权与系统 CRUD 数据"
```

---

### Task 4: API 接口层模块

**Files:**
- Create: `src/api/auth.ts`
- Create: `src/api/system.ts`

**Interfaces:**
- Consumes: `request<T>`（Task 2）、`mock/*`（Task 3，dev 下由 vite-plugin-mock 拦截）
- Produces:
  - `api/auth.ts`：`login(params: LoginParams): Promise<LoginResult>`、`logout(): Promise<null>`、`getMe(): Promise<GetMeResult>`
  - `api/system.ts`：`getDeptList()`、`createDept(data)`、`updateDept(data)`、`deleteDept(id)`、`getRoleList()`、`createRole(data)`、`updateRole(data)`、`deleteRole(id)`、`getUserPage(params)`、`createUser(data)`、`updateUser(data)`、`deleteUser(id)`

- [ ] **Step 1: 实现 auth 接口模块**

`src/api/auth.ts`：

```ts
import { request } from './request'
import type { GetMeResult, LoginParams, LoginResult } from '@/types'

export function login(data: LoginParams): Promise<LoginResult> {
  return request<LoginResult>({ url: '/auth/login', method: 'post', data })
}

export function logout(): Promise<null> {
  return request<null>({ url: '/auth/logout', method: 'post' })
}

export function getMe(): Promise<GetMeResult> {
  return request<GetMeResult>({ url: '/auth/me', method: 'get' })
}
```

- [ ] **Step 2: 实现 system 接口模块**

`src/api/system.ts`：

```ts
import { request } from './request'
import type { DeptItem, PageParams, PageResult, RoleItem, UserItem } from '@/types'

// ---------- 部门 ----------
export function getDeptList(): Promise<DeptItem[]> {
  return request<DeptItem[]>({ url: '/system/dept/list', method: 'get' })
}
export function createDept(data: Partial<DeptItem>): Promise<null> {
  return request<null>({ url: '/system/dept', method: 'post', data })
}
export function updateDept(data: Partial<DeptItem>): Promise<null> {
  return request<null>({ url: '/system/dept', method: 'put', data })
}
export function deleteDept(id: string): Promise<null> {
  return request<null>({ url: '/system/dept', method: 'delete', params: { id } })
}

// ---------- 角色 ----------
export function getRoleList(): Promise<RoleItem[]> {
  return request<RoleItem[]>({ url: '/system/role/list', method: 'get' })
}
export function createRole(data: Partial<RoleItem>): Promise<null> {
  return request<null>({ url: '/system/role', method: 'post', data })
}
export function updateRole(data: Partial<RoleItem>): Promise<null> {
  return request<null>({ url: '/system/role', method: 'put', data })
}
export function deleteRole(id: string): Promise<null> {
  return request<null>({ url: '/system/role', method: 'delete', params: { id } })
}

// ---------- 用户 ----------
export function getUserPage(params: PageParams): Promise<PageResult<UserItem>> {
  return request<PageResult<UserItem>>({ url: '/system/user/list', method: 'get', params })
}
export function createUser(data: Partial<UserItem>): Promise<null> {
  return request<null>({ url: '/system/user', method: 'post', data })
}
export function updateUser(data: Partial<UserItem>): Promise<null> {
  return request<null>({ url: '/system/user', method: 'put', data })
}
export function deleteUser(id: string): Promise<null> {
  return request<null>({ url: '/system/user', method: 'delete', params: { id } })
}
```

- [ ] **Step 3: 类型检查 + build 验证**

运行：`npm run build`
预期：`vue-tsc` 通过，`vite build` 成功。

- [ ] **Step 4: Commit**

```bash
git add src/api
git commit -m "feat: auth 与 system 接口层模块"
```

---

### Task 5: 动态路由生成（纯函数）

**Files:**
- Create: `src/router/dynamic.ts`
- Test: `src/router/dynamic.test.ts`

**Interfaces:**
- Consumes: `MenuNode`（Task 2）
- Produces: `buildRoutes(menus: MenuNode[]): RouteRecordRaw[]` —— 把菜单树拍平成 Layout 下的路由列表（组节点无 component 只递归，不生成路由）

- [ ] **Step 1: 写失败测试**

`src/router/dynamic.test.ts`：

```ts
import { describe, expect, it } from 'vitest'
import { buildRoutes } from './dynamic'
import type { MenuNode } from '@/types'

const menus: MenuNode[] = [
  { id: '1', parentId: null, name: 'Dashboard', title: '仪表盘', path: '/dashboard', component: 'dashboard/index', icon: '', sort: 1, perms: [] },
  {
    id: '2', parentId: null, name: 'System', title: '系统管理', path: '/system', component: '', icon: '', sort: 2, perms: [],
    children: [
      { id: '21', parentId: '2', name: 'Dept', title: '部门管理', path: '/system/dept', component: 'system/dept/index', icon: '', sort: 1, perms: ['system:dept:add'] },
      { id: '22', parentId: '2', name: 'Role', title: '角色管理', path: '/system/role', component: 'system/role/index', icon: '', sort: 2, perms: [] },
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
```

- [ ] **Step 2: 运行测试确认失败**

运行：`npm run test -- src/router/dynamic.test.ts`
预期：FAIL，`./dynamic` 不存在。

- [ ] **Step 3: 实现 buildRoutes**

`src/router/dynamic.ts`：

```ts
import type { RouteRecordRaw } from 'vue-router'
import type { MenuNode } from '@/types'

/** 按组件路径懒加载 src/views 下的页面 */
const viewModules = import.meta.glob('@/views/**/*.vue')

function resolveComponent(componentPath: string) {
  return viewModules[`/src/views/${componentPath}.vue`]
}

/**
 * 菜单树 → 动态路由（拍平）：
 * 组节点（component 为空）只递归其 children，不生成路由；
 * 子路由 path 使用绝对路径，直接挂在 Layout 下。
 */
export function buildRoutes(menus: MenuNode[]): RouteRecordRaw[] {
  const routes: RouteRecordRaw[] = []
  for (const m of menus) {
    if (m.component) {
      routes.push({
        path: m.path,
        name: m.name,
        component: resolveComponent(m.component),
        meta: { title: m.title ?? m.name, icon: m.icon, perms: m.perms },
      })
    }
    if (m.children?.length) {
      routes.push(...buildRoutes(m.children))
    }
  }
  return routes
}
```

- [ ] **Step 4: 运行测试确认通过**

运行：`npm run test -- src/router/dynamic.test.ts`
预期：PASS（2 个用例）。

- [ ] **Step 5: Commit**

```bash
git add src/router/dynamic.ts src/router/dynamic.test.ts
git commit -m "feat: 菜单树拍平生成动态路由"
```

---

### Task 6: 状态层（user + permission store）

**Files:**
- Create: `src/stores/user.ts`
- Create: `src/stores/permission.ts`
- Test: `src/stores/permission.test.ts`

**Interfaces:**
- Consumes: `api/auth`（Task 4）、`buildRoutes`（Task 5）、`utils/auth`（Task 2）
- Produces:
  - `useUserStore`：state `token`/`userInfo`；actions `login(username,password)`、`fetchMe()`、`logout()`、`reset()`
  - `usePermissionStore`：state `loaded`/`menus`/`perms`/`dynamicRoutes`；actions `loadPermission()`、`reset()`；getter/方法 `hasPerm(code)`

- [ ] **Step 1: 实现 user store**

`src/stores/user.ts`：

```ts
import { defineStore } from 'pinia'
import { login as apiLogin, logout as apiLogout, getMe } from '@/api/auth'
import type { UserInfo } from '@/types'
import { getToken, removeToken, setToken } from '@/utils/auth'
import { usePermissionStore } from './permission'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: getToken(),
    userInfo: null as UserInfo | null,
  }),
  actions: {
    async login(username: string, password: string) {
      const { token } = await apiLogin({ username, password })
      this.token = token
      setToken(token)
    },
    async fetchMe() {
      const { userInfo } = await getMe()
      this.userInfo = userInfo
      return userInfo
    },
    async logout() {
      try {
        await apiLogout()
      } catch {
        // 忽略登出接口异常，本地凭证必须清
      }
      this.reset()
    },
    reset() {
      this.token = ''
      this.userInfo = null
      removeToken()
      usePermissionStore().reset()
    },
  },
})
```

- [ ] **Step 2: 实现 permission store**

`src/stores/permission.ts`：

```ts
import { defineStore } from 'pinia'
import type { RouteRecordRaw } from 'vue-router'
import { getMe } from '@/api/auth'
import { buildRoutes } from '@/router/dynamic'
import type { MenuNode } from '@/types'

function collectPerms(menus: MenuNode[]): string[] {
  const perms: string[] = []
  for (const m of menus) {
    perms.push(...m.perms)
    if (m.children?.length) perms.push(...collectPerms(m.children))
  }
  return [...new Set(perms)]
}

export const usePermissionStore = defineStore('permission', {
  state: () => ({
    loaded: false,
    menus: [] as MenuNode[],
    perms: [] as string[],
    dynamicRoutes: [] as RouteRecordRaw[],
  }),
  actions: {
    async loadPermission() {
      const { menus } = await getMe()
      this.menus = menus
      this.perms = collectPerms(menus)
      this.dynamicRoutes = buildRoutes(menus)
      this.loaded = true
    },
    reset() {
      this.loaded = false
      this.menus = []
      this.perms = []
      this.dynamicRoutes = []
    },
    hasPerm(code: string) {
      return this.perms.includes(code)
    },
  },
})
```

- [ ] **Step 3: 写 permission store 测试（mock api）**

`src/stores/permission.test.ts`：

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { usePermissionStore } from './permission'
import type { MenuNode } from '@/types'

vi.mock('@/api/auth', () => ({
  getMe: vi.fn(),
}))

const menus: MenuNode[] = [
  { id: '1', parentId: null, name: 'Dashboard', title: '仪表盘', path: '/dashboard', component: 'dashboard/index', icon: '', sort: 1, perms: [] },
  {
    id: '2', parentId: null, name: 'System', title: '系统管理', path: '/system', component: '', icon: '', sort: 2, perms: [],
    children: [
      { id: '21', parentId: '2', name: 'Dept', title: '部门管理', path: '/system/dept', component: 'system/dept/index', icon: '', sort: 1, perms: ['system:dept:add'] },
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
    vi.mocked(getMe).mockResolvedValue({ userInfo: { id: 'a', username: 'admin', nickname: '管理员', roles: ['admin'], deptId: null }, menus })

    const store = usePermissionStore()
    await store.loadPermission()

    expect(store.loaded).toBe(true)
    expect(store.menus).toBe(menus)
    expect(store.perms).toContain('system:dept:add')
    expect(store.dynamicRoutes.map((r) => r.path)).toEqual(['/dashboard', '/system/dept'])
    expect(store.hasPerm('system:dept:add')).toBe(true)
    expect(store.hasPerm('system:user:add')).toBe(false)
  })

  it('reset 清空全部状态', async () => {
    const { getMe } = await import('@/api/auth')
    vi.mocked(getMe).mockResolvedValue({ userInfo: { id: 'a', username: 'admin', nickname: '管理员', roles: ['admin'], deptId: null }, menus })

    const store = usePermissionStore()
    await store.loadPermission()
    store.reset()

    expect(store.loaded).toBe(false)
    expect(store.menus).toHaveLength(0)
    expect(store.perms).toHaveLength(0)
    expect(store.dynamicRoutes).toHaveLength(0)
  })
})
```

- [ ] **Step 4: 运行测试确认通过**

运行：`npm run test -- src/stores/permission.test.ts`
预期：PASS（2 个用例）。

- [ ] **Step 5: Commit**

```bash
git add src/stores
git commit -m "feat: user 与 permission 状态层"
```

---

### Task 7: 路由骨架 + 全局守卫 + 登录页 + 404

**Files:**
- Create: `src/router/index.ts`
- Create: `src/views/login/index.vue`
- Create: `src/views/error/404.vue`
- Modify: `src/main.ts`（挂载 router）

**Interfaces:**
- Consumes: `useUserStore`（token）、`usePermissionStore`（loadPermission/dynamicRoutes）、`getToken`（Task 2）
- Produces: `router`（含常量路由与 `beforeEach` 守卫）；登录后登录流程跑通；`src/router/index.ts` 导出的 `constantRoutes`

- [ ] **Step 1: 实现路由 + 守卫**

`src/router/index.ts`：

```ts
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { usePermissionStore } from '@/stores/permission'
import { getToken } from '@/utils/auth'
import MainLayout from '@/layouts/MainLayout/index.vue'
import { buildRoutes } from './dynamic'

export const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', public: true },
  },
  {
    path: '/',
    component: MainLayout,
    redirect: '/dashboard',
    name: 'Layout',
    children: [],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '404', public: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes: constantRoutes,
})

const WHITE_LIST = ['/login']

router.beforeEach(async (to) => {
  if (!getToken()) {
    if (WHITE_LIST.includes(to.path)) return true
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  if (to.path === '/login') return { path: '/' }

  const permissionStore = usePermissionStore()
  if (!permissionStore.loaded) {
    try {
      await permissionStore.loadPermission()
      permissionStore.dynamicRoutes.forEach((r) => router.addRoute('Layout', r))
      return { ...to, replace: true }
    } catch {
      return { path: '/login', query: { redirect: to.fullPath } }
    }
  }
  return true
})

export default router
```

- [ ] **Step 2: 实现 404 页面**

`src/views/error/404.vue`：

```vue
<script setup lang="ts"></script>

<template>
  <div class="not-found">
    <h1>404</h1>
    <p>页面不存在</p>
    <router-link to="/">返回首页</router-link>
  </div>
</template>

<style scoped>
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
}
.not-found h1 {
  font-size: 80px;
  color: #409eff;
}
</style>
```

- [ ] **Step 3: 实现登录页**

`src/views/login/index.vue`：

```vue
<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const formRef = ref()
const loading = ref(false)
const form = reactive({ username: 'admin', password: 'admin123' })
const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

async function handleLogin() {
  if (!formRef.value) return
  await formRef.value.validate()
  loading.value = true
  try {
    await userStore.login(form.username, form.password)
    ElMessage.success('登录成功')
    const redirect = (route.query.redirect as string) || '/'
    router.replace(redirect)
  } catch {
    // 错误提示已由请求层统一处理
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <h2 class="login-title">{{ import.meta.env.VITE_APP_TITLE }}</h2>
      <el-form ref="formRef" :model="form" :rules="rules" size="large" @keyup.enter="handleLogin">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名" clearable />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="密码" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" style="width: 100%" @click="handleLogin">
            登 录
          </el-button>
        </el-form-item>
      </el-form>
      <div class="login-tip">演示账号：admin / admin123（全权限），user / user123（部分权限）</div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: linear-gradient(135deg, #1f3a5f, #409eff);
}
.login-card {
  width: 380px;
  padding: 40px 36px 24px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 8px 30px rgb(0 0 0 / 20%);
}
.login-title {
  margin-bottom: 24px;
  text-align: center;
  font-size: 22px;
  color: #1f3a5f;
}
.login-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #999;
  text-align: center;
}
</style>
```

- [ ] **Step 4: 修改 main.ts 挂载 router**

`src/main.ts`：

```ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'
import './styles/index.scss'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
```

- [ ] **Step 5: 验证（需先有主布局，见 Task 8）**

登录页、守卫现在可以单独验证。运行 `npm run dev`，访问 `http://localhost:5173/login`，应能看到登录表单，输入 admin/admin123 点登录会因 Layout 页缺失报错——这是预期的，Task 8 完成后整体走通。先停止。

- [ ] **Step 6: Commit**

```bash
git add src/router/index.ts src/views/login src/views/error src/main.ts
git commit -m "feat: 路由守卫与登录页"
```

---

### Task 8: 主布局（MainLayout + 侧栏树菜单 + 顶栏 + 面包屑 + 多标签页）

**Files:**
- Create: `src/layouts/MainLayout/index.vue`
- Create: `src/layouts/MainLayout/SideMenu.vue`
- Create: `src/layouts/MainLayout/Navbar.vue`
- Create: `src/layouts/MainLayout/Breadcrumb.vue`
- Create: `src/layouts/MainLayout/TagsView.vue`

**Interfaces:**
- Consumes: `usePermissionStore`（menus）、`useUserStore`（userInfo/logout）
- Produces: 登录后的整体壳：左侧树菜单、顶栏（折叠/面包屑/用户下拉）、多标签页

- [ ] **Step 1: 实现侧栏树菜单（递归自引用）**

`src/layouts/MainLayout/SideMenu.vue`：

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { usePermissionStore } from '@/stores/permission'
import type { MenuNode } from '@/types'

// 组件文件名 SideMenu.vue 在 <script setup> 中可自引用，直接使用 <SideMenu> 递归
const props = withDefaults(defineProps<{ menus?: MenuNode[] }>(), { menus: undefined })

const route = useRoute()
const permissionStore = usePermissionStore()

/** 未传 menus 时用权限 store 的顶级菜单；递归时传子节点 */
const menus = computed(() => props.menus ?? permissionStore.menus)
</script>

<template>
  <template v-for="menu in menus" :key="menu.id">
    <el-menu-item v-if="!menu.children?.length" :index="menu.path">
      <el-icon v-if="menu.icon"><component :is="menu.icon" /></el-icon>
      <span>{{ menu.title }}</span>
    </el-menu-item>
    <el-sub-menu v-else :index="menu.path">
      <template #title>
        <el-icon v-if="menu.icon"><component :is="menu.icon" /></el-icon>
        <span>{{ menu.title }}</span>
      </template>
      <SideMenu :menus="menu.children" />
    </el-sub-menu>
  </template>
</template>
```

- [ ] **Step 2: 实现面包屑**

`src/layouts/MainLayout/Breadcrumb.vue`：

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const items = computed(() =>
  route.matched.filter((r) => r.meta?.title).map((r) => ({ path: r.path, title: r.meta?.title as string })),
)
</script>

<template>
  <el-breadcrumb separator="/">
    <el-breadcrumb-item to="/">首页</el-breadcrumb-item>
    <el-breadcrumb-item v-for="item in items" :key="item.path">{{ item.title }}</el-breadcrumb-item>
  </el-breadcrumb>
</template>
```

- [ ] **Step 3: 实现多标签页**

`src/layouts/MainLayout/TagsView.vue`：

```vue
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

interface Tab {
  path: string
  title: string
  fullPath: string
}

const route = useRoute()
const router = useRouter()
const tabs = ref<Tab[]>([{ path: '/dashboard', title: '仪表盘', fullPath: '/dashboard' }])

const activePath = computed(() => route.path)

watch(
  () => route.fullPath,
  (fullPath) => {
    const title = route.meta?.title as string | undefined
    if (!title || !fullPath) return
    const exists = tabs.value.some((t) => t.fullPath === fullPath)
    if (!exists) tabs.value.push({ path: route.path, title, fullPath })
  },
  { immediate: true },
)

function closeTab(tab: Tab) {
  const index = tabs.value.findIndex((t) => t.fullPath === tab.fullPath)
  tabs.value.splice(index, 1)
  if (tab.fullPath === activePath.value) {
    const next = tabs.value[index] ?? tabs.value[index - 1]
    if (next) router.push(next.fullPath)
  }
}
</script>

<template>
  <div class="tags-view">
    <el-tag
      v-for="tab in tabs"
      :key="tab.fullPath"
      :closable="tab.fullPath !== '/dashboard'"
      :effect="tab.fullPath === activePath ? 'dark' : 'plain'"
      @click="router.push(tab.fullPath)"
      @close="closeTab(tab)"
    >
      {{ tab.title }}
    </el-tag>
  </div>
</template>

<style scoped>
.tags-view {
  display: flex;
  gap: 8px;
  padding: 8px 16px;
  border-bottom: 1px solid #e4e7ed;
  background: #fff;
}
.tags-view .el-tag {
  cursor: pointer;
}
</style>
```

- [ ] **Step 4: 实现顶栏**

`src/layouts/MainLayout/Navbar.vue`：

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import Breadcrumb from './Breadcrumb.vue'

const emit = defineEmits<{ (e: 'toggle'): void }>()
const router = useRouter()
const userStore = useUserStore()

const nickname = computed(() => userStore.userInfo?.nickname ?? userStore.userInfo?.username ?? '')

async function handleCommand(command: string) {
  if (command === 'logout') {
    await userStore.logout()
    ElMessage.success('已退出登录')
    router.replace('/login')
  }
}
</script>

<template>
  <div class="navbar">
    <el-icon class="collapse-btn" size="20" @click="emit('toggle')">
      <Fold />
    </el-icon>
    <Breadcrumb class="navbar-breadcrumb" />
    <div class="navbar-right">
      <el-dropdown @command="handleCommand">
        <span class="user-name">
          <el-icon><User /></el-icon>
          {{ nickname }}
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="logout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<style scoped>
.navbar {
  display: flex;
  align-items: center;
  height: 50px;
  padding: 0 16px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
}
.collapse-btn {
  cursor: pointer;
}
.navbar-breadcrumb {
  margin-left: 16px;
}
.navbar-right {
  margin-left: auto;
}
.user-name {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  color: #333;
}
</style>
```

- [ ] **Step 5: 实现主布局壳**

`src/layouts/MainLayout/index.vue`：

```vue
<script setup lang="ts">
import { ref } from 'vue'
import SideMenu from './SideMenu.vue'
import Navbar from './Navbar.vue'
import TagsView from './TagsView.vue'

const collapsed = ref(false)
</script>

<template>
  <el-container class="main-layout">
    <el-aside :width="collapsed ? '64px' : '220px'" class="main-aside">
      <div class="logo">fengtaiSysView</div>
      <SideMenu />
    </el-aside>
    <el-container>
      <el-header class="main-header">
        <Navbar @toggle="collapsed = !collapsed" />
        <TagsView />
      </el-header>
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.main-layout {
  height: 100%;
}
.main-aside {
  background: #1f2d3d;
  transition: width 0.2s;
  overflow-x: hidden;
}
.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 50px;
  color: #fff;
  font-weight: 600;
  font-size: 16px;
  white-space: nowrap;
}
.main-header {
  height: auto;
  padding: 0;
}
.main-content {
  background: #f0f2f5;
  overflow-y: auto;
}
</style>
```

- [ ] **Step 6: 在 main.ts 注册 Element Plus 图标**

修改 `src/main.ts`：

```ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'
import './styles/index.scss'

const app = createApp(App)
app.use(createPinia())
app.use(router)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.mount('#app')
```

- [ ] **Step 7: 端到端验证登录流程**

运行：`npm run dev`，浏览器打开 `http://localhost:5173/login`：
1. 输入 `admin / admin123` 登录 → 应进入主布局，左侧出现「仪表盘」「系统管理」（含部门/角色/用户子菜单）。
2. 点「仪表盘」→ 内容区显示空白页（页面在 Task 12 实现，先确认路由跳转正常、标签页出现「仪表盘」）。
3. 点「部门管理」→ URL 变为 `/system/dept`，内容区空白（Task 13 实现）。
4. 右上角退出登录 → 回到登录页。
5. 用 `user / user123` 登录 → 左侧只有「仪表盘」，无系统管理菜单（动态菜单差异生效）。

注意：`/system/dept` 等页面组件尚不存在，`import.meta.glob` 找不到对应文件时该路由组件为 undefined，点菜单可能空白——属预期，后续 Task 补齐页面即正常。Ctrl+C 停止。

- [ ] **Step 8: Commit**

```bash
git add src/layouts src/main.ts
git commit -m "feat: 主布局（侧栏树菜单、顶栏、面包屑、多标签页）"
```

---

### Task 9: v-perm 指令 + usePerm

**Files:**
- Create: `src/directives/perm.ts`
- Create: `src/composables/usePerm.ts`
- Modify: `src/main.ts`（注册指令）
- Test: `src/directives/perm.test.ts`

**Interfaces:**
- Consumes: `usePermissionStore`（hasPerm）
- Produces: `perm` 指令（`v-perm="'code'"` 或 `v-perm="['a','b']"` 任一命中即保留）；`usePerm()` 返回 `{ hasPerm(code): boolean }`

- [ ] **Step 1: 写失败测试**

`src/directives/perm.test.ts`：

```ts
import { describe, expect, it, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { usePermissionStore } from '@/stores/permission'
import { perm } from './perm'

describe('directives/perm', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('有权限时保留元素', () => {
    usePermissionStore().perms = ['system:user:add']
    const wrapper = mount({ template: `<button v-perm="'system:user:add'">新增</button>` }, { global: { directives: { perm } } })
    expect(wrapper.find('button').exists()).toBe(true)
  })

  it('无权限时移除元素', () => {
    usePermissionStore().perms = []
    const wrapper = mount({ template: `<button v-perm="'system:user:add'">新增</button>` }, { global: { directives: { perm } } })
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('多权限任一命中即保留', () => {
    usePermissionStore().perms = ['system:user:edit']
    const wrapper = mount(
      { template: `<button v-perm="['system:user:add','system:user:edit']">操作</button>` },
      { global: { directives: { perm } } },
    )
    expect(wrapper.find('button').exists()).toBe(true)
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

运行：`npm run test -- src/directives/perm.test.ts`
预期：FAIL，`./perm` 不存在。

- [ ] **Step 3: 实现指令与 composable**

`src/directives/perm.ts`：

```ts
import type { Directive } from 'vue'
import { usePermissionStore } from '@/stores/permission'

export const perm: Directive<HTMLElement, string | string[]> = {
  mounted(el, binding) {
    const { value } = binding
    if (!value) return
    const required = Array.isArray(value) ? value : [value]
    const permissionStore = usePermissionStore()
    const allowed = required.some((code) => permissionStore.hasPerm(code))
    if (!allowed) {
      el.parentNode?.removeChild(el)
    }
  },
}
```

`src/composables/usePerm.ts`：

```ts
import { usePermissionStore } from '@/stores/permission'

export function usePerm() {
  const permissionStore = usePermissionStore()
  return {
    hasPerm: (code: string) => permissionStore.hasPerm(code),
  }
}
```

- [ ] **Step 4: 运行测试确认通过**

运行：`npm run test -- src/directives/perm.test.ts`
预期：PASS（3 个用例）。

- [ ] **Step 5: 注册指令**

修改 `src/main.ts`，在 `app.use(router)` 之后加：

```ts
import { perm } from '@/directives/perm'
// ...
app.directive('perm', perm)
```

- [ ] **Step 6: Commit**

```bash
git add src/directives src/composables src/main.ts
git commit -m "feat: v-perm 按钮权限指令与 usePerm"
```

---

### Task 10: ProTable 表格封装

**Files:**
- Create: `src/components/ProTable/types.ts`
- Create: `src/components/ProTable/index.vue`

**Interfaces:**
- Consumes: `PageResult<T>`（Task 2）
- Produces: `ProTable` 组件。Props：`columns`、`searchFields?`、`fetchApi(params)=>Promise<PageResult<T>>`、`rowKey?`、`pageSizes?`；暴露 `load`/`refresh` 方法

- [ ] **Step 1: 定义 ProTable 类型**

`src/components/ProTable/types.ts`：

```ts
export interface Column {
  prop: string
  label: string
  width?: number
  minWidth?: number
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  showOverflowTooltip?: boolean
  /** 指定自定义渲染插槽名（插槽参数 { row }） */
  slot?: string
}

export interface SearchField {
  prop: string
  label: string
  type?: 'input' | 'select'
  options?: { label: string; value: string | number }[]
  placeholder?: string
}

export type FetchApi = (params: Record<string, unknown>) => Promise<{ list: unknown[]; total: number }>
```

- [ ] **Step 2: 实现 ProTable 组件**

`src/components/ProTable/index.vue`：

```vue
<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import type { Column, FetchApi, SearchField } from './types'

const props = withDefaults(
  defineProps<{
    columns: Column[]
    searchFields?: SearchField[]
    fetchApi: FetchApi
    rowKey?: string
    pageSizes?: number[]
  }>(),
  { searchFields: () => [], rowKey: 'id', pageSizes: () => [10, 20, 50] },
)

const tableData = ref<Record<string, unknown>[]>([])
const loading = ref(false)
const total = ref(0)
const query = reactive<Record<string, unknown>>({})
const pagination = reactive({ page: 1, pageSize: 10 })

async function load() {
  loading.value = true
  try {
    const res = await props.fetchApi({ ...query, page: pagination.page, pageSize: pagination.pageSize })
    tableData.value = res.list as Record<string, unknown>[]
    total.value = res.total
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.page = 1
  load()
}

function handleReset() {
  Object.keys(query).forEach((k) => {
    query[k] = ''
  })
  handleSearch()
}

function handlePageChange(page: number) {
  pagination.page = page
  load()
}

function handleSizeChange(size: number) {
  pagination.pageSize = size
  pagination.page = 1
  load()
}

defineExpose({ load, refresh: load })
onMounted(load)
</script>

<template>
  <div class="pro-table">
    <el-form v-if="searchFields.length" inline class="pro-table__search" @submit.prevent="handleSearch">
      <el-form-item v-for="f in searchFields" :key="f.prop" :label="f.label">
        <el-input
          v-if="(f.type ?? 'input') === 'input'"
          v-model="query[f.prop]"
          clearable
          :placeholder="f.placeholder ?? `请输入${f.label}`"
          style="width: 180px"
        />
        <el-select
          v-else
          v-model="query[f.prop]"
          clearable
          :placeholder="f.placeholder ?? `请选择${f.label}`"
          style="width: 180px"
        >
          <el-option v-for="o in f.options ?? []" :key="o.value" :label="o.label" :value="o.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="tableData" :row-key="rowKey" border>
      <el-table-column
        v-for="c in columns"
        :key="c.prop"
        :prop="c.prop"
        :label="c.label"
        :width="c.width"
        :min-width="c.minWidth"
        :align="c.align"
        :sortable="c.sortable"
        :show-overflow-tooltip="c.showOverflowTooltip"
      >
        <template v-if="c.slot" #default="{ row }">
          <slot :name="c.slot" :row="row">{{ row[c.prop] }}</slot>
        </template>
      </el-table-column>
    </el-table>

    <div class="pro-table__pager">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="total"
        :page-sizes="pageSizes"
        layout="total, sizes, prev, pager, next"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>
  </div>
</template>

<style scoped>
.pro-table__search {
  margin-bottom: 8px;
}
.pro-table__pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
</style>
```

- [ ] **Step 3: 验证**

运行：`npm run build`
预期：`vue-tsc` 通过。暂无可直接使用的页面，组件由 Task 13–15 的实际页面消费时做端到端验证。

- [ ] **Step 4: Commit**

```bash
git add src/components/ProTable
git commit -m "feat: ProTable 表格封装（搜索、分页、操作列插槽）"
```

---

### Task 11: ProForm 表单封装

**Files:**
- Create: `src/components/ProForm/types.ts`
- Create: `src/components/ProForm/index.vue`

**Interfaces:**
- Consumes: 无
- Produces: `ProForm` 组件。Props：`modelValue`（弹窗可见）、`title`、`fields: FormField[]`、`submitApi(values)=>Promise<unknown>`、`initialValues?`、`confirmLoading?`；Emits：`update:modelValue`、`success`

- [ ] **Step 1: 定义 ProForm 类型**

`src/components/ProForm/types.ts`：

```ts
import type { FormItemRule } from 'element-plus'

export interface FormField {
  prop: string
  label: string
  type?: 'input' | 'textarea' | 'number' | 'select'
  options?: { label: string; value: string | number }[]
  placeholder?: string
  rules?: FormItemRule[]
  /** 多选（select 时生效） */
  multiple?: boolean
}
```

- [ ] **Step 2: 实现 ProForm 组件**

`src/components/ProForm/index.vue`：

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
  }>(),
  { initialValues: () => ({}) },
)

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'success'): void
}>()

const formRef = ref()
const submitting = ref(false)
const form = reactive<Record<string, unknown>>({})

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      Object.keys(form).forEach((k) => delete form[k])
      Object.assign(form, props.initialValues)
      formRef.value?.clearValidate?.()
    }
  },
)

function rulesOf(field: FormField) {
  return field.rules ?? [{ required: true, message: `请输入${field.label}`, trigger: 'blur' }]
}

async function handleConfirm() {
  if (!formRef.value) return
  await formRef.value.validate()
  submitting.value = true
  try {
    await props.submitApi({ ...form })
    ElMessage.success('保存成功')
    emit('success')
    emit('update:modelValue', false)
  } catch {
    // 错误已由请求层提示
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :title="title"
    width="520px"
    :close-on-click-modal="false"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-form ref="formRef" :model="form" label-width="90px">
      <el-form-item v-for="f in fields" :key="f.prop" :label="f.label" :prop="f.prop" :rules="rulesOf(f)">
        <el-input
          v-if="f.type === 'input' || !f.type"
          v-model="form[f.prop]"
          :placeholder="f.placeholder ?? `请输入${f.label}`"
        />
        <el-input
          v-else-if="f.type === 'textarea'"
          v-model="form[f.prop]"
          type="textarea"
          :rows="3"
          :placeholder="f.placeholder ?? `请输入${f.label}`"
        />
        <el-input-number
          v-else-if="f.type === 'number'"
          v-model="form[f.prop] as number"
          style="width: 100%"
        />
        <el-select
          v-else-if="f.type === 'select'"
          v-model="form[f.prop]"
          :multiple="f.multiple"
          :placeholder="f.placeholder ?? `请选择${f.label}`"
          style="width: 100%"
        >
          <el-option v-for="o in f.options ?? []" :key="o.value" :label="o.label" :value="o.value" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleConfirm">确定</el-button>
    </template>
  </el-dialog>
</template>
```

- [ ] **Step 3: 验证**

运行：`npm run build`
预期：`vue-tsc` 通过。

- [ ] **Step 4: Commit**

```bash
git add src/components/ProForm
git commit -m "feat: ProForm 表单封装（弹窗、校验、提交）"
```

---

### Task 12: ChartBox 图表封装

**Files:**
- Create: `src/components/ChartBox/index.vue`

**Interfaces:**
- Consumes: `echarts`（Task 1 已装）
- Produces: `ChartBox` 组件。Props：`option: EChartsOption`、`height?`（默认 `300px`）、`loading?`

- [ ] **Step 1: 实现 ChartBox**

`src/components/ChartBox/index.vue`：

```vue
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'

const props = withDefaults(
  defineProps<{ option: EChartsOption; height?: string; loading?: boolean }>(),
  { height: '300px', loading: false },
)

const el = ref<HTMLDivElement>()
let chart: echarts.ECharts | null = null
let observer: ResizeObserver | null = null

function render() {
  if (!el.value) return
  if (!chart) chart = echarts.init(el.value)
  chart.setOption(props.option, true)
}

onMounted(() => {
  render()
  observer = new ResizeObserver(() => chart?.resize())
  if (el.value) observer.observe(el.value)
})

watch(
  () => props.option,
  () => {
    if (!props.loading) render()
  },
  { deep: true },
)

onBeforeUnmount(() => {
  observer?.disconnect()
  chart?.dispose()
  chart = null
})
</script>

<template>
  <div v-loading="loading" class="chart-box" :style="{ height }">
    <div ref="el" :style="{ height }" />
  </div>
</template>
```

- [ ] **Step 2: 验证**

运行：`npm run build`
预期：`vue-tsc` 通过。

- [ ] **Step 3: Commit**

```bash
git add src/components/ChartBox
git commit -m "feat: ChartBox 图表封装（ECharts + 自适应）"
```

---

### Task 13: 仪表盘首页

**Files:**
- Create: `src/views/dashboard/index.vue`

**Interfaces:**
- Consumes: `ChartBox`（Task 12）
- Produces: `/dashboard` 页面（统计卡片 + 两个图表）

- [ ] **Step 1: 实现仪表盘页面**

`src/views/dashboard/index.vue`：

```vue
<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import ChartBox from '@/components/ChartBox/index.vue'

const stats = [
  { label: '部门数', value: 4 },
  { label: '角色数', value: 2 },
  { label: '用户数', value: 2 },
  { label: '在线用户', value: 1 },
]

const deptBarOption: EChartsOption = {
  title: { text: '各部门人数' },
  tooltip: {},
  xAxis: { type: 'category', data: ['政务科', '数据科', '平台组'] },
  yAxis: { type: 'value' },
  series: [{ type: 'bar', data: [18, 25, 12], itemStyle: { color: '#409eff' } }],
}

const trendLineOption: EChartsOption = {
  title: { text: '近 7 日访问趋势' },
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] },
  yAxis: { type: 'value' },
  series: [
    { type: 'line', data: [120, 200, 150, 80, 170, 90, 210], smooth: true, areaStyle: {} },
  ],
}
</script>

<template>
  <div class="dashboard">
    <el-row :gutter="16">
      <el-col v-for="s in stats" :key="s.label" :span="6">
        <el-card class="stat-card">
          <div class="stat-value">{{ s.value }}</div>
          <div class="stat-label">{{ s.label }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="chart-row">
      <el-col :span="12">
        <el-card><ChartBox :option="deptBarOption" height="320px" /></el-card>
      </el-col>
      <el-col :span="12">
        <el-card><ChartBox :option="trendLineOption" height="320px" /></el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.stat-card {
  text-align: center;
}
.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #409eff;
}
.stat-label {
  margin-top: 4px;
  color: #666;
}
.chart-row {
  margin-top: 16px;
}
</style>
```

- [ ] **Step 2: 端到端验证**

运行：`npm run dev`，登录 `admin / admin123`：
1. 登录后自动跳到 `/dashboard`，应看到 4 张统计卡片和 2 张图表（柱状 + 折线）。
2. 调整窗口大小，图表应自适应。

- [ ] **Step 3: Commit**

```bash
git add src/views/dashboard
git commit -m "feat: 仪表盘首页（统计卡片 + 图表）"
```

---

### Task 14: 部门管理页（树形表格）

**Files:**
- Create: `src/views/system/dept/index.vue`

**Interfaces:**
- Consumes: `api/system`（dept CRUD，Task 4）、`v-perm`（Task 9）、`ProForm`（Task 11）
- Produces: `/system/dept` 页面（树形表格 + 新增/编辑弹窗 + 删除）

- [ ] **Step 1: 实现部门管理页**

`src/views/system/dept/index.vue`：

```vue
<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createDept, deleteDept, getDeptList, updateDept } from '@/api/system'
import ProForm from '@/components/ProForm/index.vue'
import type { DeptItem } from '@/types'

const list = ref<DeptItem[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const form = reactive<Partial<DeptItem>>({})

async function load() {
  loading.value = true
  try {
    list.value = await getDeptList()
  } finally {
    loading.value = false
  }
}

function openAdd(parentId: string | null = null) {
  isEdit.value = false
  Object.assign(form, { parentId, name: '', sort: 1, status: 1, leader: '', phone: '' })
  dialogVisible.value = true
}

function openEdit(row: DeptItem) {
  isEdit.value = true
  Object.assign(form, { ...row })
  dialogVisible.value = true
}

async function handleSubmit(values: Record<string, unknown>) {
  if (isEdit.value) {
    await updateDept({ ...(form as DeptItem), ...values } as DeptItem)
  } else {
    await createDept(values as Partial<DeptItem>)
  }
  load()
}

async function handleDelete(row: DeptItem) {
  await ElMessageBox.confirm(`确定删除部门「${row.name}」？`, '提示', { type: 'warning' })
  await deleteDept(row.id)
  ElMessage.success('删除成功')
  load()
}

onMounted(load)
</script>

<template>
  <el-card>
    <div class="toolbar">
      <el-button v-perm="'system:dept:add'" type="primary" @click="openAdd()">新增部门</el-button>
    </div>

    <el-table
      v-loading="loading"
      :data="list"
      row-key="id"
      border
      default-expand-all
      :tree-props="{ children: 'children' }"
    >
      <el-table-column prop="name" label="部门名称" min-width="180" />
      <el-table-column prop="sort" label="排序" width="80" />
      <el-table-column prop="leader" label="负责人" width="120" />
      <el-table-column prop="phone" label="联系电话" width="140" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'">
            {{ row.status === 1 ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220">
        <template #default="{ row }">
          <el-button v-perm="'system:dept:add'" type="primary" link @click="openAdd(row.id)">新增子级</el-button>
          <el-button v-perm="'system:dept:edit'" type="primary" link @click="openEdit(row)">编辑</el-button>
          <el-button v-perm="'system:dept:delete'" type="danger" link @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <ProForm
      v-model="dialogVisible"
      :title="isEdit ? '编辑部门' : '新增部门'"
      :initial-values="form as Record<string, unknown>"
      :submit-api="handleSubmit"
      :fields="[
        { prop: 'name', label: '部门名称', rules: [{ required: true, message: '请输入部门名称', trigger: 'blur' }] },
        { prop: 'sort', label: '排序', type: 'number' },
        { prop: 'leader', label: '负责人' },
        { prop: 'phone', label: '联系电话' },
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

- [ ] **Step 2: 端到端验证**

运行：`npm run dev`，登录 `admin`：
1. 打开「系统管理 → 部门管理」，应看到树形部门表格。
2. 新增一个子级部门 → 保存 → 表格刷新出现新行。
3. 编辑某部门名称 → 保存 → 刷新生效。
4. 删除某部门 → 确认 → 行消失。

- [ ] **Step 3: Commit**

```bash
git add src/views/system/dept
git commit -m "feat: 部门管理页（树形表格）"
```

---

### Task 15: 角色管理页（含分配权限）

**Files:**
- Create: `src/views/system/role/index.vue`

**Interfaces:**
- Consumes: `api/system`（role CRUD）、`getRoleList`、`adminMenus`（权限树数据来自 mock，可复用 `mock/menus` 导出）、`v-perm`、`ProForm`
- Produces: `/system/role` 页面（角色表格 + 分配权限弹窗 + 新增/编辑/删除）

- [ ] **Step 1: 实现角色管理页**

`src/views/system/role/index.vue`：

```vue
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createRole, deleteRole, getRoleList, updateRole } from '@/api/system'
import ProForm from '@/components/ProForm/index.vue'
import type { RoleItem } from '@/types'
import { adminMenus } from '../../../../mock/menus'

const list = ref<RoleItem[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const form = ref<Partial<RoleItem>>({})

// ---------- 分配权限弹窗 ----------
const permVisible = ref(false)
const permTreeRef = ref()
const currentRole = ref<RoleItem | null>(null)
const checkedKeys = ref<string[]>([])

async function load() {
  loading.value = true
  try {
    list.value = await getRoleList()
  } finally {
    loading.value = false
  }
}

function openAdd() {
  isEdit.value = false
  form.value = { name: '', code: '', sort: 1, status: 1, remark: '' }
  dialogVisible.value = true
}

function openEdit(row: RoleItem) {
  isEdit.value = true
  form.value = { ...row }
  dialogVisible.value = true
}

async function handleSubmit(values: Record<string, unknown>) {
  if (isEdit.value) {
    await updateRole({ ...(form.value as RoleItem), ...values } as RoleItem)
  } else {
    await createRole(values as Partial<RoleItem>)
  }
  load()
}

async function handleDelete(row: RoleItem) {
  await ElMessageBox.confirm(`确定删除角色「${row.name}」？`, '提示', { type: 'warning' })
  await deleteRole(row.id)
  ElMessage.success('删除成功')
  load()
}

function openPerm(row: RoleItem) {
  currentRole.value = row
  checkedKeys.value = row.menuIds ?? []
  permVisible.value = true
}

async function savePerm() {
  if (!currentRole.value) return
  await updateRole({ ...currentRole.value, menuIds: checkedKeys.value })
  ElMessage.success('权限已更新')
  permVisible.value = false
  load()
}

onMounted(load)
</script>

<template>
  <el-card>
    <div class="toolbar">
      <el-button v-perm="'system:role:add'" type="primary" @click="openAdd">新增角色</el-button>
    </div>

    <el-table v-loading="loading" :data="list" border>
      <el-table-column prop="name" label="角色名称" min-width="140" />
      <el-table-column prop="code" label="角色编码" width="120" />
      <el-table-column prop="sort" label="排序" width="80" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'">{{ row.status === 1 ? '启用' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" min-width="160" />
      <el-table-column label="操作" width="240">
        <template #default="{ row }">
          <el-button v-perm="'system:role:edit'" type="primary" link @click="openEdit(row)">编辑</el-button>
          <el-button v-perm="'system:role:edit'" type="primary" link @click="openPerm(row)">分配权限</el-button>
          <el-button v-perm="'system:role:delete'" type="danger" link @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <ProForm
      v-model="dialogVisible"
      :title="isEdit ? '编辑角色' : '新增角色'"
      :initial-values="form as Record<string, unknown>"
      :submit-api="handleSubmit"
      :fields="[
        { prop: 'name', label: '角色名称', rules: [{ required: true, message: '请输入角色名称', trigger: 'blur' }] },
        { prop: 'code', label: '角色编码', rules: [{ required: true, message: '请输入角色编码', trigger: 'blur' }] },
        { prop: 'sort', label: '排序', type: 'number' },
        { prop: 'remark', label: '备注', type: 'textarea' },
      ]"
    />

    <el-dialog v-model="permVisible" title="分配权限" width="420px">
      <el-tree
        ref="permTreeRef"
        :data="adminMenus"
        show-checkbox
        node-key="id"
        :default-checked-keys="checkedKeys"
        :props="{ label: 'title', children: 'children' }"
        @check="checkedKeys = permTreeRef.getCheckedKeys() as string[]"
      />
      <template #footer>
        <el-button @click="permVisible = false">取消</el-button>
        <el-button type="primary" @click="savePerm">保存</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<style scoped>
.toolbar {
  margin-bottom: 12px;
}
</style>
```

说明：权限树的数据源直接复用 `mock/menus.ts` 的 `adminMenus`（全量菜单），后端接入后改为角色可分配的菜单接口。

- [ ] **Step 2: 端到端验证**

运行：`npm run dev`，登录 `admin`：
1. 打开「角色管理」，看到角色列表。
2. 「分配权限」→ 勾选部分菜单 → 保存 → 提示成功。
3. 新增角色 → 列表刷新。

- [ ] **Step 3: Commit**

```bash
git add src/views/system/role
git commit -m "feat: 角色管理页（含分配权限）"
```

---

### Task 16: 用户管理页

**Files:**
- Create: `src/views/system/user/index.vue`

**Interfaces:**
- Consumes: `api/system`（user CRUD + dept/role 列表）、`ProTable`、`ProForm`、`v-perm`
- Produces: `/system/user` 页面（ProTable + 搜索 + 新增/编辑弹窗 + 删除）

- [ ] **Step 1: 实现用户管理页**

`src/views/system/user/index.vue`：

```vue
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createUser, deleteUser, getDeptList, getRoleList, getUserPage, updateUser } from '@/api/system'
import ProTable from '@/components/ProTable/index.vue'
import type { Column, SearchField } from '@/components/ProTable/types'
import ProForm from '@/components/ProForm/index.vue'
import type { DeptItem, RoleItem, UserItem } from '@/types'

const tableRef = ref()
const dialogVisible = ref(false)
const isEdit = ref(false)
const form = ref<Partial<UserItem>>({})

const depts = ref<DeptItem[]>([])
const roles = ref<RoleItem[]>([])

async function loadOptions() {
  depts.value = await getDeptList()
  roles.value = await getRoleList()
}

function openAdd() {
  isEdit.value = false
  form.value = { username: '', nickname: '', deptId: null, roleIds: [], phone: '', email: '', status: 1 }
  dialogVisible.value = true
}

function openEdit(row: UserItem) {
  isEdit.value = true
  form.value = { ...row }
  dialogVisible.value = true
}

async function handleSubmit(values: Record<string, unknown>) {
  if (isEdit.value) {
    await updateUser({ ...(form.value as UserItem), ...values } as UserItem)
  } else {
    await createUser(values as Partial<UserItem>)
  }
  dialogVisible.value = false
  tableRef.value?.refresh()
}

async function handleDelete(row: UserItem) {
  await ElMessageBox.confirm(`确定删除用户「${row.nickname}」？`, '提示', { type: 'warning' })
  await deleteUser(row.id)
  ElMessage.success('删除成功')
  tableRef.value?.refresh()
}

const columns: Column[] = [
  { prop: 'username', label: '用户名', minWidth: 120 },
  { prop: 'nickname', label: '昵称', minWidth: 120 },
  { prop: 'phone', label: '手机号', width: 140 },
  { prop: 'createTime', label: '创建时间', width: 180 },
  {
    prop: 'status',
    label: '状态',
    width: 90,
    slot: 'status',
  },
  { prop: 'operation', label: '操作', width: 160, slot: 'operation' },
]

const searchFields: SearchField[] = [
  { prop: 'username', label: '用户名' },
  { prop: 'nickname', label: '昵称' },
  {
    prop: 'status',
    label: '状态',
    type: 'select',
    options: [
      { label: '启用', value: 1 },
      { label: '停用', value: 0 },
    ],
  },
]

const statusMap = { 1: '启用', 0: '停用' } as const

onMounted(loadOptions)
</script>

<template>
  <el-card>
    <div class="toolbar">
      <el-button v-perm="'system:user:add'" type="primary" @click="openAdd">新增用户</el-button>
    </div>

    <ProTable
      ref="tableRef"
      :columns="columns"
      :search-fields="searchFields"
      :fetch-api="getUserPage"
      row-key="id"
    >
      <template #status="{ row }">
        <el-tag :type="row.status === 1 ? 'success' : 'danger'">{{ statusMap[row.status as keyof typeof statusMap] ?? row.status }}</el-tag>
      </template>
      <template #operation="{ row }">
        <el-button v-perm="'system:user:edit'" type="primary" link @click="openEdit(row)">编辑</el-button>
        <el-button v-perm="'system:user:delete'" type="danger" link @click="handleDelete(row)">删除</el-button>
      </template>
    </ProTable>

    <ProForm
      v-model="dialogVisible"
      :title="isEdit ? '编辑用户' : '新增用户'"
      :initial-values="form as Record<string, unknown>"
      :submit-api="handleSubmit"
      :fields="[
        { prop: 'username', label: '用户名', rules: [{ required: true, message: '请输入用户名', trigger: 'blur' }] },
        { prop: 'nickname', label: '昵称', rules: [{ required: true, message: '请输入昵称', trigger: 'blur' }] },
        { prop: 'phone', label: '手机号' },
        { prop: 'email', label: '邮箱' },
        { prop: 'deptId', label: '所属部门', type: 'select', options: depts.map((d) => ({ label: d.name, value: d.id })) },
        { prop: 'roleIds', label: '角色', type: 'select', multiple: true, options: roles.map((r) => ({ label: r.name, value: r.id })) },
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

- [ ] **Step 2: 端到端验证**

运行：`npm run dev`，登录 `admin`：
1. 打开「用户管理」，看到用户列表（含分页）。
2. 搜索用户名 `admin` → 过滤出 1 条。
3. 新增用户 → 弹窗选部门/角色 → 保存 → 列表刷新。
4. 编辑用户 → 保存生效。
5. 删除用户 → 确认后消失。

- [ ] **Step 3: Commit**

```bash
git add src/views/system/user
git commit -m "feat: 用户管理页"
```

---

### Task 17: 收尾——权限差异验证 + 构建 + README

**Files:**
- Create: `README.md`
- Modify: 无（仅验证）

**Interfaces:**
- Consumes: 全部已完成功能
- Produces: 可交付运行的基座

- [ ] **Step 1: 全量单测**

运行：`npm run test`
预期：全部 PASS（Task 2/3/5/6/9 的用例）。

- [ ] **Step 2: 权限差异验证**

运行：`npm run dev`：
1. `admin / admin123` 登录 → 左侧菜单含「仪表盘」「系统管理（部门/角色/用户）」，各页面按钮齐全（新增/编辑/删除）。
2. 退出 → `user / user123` 登录 → 左侧仅「仪表盘」，无系统管理菜单。
3. 验证按钮级权限：在 mock 中把 `user` 账号的菜单改为「仅仪表盘 + 用户管理（无 delete 权限）」，重新登录确认「用户管理」页没有删除按钮（如需要，可临时改 `mock/auth.ts` 的 `menusByUsername` 验证 `v-perm` 生效）。
4. 全部验证通过后恢复 mock 默认数据。

- [ ] **Step 3: 生产构建验证**

运行：`npm run build`
预期：`vue-tsc` + `vite build` 成功，产出 `dist/`。

- [ ] **Step 4: 写 README**

`README.md`：

```markdown
# fengtaiSysView

丰台区企业级 RBAC 中后台前端基座（Vue 3 + TypeScript + Element Plus）。

## 技术栈

Vite 5 · Vue 3 · TypeScript · Pinia · Vue Router 4 · Element Plus · Axios · ECharts · Vitest

## 快速开始

```bash
npm install
npm run dev        # 开发（Mock 生效，端口 5173）
npm run test       # 单元测试
npm run build      # 生产构建
```

## 演示账号

| 账号 | 密码 | 权限 |
|---|---|---|
| admin | admin123 | 全部菜单与按钮权限 |
| user | user123 | 仅仪表盘 |

## 目录说明

- `src/api/` 接口层（唯一发请求的地方，切换真实后端只改这里）
- `src/stores/` Pinia 状态（用户、权限）
- `src/router/` 静态路由 + 动态路由生成 + 全局守卫
- `src/layouts/` 主布局（侧栏树菜单、顶栏、面包屑、多标签页）
- `src/components/` 通用组件（ProTable、ProForm、ChartBox）
- `src/views/` 业务页面（登录、仪表盘、系统管理）
- `mock/` Mock 数据（dev 生效）

## 接入真实后端

1. 修改 `.env.development` 的 `VITE_API_BASE_URL`，配置 `vite.config.ts` 的 `server.proxy`。
2. 将 `VITE_USE_MOCK` 设为 `false`。
3. 按后端实际返回微调 `src/api/` 与 `src/types/`。
```

- [ ] **Step 5: 最终提交**

```bash
git add README.md
git commit -m "docs: 项目 README 与使用说明"
```

- [ ] **Step 6: 推送（可选，需先处理代理认证问题）**

若需要推送到 GitHub：参考会话中已确认的「直连绕过代理」方式，用 `GIT_CONFIG_GLOBAL=/dev/null git push` 推送（代理凭据问题需另行解决）。

---

## Self-Review

**1. Spec 覆盖检查：**

| Spec 要求 | 对应 Task |
|---|---|
| 工程化（ESLint/Prettier/husky/commitlint/env/别名） | Task 1 |
| 登录认证流程 | Task 7（守卫+登录页）+ Task 3/6（mock/store） |
| 动态路由 + 权限数据驱动 | Task 5 + Task 6 + Task 7 |
| 侧栏树菜单 | Task 8 |
| 顶栏/面包屑/多标签页 | Task 8 |
| 按钮级权限 v-perm + usePerm | Task 9 |
| ProTable / ProForm / ChartBox | Task 10/11/12 |
| 仪表盘（含图表） | Task 13 |
| 部门（树表）/角色（含分配权限）/用户 | Task 14/15/16 |
| 两个演示账号验证权限差异 | Task 8 Step 7 + Task 17 |
| 接口层隔离、换后端清单 | Task 4 + README（Task 17 Step 4） |
| 测试策略（单测 + 端到端手测） | 各 Task 内 TDD + Task 17 |

**2. 占位符扫描：** 无 TBD/TODO；每个代码步骤都有完整代码。

**3. 类型一致性：**
- `request<T>` 泛型与各 api 函数返回类型一致（Task 2 → Task 4）。
- `MenuNode` 含 `title` 字段，`buildRoutes`、mock、SideMenu、permission store 均一致使用。
- `buildRoutes` 产出 `RouteRecordRaw[]`，permission store 的 `dynamicRoutes` 与其一致。
- `handleSubmit` 在 ProForm 中的签名 `(values: Record<string, unknown>) => Promise<unknown>` 与各页面传入的 `submitApi` 兼容。
- `fetchApi` 签名 `(params) => Promise<{ list; total }>` 与 `getUserPage`（返回 `PageResult<UserItem>`）兼容。

**已知待办（非计划缺陷）：**
- 角色分配权限的数据源暂用 mock 全量菜单，后端接入后替换为角色可分配的菜单接口。
- 代理推送凭据问题见会话记录，推送命令需绕代理。
