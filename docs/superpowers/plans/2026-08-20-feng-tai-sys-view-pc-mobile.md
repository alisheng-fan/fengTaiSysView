# fengTaiSysView PC + 移动端双端实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有 PC 端中后台基础上新增一套手机 H5 应用（Vue 3 + Vant 4 + Capacitor 壳），两者共用同一套后端接口契约与 mock。

**Architecture:** 方案 B——PC 端 `src/` 保持现状，提取 `shared/`（types + api + token 工具）作为两端单一接口契约来源；PC 端原位置改薄 re-export 保持 import 路径不变；新增 `mobile/` 独立 Vite 工程 import `@shared`。移动端覆盖轻量子集（登录、填报列表、填报详情动态表单、个人中心、修改密码）。Capacitor 打包成 Android 壳。

**Tech Stack:** PC 沿用 Vite 5 + Vue 3 + TS + Element Plus；mobile 新增 Vite 5 + Vue 3 + Vant 4 + pinia + vue-router + Capacitor 7；两端共享 shared（axios 请求层，消息提示由各端注入）。

**Spec:** [docs/superpowers/specs/2026-08-20-feng-tai-sys-view-pc-mobile-design.md](../specs/2026-08-20-feng-tai-sys-view-pc-mobile-design.md)（本计划从 spec 推导，执行者需同时阅读 spec 与本计划）

## Global Constraints

以下约束全局生效，所有任务隐式包含：

- 沿用基座约定：`api/` 唯一 axios 层（现在是 `shared/api/`）、权限数据驱动、conventional commits、TDD（vitest）、`@/` 别名（PC）与 `@shared/` 别名（两端）。
- **shared 是两端唯一接口契约来源**：types、api、token 工具只放 shared；PC 的 `src/types`、`src/api/*`、`src/utils/auth.ts` 为薄 re-export，import 路径不变。
- **shared 内部不得依赖任何端特有库/路径**：不 import element-plus / vant；消息提示通过 `setNotifyError()` 注入（PC=ElMessage，mobile=showToast）。shared 内部 import 用相对路径。
- **shared 依赖抽离**：`src/utils/form.ts`（toFormFields，依赖 PC ProForm 类型）与 `src/utils/menu.ts`（buildMenuIdsFromLeaves）是 PC 专用，**不进 shared**，留在 PC `src/utils/`。
- **mock 共用**：仓库根 `mock/` 两端 dev 都指向；`vite-plugin-mock` 配 `ignore: /\.(test|spec)\.ts$/`。
- 移动端端口 **5174**（避开 PC 的 5173）；PC 端 5173 不变。
- 移动端轻量子集：登录 / 填报列表 / 填报详情 / 个人中心 / 修改密码。系统管理不在移动端。
- 演示账号：admin/admin123、user/user123（共用）。
- 备份已完成：`D:/fengtai/fengTaiSysView_20260820_backup.zip`（重构前快照）。

## 文件结构总览

| 路径 | 职责 |
|---|---|
| `shared/types/index.ts` | 全部类型（从 src/types 移入） |
| `shared/api/request.ts` | axios 工厂 + 拦截器（token/401/错误，消息提示可注入） |
| `shared/api/auth.ts` / `system.ts` | 接口（从 src/api 移入） |
| `shared/utils/auth.ts` | token 读写（从 src/utils 移入） |
| PC `src/types/index.ts` 等 | 薄 re-export（`export * from '@shared/...'`） |
| PC `vite.config.ts` / `vitest.config.ts` | 加 `@shared` 别名 |
| `mobile/` | 独立 Vite 工程（Vant + pinia + router + Capacitor） |
| `mobile/src/views/{login,fill,profile,password}` | 移动端页面 |
| `mobile/src/layouts/MainTab.vue` | 底部 TabBar |
| `mobile/src/stores/{user,fill}.ts` | 移动端 store |
| `mobile/src/utils/toVantFields.ts` | FieldConfig → Vant 表单数据（纯函数，可单测） |

---

### Task 1: shared 提取 + PC 端薄 re-export + 回归

**Files:**
- Create: `shared/types/index.ts`、`shared/api/request.ts`、`shared/api/auth.ts`、`shared/api/system.ts`、`shared/utils/auth.ts`
- Modify: PC `src/types/index.ts`、`src/api/request.ts`、`src/api/auth.ts`、`src/api/system.ts`、`src/utils/auth.ts`（改为 re-export）、`src/main.ts`（注册 notifyError）、`src/api/request.test.ts`（改为注入 spy 断言）、`vite.config.ts`、`vitest.config.ts`（加 @shared 别名）

