# fengTaiSysView

丰台区企业级 RBAC 中后台 + 移动填报双端系统（Vue 3 + TypeScript）。

PC 端（Element Plus 中后台）+ 移动端（Vant H5，可打 App 壳），**两端共用同一套后端接口契约**（`shared/`）。

## 功能模块

| 模块       | 说明                                                                                                                                       | 端        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| 系统管理   | 部门 / 角色 / 用户 / 节点 / 项目 / 阶段 / 触发条件 / 人员 / 登录日志；节点可配置动态填报字段、挂项目与阶段、编排流程顺序、设时限/科室/前置/必要/默认；角色分配权限 | PC        |
| 阶段管理   | 四层配置模型之阶段层：前期立项 / 土地征地 / 土地供应 / 建设及核验，阶段 CRUD（前置/是否齐全/级别/顺序）                                      | PC        |
| 触发条件   | 规则引擎：字段值条件 → 开启/隐藏节点（填报页提交前实时判定，两端共用 /api/engine/apply）                                                   | PC + 移动 |
| 公示公告   | 公告 CRUD（类型/标题/内容/发布单位/时间）；移动端公告列表 + 详情弹层                                                                         | PC + 移动 |
| 通知提醒   | 节点提交后自动生成下一环节提醒（mock 自动推送）；列表 + 未读红点 + 标记已读                                                                  | PC + 移动 |
| 人员管理   | 人员 CRUD（姓名/部门/电话/邮箱），用户可关联人员（perId）                                                                                    | PC        |
| 登录日志   | 登录成功/失败记录（错误密码自动写 status 0 日志）                                                                                            | PC        |
| 项目全周期 | 项目 / 流程节点 / 阶段看板 / 进展填报（记录列表+编辑）/ 问题上报 / 监测统计（两端共用后端契约）                                                | PC + 移动 |
| 统计增强   | 节点完成率 / 超时节点与超时项目 / 科室效率 / 超时清单（PC 卡片+表格；移动端监测页 6 卡 + 完成率进度条 + 科室效率 + 超时清单）                  | PC + 移动 |
| 附件       | 节点附件上传/列表（mock 存文件名与路径，真实上传待后端）；仅移动端填报页                                                                     | 移动      |
| 移动端看板 | 项目详情按阶段分组节点（阶段名 + 节点列表 + 完成状态 + 超时高亮 + 时限 + 经办科室）                                                          | 移动      |
| 修改密码   | 原密码 / 新密码 / 确认，所有角色可用                                                                                                         | PC + 移动 |
| 仪表盘     | 统计卡片 + 图表                                                                                                                            | PC        |

- **权限（RBAC）**：角色决定菜单与项目/流程节点的可见性，按钮级 `v-perm` 权限指令。
- **非管理员（user）**：系统管理内仅"修改密码"，项目全周期仅分配到节点的进展填报。

## 技术栈

| 端                | 栈                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------ |
| PC（`src/`）      | Vite 5 · Vue 3 · TypeScript · Pinia · Vue Router 4 · Element Plus · ECharts · Vitest |
| 移动（`mobile/`） | Vite 5 · Vue 3 · Vant 4 · Pinia · Vue Router 4 · Capacitor 7（App 壳） · Vitest      |
| 共享（`shared/`） | types + api 接口层 + token 工具（两端唯一接口契约）                                  |

## 快速开始

**PC 端：**

```bash
npm install
npm run dev        # 开发（Mock 生效，端口 5173）
npm run test       # 单元测试
npm run build      # 生产构建
```

**移动端（H5 / App）：**

```bash
cd mobile
npm install
npm run dev        # 开发（端口 5174，浏览器开手机视图即可）
npm run build      # 产出 dist，配合 Capacitor 打 App 壳
npx cap sync       # 同步到 android/ 工程
```

## 演示账号

| 账号  | 密码     | 权限                                           |
| ----- | -------- | ---------------------------------------------- |
| admin | admin123 | 全部菜单 / 节点 / 按钮权限                     |
| user  | user123  | 系统管理仅修改密码；项目全周期仅分配节点的填报 |

## 目录与架构

```
├── src/       # PC 端（登录、仪表盘、系统管理、项目全周期）
├── mobile/    # 移动端（Vant H5 轻量子集 + Capacitor 壳）
├── shared/    # ★ 两端共用：types + api 接口层 + token 工具
├── mock/      # Mock 数据（dev 生效，两端共用同一份数据源）
└── docs/      # 业务需求（business/）、设计文档（specs/）与实现计划（plans/）
```

- **`shared/api/` 是唯一发请求的地方**。PC 端 `src/types`、`src/api`、`src/utils/auth` 为薄 re-export（`export * from '@shared/...'`），原有 import 路径不变。
- 三层架构：视图层 → 状态层 → 接口层；权限数据驱动（菜单/路由/按钮均来自后端 MenuNode 树）。

## 接入真实后端

1. **两端各自 `.env.*`**：`VITE_API_BASE_URL` 指向后端、`VITE_USE_MOCK=false`；PC 配 `vite.config.ts` 的 `server.proxy`，移动端 App 版用绝对地址 + 后端开 CORS。
2. 按后端实际返回微调 `shared/types` 与 `shared/api`。
3. 两端一起切换，业务页面零改动。

## 移动端与 Capacitor

H5 应用（Vue 3 + Vant），与 PC 端共用后端接口契约（`shared/`）。覆盖轻量子集：登录、首页项目查询、项目详情（流程节点）、进展填报（记录+编辑）、问题上报、监测统计、个人中心、修改密码（4-tab：首页 / 监测 / 我的 / 进度）。

- `shared/`：两端共用的 types + api 接口层 + token 工具（PC 端通过 src/ 下薄 re-export 引用，import 路径不变）
- Capacitor：`npx cap sync` 同步到 android/ 工程，App 内跨域需后端开 CORS 或集成 @capacitor/http
- **演示限制**：PC(5173) 与移动端(5174) 默认是两个独立 dev server 进程，各自持有独立的 mock 内存态（节点/角色配置），互不贯通——「PC 端配置节点 → 移动端看到」需接真实后端，或用单实例验证联动逻辑：
  ```bash
  # 移动端 dev 指向 PC 的 mock（同一数据实例，Task 12 端到端即此方式）：
  cd mobile && VITE_USE_MOCK=false VITE_API_BASE_URL=http://localhost:5173/api npm run dev
  ```

### Capacitor 已知待办（接真实后端 / 打 APK 前）

- `createWebHistory()` 深层路由在静态壳内刷新无 history 回退（需 hash 模式或服务端回退）
- 401 时 `window.location.href = '/login'` 在 WebView（origin http://localhost）内不可用，需改为应用内路由跳转
- `mobile/.env.production` 的 `VITE_API_BASE_URL=/api` 在 App 内无意义，需绝对地址 + 后端 CORS
- 打 APK 需本机 Android SDK（`cap add/sync` 不需要，仅 Gradle 打包需要）
