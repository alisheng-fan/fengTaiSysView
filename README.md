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