**Interfaces:**
- Consumes: 现有 PC 代码（内容原样搬移，逻辑不变）
- Produces:
  - `shared` 全套（相对路径内部引用）
  - `shared/api/request.ts` 导出 `request<T>`、`injectToken`/`normalizeResponse`/`handleHttpError`、`setNotifyError(fn)`（新增注入点）
  - PC 端薄 re-export，import 路径不变

- [ ] **Step 1: 建立 shared 目录（原样搬移）**

把现有文件搬移并改为相对路径内部引用（内容逻辑不变）：

- `src/types/index.ts` → `shared/types/index.ts`（无内部引用）
- `src/utils/auth.ts` → `shared/utils/auth.ts`（无内部引用）
- `src/api/request.ts` → `shared/api/request.ts`，内部 import 改为：
  ```ts
  import type { ApiResult } from '../types'
  import { getToken, removeToken } from '../utils/auth'
  ```
- `src/api/auth.ts` → `shared/api/auth.ts`：
  ```ts
  import { request } from './request'
  import type { GetMeResult, LoginParams, LoginResult } from '../types'
  ```
- `src/api/system.ts` → `shared/api/system.ts`（同理，import `./request` 与 `../types`）

- [ ] **Step 2: request.ts 抽离消息提示（setNotifyError）**

`shared/api/request.ts` 把直接 `import { ElMessage } from 'element-plus'` 改为可注入的消息函数（shared 不得依赖 element-plus）：

```ts
import axios, { AxiosError, type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import type { ApiResult } from '../types'
import { getToken, removeToken } from '../utils/auth'

/** 错误消息提示：由各端注入（PC=ElMessage.error，移动=Vant showToast） */
export let notifyError: (msg: string) => void = (msg) => console.error(msg)

/** 注入错误消息提示实现（在应用入口调用） */
export function setNotifyError(fn: (msg: string) => void): void {
  notifyError = fn
}

const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
})

/** 请求拦截器：注入 token（纯函数，可单测） */
export function injectToken(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
}

/** 响应拦截器：统一校验业务码（纯函数，可单测） */
export function normalizeResponse(response: AxiosResponse): AxiosResponse {
  const res = response.data as ApiResult
  if (res.code !== 0) {
    notifyError(res.message || '请求失败')
    throw new Error(res.message || '请求失败')
  }
  return response
}

/** 响应错误处理：401 清除凭证跳登录（纯函数，可单测） */
export function handleHttpError(error: AxiosError<ApiResult>): Promise<never> {
  if (error.response?.status === 401) {
    removeToken()
    notifyError('登录已过期，请重新登录')
    window.location.href = '/login'
  } else {
    notifyError(error.response?.data?.message || error.message || '网络错误')
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

- [ ] **Step 3: PC 端薄 re-export**

`src/types/index.ts` 改为：
```ts
export * from '@shared/types'
```
`src/api/request.ts` 改为：
```ts
export * from '@shared/api/request'
export { default } from '@shared/api/request'
```
`src/api/auth.ts`、`src/api/system.ts`、`src/utils/auth.ts` 同理 `export * from '@shared/...'`。

- [ ] **Step 4: PC 配置加 @shared 别名 + 入口注入消息**

`vite.config.ts` resolve.alias 增加：
```ts
'@shared': fileURLToPath(new URL('./shared', import.meta.url)),
```
`vitest.config.ts` 同样加 `@shared` 别名。

`src/main.ts` 增加：
```ts
import { setNotifyError } from '@/api/request'
import { ElMessage } from 'element-plus'
setNotifyError((msg) => ElMessage.error(msg))
```

- [ ] **Step 5: 更新 request 测试（注入 spy 断言）**

`src/api/request.test.ts`：去掉 `vi.mock('element-plus')`，改为：
```ts
import { setNotifyError } from './request'

