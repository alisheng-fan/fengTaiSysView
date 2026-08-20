# fengTaiSysView

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

## 移动端（mobile/）

H5 应用（Vue 3 + Vant），与 PC 端共用后端接口契约（shared/）。覆盖轻量子集：登录、业务填报、个人中心、修改密码。

```bash
cd mobile
npm install
npm run dev     # 端口 5174，开发（共用仓库根 mock/ 目录；各 dev server 进程独立，内存态不互通）
npm run build   # 产出 dist，配合 Capacitor 打 App 壳
```

- `shared/`：两端共用的 types + api 接口层 + token 工具（PC 端通过 src/ 下薄 re-export 引用，import 路径不变）
- Capacitor：`npx cap sync` 同步到 android/ 工程，App 内跨域需后端开 CORS 或集成 @capacitor/http
- 演示限制：PC(5173) 与移动端(5174) 是两个独立 dev server 进程，各自持有独立的 mock 内存态（节点/角色配置），互不贯通——「PC 端配置节点 → 移动端看到」需接真实后端（或改用单进程/同一 dev server 验证联动逻辑）

### Capacitor 已知待办（接真实后端 / 打 APK 前）

- `createWebHistory()` 深层路由在静态壳内刷新无 history 回退（需 hash 模式或服务端回退）
- 401 时 `window.location.href = '/login'` 在 WebView（origin http://localhost）内不可用，需改为应用内路由跳转
- `mobile/.env.production` 的 `VITE_API_BASE_URL=/api` 在 App 内无意义，需绝对地址 + 后端 CORS