const notifySpy = vi.fn()
beforeEach(() => {
  setNotifyError(notifySpy)
  vi.clearAllMocks()
})
```
把原断言 `ElMessage.error(...)` 改为 `expect(notifySpy).toHaveBeenCalledWith(...)`。其余（injectToken/normalizeResponse/handleHttpError）断言不变。

- [ ] **Step 6: 回归验证**

运行：`npm run test`（37 全绿）、`npm run build`。
预期：全部通过；PC 端行为不变（消息由 main.ts 注入 ElMessage）。

- [ ] **Step 7: Commit**

```bash
git add shared src vite.config.ts vitest.config.ts
git commit -m "refactor: 提取 shared 共享接口契约，PC 端薄 re-export"
```

---

### Task 2: 移动端脚手架（mobile/ 独立工程）

**Files:**
- Create: `mobile/package.json`、`mobile/vite.config.ts`、`mobile/vitest.config.ts`、`mobile/index.html`、`mobile/.env.development`、`mobile/.env.production`、`mobile/tsconfig.json`、`mobile/src/main.ts`、`mobile/src/App.vue`、`mobile/src/vite-env.d.ts`、`mobile/src/router/index.ts`、`mobile/src/stores/user.ts`、`mobile/src/stores/fill.ts`、`mobile/src/layouts/MainTab.vue`、`mobile/src/styles/index.scss`

**Interfaces:**
- Consumes: `shared/`（Task 1）
- Produces: 可 `npm run dev` 的移动端工程骨架（Vant + 路由 + pinia + @shared + mock），端口 5174

- [ ] **Step 1: 写 package.json**

`mobile/package.json`：

```json
{
  "name": "feng-tai-sys-view-mobile",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "axios": "^1.7.7",
    "pinia": "^2.2.4",
    "vant": "^4.9.15",
    "vue": "^3.5.12",
    "vue-router": "^4.4.5"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.1.4",
    "jsdom": "^24.1.3",
    "sass": "^1.80.4",
    "typescript": "^5.6.3",
    "vite": "^5.4.9",
    "vite-plugin-mock": "^3.0.2",
    "vitest": "^2.1.3"
  }
}
```

（Capacitor 依赖在 Task 7 加。）

- [ ] **Step 2: 写工程配置**

`mobile/vite.config.ts`：

```ts
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteMockServe } from 'vite-plugin-mock'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      vue(),
      viteMockServe({ mockPath: '../mock', enable: env.VITE_USE_MOCK === 'true', ignore: /\.(test|spec)\.ts$/ }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@shared': fileURLToPath(new URL('../shared', import.meta.url)),
      },
    },
    server: { port: 5174 },
  }
})
```

`mobile/vitest.config.ts`：

```ts
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)), '@shared': fileURLToPath(new URL('../shared', import.meta.url)) } },
  test: { environment: 'jsdom', include: ['src/**/*.{test,spec}.ts'], globals: true },
})
```

`mobile/tsconfig.json`：

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "strict": true,
    "noEmit": true,
    "jsx": "preserve",
    "skipLibCheck": true,
    "isolatedModules": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"], "@shared/*": ["../shared/*"] },
    "types": ["vite/client"]
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.vue"]
}
```

`mobile/index.html`：

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>业务填报</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

`.env.development`：`VITE_API_BASE_URL=/api`、`VITE_USE_MOCK=true`
`.env.production`：`VITE_API_BASE_URL=/api`、`VITE_USE_MOCK=false`

- [ ] **Step 3: 入口与路由、store**

`mobile/src/main.ts`：

```ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Vant from 'vant'
import 'vant/lib/index.css'
import { showToast } from 'vant'
import { setNotifyError } from '@shared/api/request'
import App from './App.vue'
import router from './router'
import './styles/index.scss'

setNotifyError((msg) => showToast(msg))

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(Vant)
app.mount('#app')
```

`mobile/src/App.vue`：

```vue
<template>
  <router-view />
</template>
```

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
      redirect: '/fill',
      children: [
        { path: 'fill', name: 'fill-list', component: () => import('@/views/fill/index.vue') },
        { path: 'fill/:nodeId', name: 'fill-detail', component: () => import('@/views/fill/detail.vue') },
        { path: 'profile', name: 'profile', component: () => import('@/views/profile/index.vue') },
        { path: 'password', name: 'password', component: () => import('@/views/password/index.vue') },
      ],
    },
  ],
})

router.beforeEach((to) => {
  if (!getToken() && to.path !== '/login') return { path: '/login', redirect: to.fullPath }
  if (getToken() && to.path === '/login') return { path: '/' }
  return true
})

export default router
```

`mobile/src/stores/user.ts`：

```ts
import { defineStore } from 'pinia'
import { login as apiLogin } from '@shared/api/auth'
import { getToken, removeToken, setToken } from '@shared/utils/auth'

/** 移动端用户 store：token 复用 shared，刷新不丢 */
export const useUserStore = defineStore('user', {
  state: () => ({ token: getToken() }),
  actions: {
    async login(username: string, password: string) {
      const { token } = await apiLogin({ username, password })
      this.token = token
      setToken(token)
    },
    logout() {
      this.token = ''
      removeToken()
    },
  },
})
```

`mobile/src/stores/fill.ts`：

```ts
import { defineStore } from 'pinia'
import { getMe } from '@shared/api/auth'
import type { MenuNode } from '@shared/types'

/** 填报 store：从 /auth/me 菜单中筛出业务填报节点（含 fields） */
export const useFillStore = defineStore('fill', {
  state: () => ({ nodes: [] as MenuNode[] }),
  actions: {
    async loadNodes() {
      const { menus } = await getMe()
      // 业务填报组 = 有子节点且子节点带 fields 的顶级菜单
      this.nodes = menus.find((m) => m.children?.some((c) => c.fields))?.children ?? []
    },
  },
})
```

`mobile/src/layouts/MainTab.vue`：

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const active = computed(() => (route.path.startsWith('/fill') ? 'fill' : 'profile'))
</script>

<template>
  <div class="main-tab">
    <router-view />
    <van-tabbar :model-value="active" route>
      <van-tabbar-item name="fill" to="/fill" icon="edit">填报</van-tabbar-item>
      <van-tabbar-item name="profile" to="/profile" icon="user-o">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>
```

`mobile/src/styles/index.scss`：

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
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  background-color: #f7f8fa;
}
.page-loading {
  margin-top: 40vh;
  text-align: center;
}
```

`mobile/src/vite-env.d.ts`：

```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_USE_MOCK: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

- [ ] **Step 4: 临时占位页面 + 安装 + 启动验证**

为了让路由可编译，先建最小占位页（Task 3-6 逐个替换为真实页面）：

- `mobile/src/views/login/index.vue`：`<template><div>login</div></template>`
- `mobile/src/views/fill/index.vue`、`fill/detail.vue`、`profile/index.vue`、`password/index.vue`：`<template><div>占位</div></template>`

运行：`cd mobile && npm install && npm run dev`，浏览器开 `http://localhost:5174` → 无 token 应跳到 `/login`（显示 login 占位）。杀掉 dev（端口释放）。

- [ ] **Step 5: Commit**

```bash
git add mobile
git commit -m "feat: 移动端工程脚手架（Vant + 路由 + shared）"
```

---

### Task 3: 移动端登录页 + 守卫验证

**Files:**
- Create: `mobile/src/views/login/index.vue`

**Interfaces:**
- Consumes: `useUserStore`（Task 2）、`@shared/api/auth`
- Produces: `/login` 页面（Vant 表单），登录后跳 redirect 或 `/`

- [ ] **Step 1: 实现登录页**

`mobile/src/views/login/index.vue`：

```vue
<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showSuccessToast, showToast } from 'vant'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const submitting = ref(false)
const form = reactive({ username: 'user', password: 'user123' })

/** 登录：调 shared login，成功跳 redirect 或首页 */
async function login() {
  if (!form.username || !form.password) {
    showToast('请输入账号和密码')
    return
  }
  submitting.value = true
  try {
    await userStore.login(form.username, form.password)
    showSuccessToast('登录成功')
    router.replace((route.query.redirect as string) || '/')
  } catch {
    // 错误已由请求层 showToast
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-title">业务填报</div>
    <van-form @submit="login">
      <van-cell-group inset>
        <van-field v-model="form.username" label="账号" placeholder="请输入账号" />
        <van-field v-model="form.password" type="password" label="密码" placeholder="请输入密码" />
      </van-cell-group>
      <div style="margin: 16px">
        <van-button round block type="primary" native-type="submit" :loading="submitting">登 录</van-button>
      </div>
    </van-form>
    <div class="login-tip">演示：user / user123（移动端为轻量子集账号）</div>
  </div>
</template>

<style scoped>
.login-page {
  padding-top: 20vh;
}
.login-title {
  margin-bottom: 32px;
  text-align: center;
  font-size: 24px;
  font-weight: 600;
}
.login-tip {
  margin-top: 16px;
  text-align: center;
  font-size: 12px;
  color: #999;
}
</style>
```

- [ ] **Step 2: dev 验证**

运行 `cd mobile && npm run dev`，开 `http://localhost:5174`：
1. 无 token → 自动跳 `/login`，显示登录表单
2. 用 `user/user123` 登录 → 成功 Toast → 跳 `/`（重定向到 `/fill`，此时 fill 还是占位页）
3. 直接访问 `/fill` → 有 token 放行
杀掉 dev（端口释放）。

- [ ] **Step 3: Commit**

```bash
git add mobile/src/views/login
git commit -m "feat: 移动端登录页与守卫验证"
```

---

### Task 4: 填报列表

**Files:**
- Create: `mobile/src/views/fill/index.vue`

**Interfaces:**
- Consumes: `useFillStore.loadNodes`（Task 2）
- Produces: `/fill` 页面（节点卡片列表，点击进详情）

- [ ] **Step 1: 实现填报列表**

`mobile/src/views/fill/index.vue`：

```vue
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useFillStore } from '@/stores/fill'

const fillStore = useFillStore()
const router = useRouter()
const loading = ref(false)

/** 加载业务填报节点列表 */
onMounted(async () => {
  loading.value = true
  try {
    await fillStore.loadNodes()
  } catch {
    showToast('加载失败')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="fill-list">
    <van-nav-bar title="业务填报" />
    <van-loading v-if="loading" class="page-loading" size="24">加载中...</van-loading>
    <van-empty v-else-if="!fillStore.nodes.length" description="暂无填报节点" />
    <van-cell-group v-else inset>
      <van-cell
        v-for="node in fillStore.nodes"
        :key="node.id"
        :title="node.title"
        :label="`${node.fields?.length ?? 0} 个字段`"
        is-link
        @click="router.push(`/fill/${node.id}`)"
      />
    </van-cell-group>
  </div>
</template>
```

- [ ] **Step 2: dev 验证**

运行 `cd mobile && npm run dev`，登录 user → 填报列表显示"台账填报"（user 角色只分配了 n1）1 个节点；登录 admin → 显示 台账填报/报表填报 2 个。杀掉 dev。

- [ ] **Step 3: Commit**

```bash
git add mobile/src/views/fill/index.vue
git commit -m "feat: 移动端填报列表"
```

---

### Task 5: 填报详情（Vant 表单适配 + 提交）

**Files:**
- Create: `mobile/src/utils/toVantFields.ts`、`mobile/src/utils/toVantFields.test.ts`、`mobile/src/views/fill/detail.vue`

**Interfaces:**
- Consumes: `useFillStore`（节点 fields）、`@shared/api/system.submitNodeData`
- Produces: 字段适配纯函数（可单测）+ `/fill/:nodeId` 动态表单页

- [ ] **Step 1: 写适配纯函数 + 失败测试**

`mobile/src/utils/toVantFields.test.ts`：

```ts
import { describe, expect, it } from 'vitest'
import { toVantFields } from './toVantFields'
import type { FieldConfig } from '@shared/types'

const fields: FieldConfig[] = [
  { prop: 'street', label: '街道名称', type: 'input', required: true },
  { prop: 'district', label: '所属区', type: 'select', options: [{ label: '东城区', value: '东城区' }] },
  { prop: 'kind', label: '类型', type: 'radio', options: [{ label: '月报', value: '月报' }] },
  { prop: 'note', label: '备注', type: 'textarea' },
]

describe('utils/toVantFields', () => {
  it('保留 prop/label/required，并给出默认 placeholder', () => {
    const result = toVantFields(fields)
    expect(result[0]).toMatchObject({ prop: 'street', label: '街道名称', required: true })
    expect(result[0].placeholder).toBe('请输入街道名称')
    expect(result[1].placeholder).toBe('请选择所属区')
    expect(result[3].type).toBe('textarea')
  })

  it('空数组返回空', () => {
    expect(toVantFields([])).toEqual([])
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

运行：`cd mobile && npm run test -- src/utils/toVantFields.test.ts`
预期：FAIL，`./toVantFields` 不存在。

- [ ] **Step 3: 实现适配函数**

`mobile/src/utils/toVantFields.ts`：

```ts
import type { FieldConfig } from '@shared/types'

/** 适配后的移动端表单字段（Vant 渲染用） */
export interface VantField {
  prop: string
  label: string
  type: FieldConfig['type']
  required: boolean
  options?: FieldConfig['options']
  placeholder: string
}

/** FieldConfig → Vant 表单字段（select/radio 用"请选择"，其余"请输入"） */
export function toVantFields(fields: FieldConfig[]): VantField[] {
  return fields.map((f) => {
    const choose = f.type === 'select' || f.type === 'radio'
    return {
      prop: f.prop,
      label: f.label,
      type: f.type,
      required: f.required ?? false,
      options: f.options,
      placeholder: f.placeholder ?? `${choose ? '请选择' : '请输入'}${f.label}`,
    }
  })
}
```

- [ ] **Step 4: 运行测试确认通过**

运行：`cd mobile && npm run test -- src/utils/toVantFields.test.ts`
预期：PASS（2 个用例）。

- [ ] **Step 5: 实现填报详情页**

`mobile/src/views/fill/detail.vue`：

```vue
<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showSuccessToast, showToast } from 'vant'
import { useFillStore } from '@/stores/fill'
import { submitNodeData } from '@shared/api/system'
import { toVantFields, type VantField } from '@/utils/toVantFields'
import type { FieldConfig } from '@shared/types'

const route = useRoute()
const router = useRouter()
const fillStore = useFillStore()

const nodeId = route.params.nodeId as string
const node = computed(() => fillStore.nodes.find((n) => n.id === nodeId))
const fields = computed(() => toVantFields(node.value?.fields ?? []))
const form = reactive<Record<string, unknown>>({})

// select 用 Picker 弹出选择
const pickerVisible = ref(false)
const activeField = ref<VantField | null>(null)

function openPicker(field: VantField) {
  activeField.value = field
  pickerVisible.value = true
}

function onPickerConfirm({ selectedOptions }: { selectedOptions: { text: string }[] }) {
  if (activeField.value) form[activeField.value.prop] = selectedOptions[0]?.text ?? ''
  pickerVisible.value = false
}

// date 用 Calendar
const calendarVisible = ref(false)

function onCalendarConfirm(value: Date) {
  if (activeField.value) {
    const y = value.getFullYear()
    const m = String(value.getMonth() + 1).padStart(2, '0')
    const d = String(value.getDate()).padStart(2, '0')
    form[activeField.value.prop] = `${y}-${m}-${d}`
  }
  calendarVisible.value = false
}

function openDate(field: VantField) {
  activeField.value = field
  calendarVisible.value = true
}

/** 必填校验 + 提交 */
async function submit() {
  for (const f of fields.value) {
    if (f.required && (form[f.prop] === undefined || form[f.prop] === '')) {
      showToast(`请填写${f.label}`)
      return
    }
  }
  try {
    await submitNodeData(nodeId, { ...form })
    showSuccessToast('提交成功')
    Object.keys(form).forEach((k) => delete form[k])
  } catch {
    // 错误已由请求层提示
  }
}
</script>

<template>
  <div class="fill-detail">
    <van-nav-bar :title="node?.title ?? '填报'" left-arrow @click-left="router.back()" />

    <van-form @submit="submit">
      <van-cell-group inset>
        <template v-for="field in fields" :key="field.prop">
          <van-field
            v-if="field.type === 'input' || field.type === 'number'"
            v-model="form[field.prop]"
            :name="field.prop"
            :label="field.label"
            :type="field.type === 'number' ? 'number' : 'text'"
            :placeholder="field.placeholder"
            :rules="field.required ? [{ required: true, message: field.placeholder }] : []"
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
                <van-radio v-for="o in field.options ?? []" :key="o.value" :name="o.value">
                  {{ o.label }}
                </van-radio>
              </van-radio-group>
            </template>
          </van-field>
        </template>
      </van-cell-group>

      <div style="margin: 16px">
        <van-button round block type="primary" native-type="submit">提交</van-button>
      </div>
    </van-form>

    <van-popup v-model:show="pickerVisible" position="bottom">
      <van-picker
        :columns="(activeField?.options ?? []).map((o) => o.label)"
        @confirm="onPickerConfirm"
        @cancel="pickerVisible = false"
      />
    </van-popup>
    <van-popup v-model:show="calendarVisible" position="bottom">
      <van-calendar
        :min-date="new Date(2000, 0, 1)"
        :max-date="new Date(2100, 11, 31)"
        @confirm="onCalendarConfirm"
        @close="calendarVisible = false"
      />
    </van-popup>
  </div>
</template>
```

- [ ] **Step 6: dev 验证**

运行 `cd mobile && npm run dev`，登录 user → 填报列表 → 台账填报：
1. 渲染 街道名称(输入)/人口数量(数字)/数据日期(日期)/所属区(下拉)/备注(多行) 表单
2. 必填留空点提交 → Toast 提示
3. 填全提交 → 提交成功 Toast + 表单重置
4. 直接改地址访问 `/fill/n2`（未分配节点）→ fill store 里无 n2，页面显示空表单（或可加提示）
杀掉 dev。

- [ ] **Step 7: Commit**

```bash
git add mobile/src/utils mobile/src/views/fill/detail.vue
git commit -m "feat: 移动端填报详情动态表单"
```

---

### Task 6: 个人中心 + 修改密码

**Files:**
- Create: `mobile/src/views/profile/index.vue`、`mobile/src/views/password/index.vue`

**Interfaces:**
- Consumes: `@shared/api/auth.getMe/changePassword`、`useUserStore`
- Produces: `/profile`（昵称/角色 + 修改密码入口 + 退出）、`/password`（改密）

- [ ] **Step 1: 实现个人中心**

`mobile/src/views/profile/index.vue`：

```vue
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showConfirmDialog } from 'vant'
import { getMe } from '@shared/api/auth'
import type { UserInfo } from '@shared/types'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const userInfo = ref<UserInfo | null>(null)

onMounted(async () => {
  try {
    const { userInfo: info } = await getMe()
    userInfo.value = info
  } catch {
    // 错误已提示
  }
})

/** 退出登录：确认后清 token 跳登录 */
async function onLogout() {
  await showConfirmDialog({ title: '提示', message: '确定退出登录？' })
  userStore.logout()
  router.replace('/login')
}
</script>

<template>
  <div class="profile">
    <van-nav-bar title="我的" />
    <van-cell-group inset>
      <van-cell title="昵称" :value="userInfo?.nickname ?? ''" />
      <van-cell title="账号" :value="userInfo?.username ?? ''" />
      <van-cell title="角色" :value="(userInfo?.roles ?? []).join('、')" />
      <van-cell title="修改密码" is-link to="/password" />
    </van-cell-group>
    <div style="margin: 32px 16px">
      <van-button round block type="danger" @click="onLogout">退出登录</van-button>
    </div>
  </div>
</template>
```

- [ ] **Step 2: 实现修改密码页**

`mobile/src/views/password/index.vue`：

```vue
<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showSuccessToast, showToast } from 'vant'
import { changePassword } from '@shared/api/auth'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const submitting = ref(false)
const form = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })

/** 修改密码：校验后提交，成功清 token 跳登录 */
async function submit() {
  if (!form.oldPassword || !form.newPassword) {
    showToast('请填写完整')
    return
  }
  if (form.newPassword.length < 6) {
    showToast('新密码至少 6 位')
    return
  }
  if (form.newPassword !== form.confirmPassword) {
    showToast('两次输入不一致')
    return
  }
  submitting.value = true
  try {
    await changePassword({ oldPassword: form.oldPassword, newPassword: form.newPassword })
    showSuccessToast('修改成功，请重新登录')
    userStore.logout()
    router.replace('/login')
  } catch {
    // 错误已提示
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="password-page">
    <van-nav-bar title="修改密码" left-arrow @click-left="router.back()" />
    <van-form @submit="submit">
      <van-cell-group inset>
        <van-field v-model="form.oldPassword" type="password" label="原密码" placeholder="请输入原密码" />
        <van-field v-model="form.newPassword" type="password" label="新密码" placeholder="至少 6 位" />
        <van-field v-model="form.confirmPassword" type="password" label="确认新密码" placeholder="再次输入" />
      </van-cell-group>
      <div style="margin: 16px">
        <van-button round block type="primary" native-type="submit" :loading="submitting">确认修改</van-button>
      </div>
    </van-form>
  </div>
</template>
```

- [ ] **Step 3: dev 验证**

运行 `cd mobile && npm run dev`，登录 user：
1. 我的 → 显示 昵称/账号/角色
2. 修改密码 → 用 user123 改成新密码 → 成功跳登录 → 用新密码登录成功 → **再把 mock 密码改回 user123**（`mock/auth.ts` 的 users seed）→ 重新登录验证
3. 退出登录 → 确认 → 跳登录
杀掉 dev（端口释放）。

- [ ] **Step 4: Commit**

```bash
git add mobile/src/views/profile mobile/src/views/password
git commit -m "feat: 移动端个人中心与修改密码"
```

---

### Task 7: Capacitor 壳打包

**Files:**
- Create: `mobile/capacitor.config.ts`
- Modify: `mobile/package.json`（加 Capacitor 依赖与脚本）、`mobile/vite.config.ts`（可加 `base: './'` 或保持）

**Interfaces:**
- Consumes: mobile 构建产物（dist/）
- Produces: Android 壳工程（`mobile/android/`）+ `cap sync` 链路可跑

- [ ] **Step 1: 安装 Capacitor 依赖并初始化**

在 `mobile/` 下：

```bash
npm install @capacitor/core@^7 @capacitor/cli@^7 @capacitor/android@^7
```

`mobile/capacitor.config.ts`：

```ts
import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.fengtai.sysview',
  appName: '业务填报',
  webDir: 'dist',
}

export default config
```

- [ ] **Step 2: 生成 Android 壳工程**

```bash
cd mobile
npx cap init 业务填报 com.fengtai.sysview --web-dir dist 2>/dev/null || true
npx cap add android
```

- [ ] **Step 3: 构建 + 同步验证**

```bash
cd mobile
npm run build        # 产出 dist
npx cap sync         # 把 dist 同步进 android 工程
```

预期：`android/` 工程生成，`cap sync` 成功（`android/app/src/main/assets/public` 出现 dist 内容）。无需打开 Android Studio 打包 APK（链路验证到 sync 为止）。

（注意：`cap add android` 需要 Android SDK 环境，若本机无 SDK，`cap add` 可能报错——此时报告 BLOCKED 并说明，Capacitor 配置与脚本仍保留，壳打包留到有 SDK 的环境执行。）

- [ ] **Step 4: Commit**

```bash
git add mobile/capacitor.config.ts mobile/package.json mobile/package-lock.json mobile/android
git commit -m "feat: Capacitor Android 壳工程"
```

---

### Task 8: 端到端权限联动验证 + README 更新

**Files:**
- Modify: `README.md`（补移动端说明）

**Interfaces:**
- Consumes: 全部已完成功能
- Produces: 双端权限联动验证 + 文档

- [ ] **Step 1: 全量测试**

PC 端：`npm run test`（37 全绿）；移动端：`cd mobile && npm run test`（2 个用例）。
PC 端 build：`npm run build`。

- [ ] **Step 2: 端到端权限联动验证（浏览器双开）**

1. PC `http://localhost:5173` 登录 admin → 节点管理 → 新建节点 n3（含字段）→ 角色管理 → 给"普通用户"勾选 n3 → 保存
2. 移动端 `http://localhost:5174` 登录 user → 填报列表应显示 台账填报(n1) + 新节点(n3)
3. 移动端进入 n3 → 按配置字段渲染 → 提交 → mock 收到
4. 移动端 user 的"我的"页：无系统管理入口（移动端本就没有）；确认节点可见性只来自角色分配
5. 验证后重启两端 dev 恢复 mock 种子

- [ ] **Step 3: README 补移动端说明**

`README.md` 增加"移动端"一节：

```markdown
## 移动端（mobile/）

H5 应用（Vue 3 + Vant），与 PC 端共用后端接口契约（shared/）。覆盖轻量子集：登录、业务填报、个人中心、修改密码。

```bash
cd mobile
npm install
npm run dev     # 端口 5174，开发（共用仓库根 mock）
npm run build   # 产出 dist，配合 Capacitor 打 App 壳
```

- `shared/`：两端共用的 types + api 接口层 + token 工具（PC 端通过 src/ 下薄 re-export 引用，import 路径不变）
- Capacitor：`npx cap sync` 同步到 android/ 工程，App 内跨域需后端开 CORS 或集成 @capacitor/http
```

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: README 补充移动端说明"
```

---

## Self-Review

**1. Spec 覆盖检查：**

| Spec 要求 | 对应 Task |
|---|---|
| shared 提取（types/api/token）+ PC 薄 re-export | Task 1 |
| PC 端回归（37 测试 + build） | Task 1 Step 6 |
| 移动端脚手架（Vant + 路由 + pinia + @shared + mock） | Task 2 |
| 登录 + 守卫 | Task 3 |
| 填报列表（getMe 筛节点） | Task 4 |
| 填报详情（动态表单 + 提交） | Task 5 |
| 个人中心 + 修改密码 + TabBar | Task 2（TabBar）+ Task 6 |
| Capacitor 壳 | Task 7 |
| 端到端权限联动验证 | Task 8 |

**2. 占位符扫描：** 无 TBD/TODO；每个代码步骤有完整代码。

**3. 类型一致性：**
- shared 内部相对路径引用（`../types`、`./request`），PC re-export 走 `@shared` 别名，mobile 同样 `@shared`。
- `VantField` 与 `FieldConfig` 字段对齐；`toVantFields` 返回 `VantField[]`。
- `notifyError`/`setNotifyError` 在 shared/api/request.ts 定义，PC main.ts 与 mobile main.ts 各注入实现。
- 移动端路由 `route.params.nodeId` 与 fill store 的 `node.id` 一致。

**已知待办（非计划缺陷）：**
- Task 2 Step 4 的占位页在 Task 3-6 逐个替换为真实页面（替换时删除占位内容）。
- `cap add android` 依赖本机 Android SDK，若无则 Task 7 报告 BLOCKED，壳工程留待有 SDK 环境。
- 移动端填报详情对未分配节点（直接访问 /fill/n2）只显示空表单，无 404 拦截——移动端路由简单化，可接受。
- App 内跨域（接真实后端时）需后端 CORS 或 @capacitor/http，本期浏览器 H5 形态验证。
- PC 端 request.test.ts 的消息断言从 mock element-plus 改为注入 spy（Task 1 Step 5）。
