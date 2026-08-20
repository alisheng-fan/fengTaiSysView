# fengTaiSysView PC + 移动端双端架构设计

- 日期：2026-08-20
- 状态：设计已确认，待实现
- 类型：架构扩展（新增移动端，与 PC 端共用一套后台）

## 1. 目标与范围

### 1.1 目标

现有 PC 端中后台（fengTaiSysView）之外，新增一套手机 APP，两者**共用一套后端**。手机 APP 采用 **H5 + Capacitor 壳打包**形态，覆盖**轻量子集**功能（填报、个人中心、修改密码），复杂管理（节点/角色/用户/部门配置）保留在 PC 端。

### 1.2 已确认决策

| 项 | 决定 |
|---|---|
| APP 形态 | H5（Vue 3 + Vant 4），浏览器直接访问；用 Capacitor 打包成 Android/iOS 壳 |
| 功能范围 | 轻量子集：填报节点表单、个人中心、修改密码；系统管理留 PC 端 |
| 代码组织 | 方案 B：PC 端 `src/` 保持现状 + 提取 `shared/` + 新增 `mobile/` 独立 Vite 工程 |
| 接口契约 | shared 单一来源，两端共用同一 mock / 同一后端切换机制 |
| 登录 | 复用后端同一账号体系与 token |
| 后端 | 前端先行（mock），接口层已隔离，两端一起切真实后端 |

### 1.3 非目标（本期）

- 待办/审批功能：当前 PC 端不具备，属后续扩展（需后端 + PC + 移动一起新增）
- App 内跨域联调：首期用浏览器 H5 形态验证，壳跨域在接真实后端时处理（后端开 CORS 或 @capacitor/http）
- 原生推送、离线缓存、应用商店上架流程

## 2. 代码组织（方案 B）

```
fengtaiSysView/
├── src/          # 现有 PC 端（保持现状，types/api/utils 改薄 re-export）
├── shared/       # 共享：types + api 接口层 + 通用工具
├── mobile/       # 新增移动端独立 Vite 工程（import @shared）
├── mock/         # mock 两端共用（vite-plugin-mock）
└── docs/         # 设计/计划文档
```

## 3. shared 提取

### 3.1 目录结构

```
shared/
├── types/index.ts       # 全部类型（ApiResult/MenuNode/FieldConfig/NodeItem/UserInfo…）
├── api/
│   ├── request.ts       # axios 工厂 + 拦截器（token 注入/401/错误提示）
│   ├── auth.ts          # login/logout/getMe/changePassword
│   └── system.ts        # 部门/角色/用户/节点/菜单树/填报提交
└── utils/
    └── auth.ts          # token 读写
```

**PC 专用、不进 shared**：
- `src/utils/form.ts`（toFormFields）——依赖 PC 的 ProForm `FormField` 类型，放 shared 会形成 shared→PC 反向依赖；移动端有自己的 Vant 适配层，无需它
- `src/utils/menu.ts`（buildMenuIdsFromLeaves）——仅 PC 角色分配使用，留在 PC 端
- 两者及各自测试保持原位置不动

### 3.2 关键设计

- **request.ts 读 `import.meta.env.VITE_API_BASE_URL`**：PC 端与移动端各自 env 定义（dev 都是 `/api` 走同一 mock，生产各自指向后端），共享 request 无需改动。
- **PC 端薄 re-export**：types、api、utils/auth 移入 shared 后，原位置保留 re-export（如 `src/types/index.ts` → `export * from '@/shared/types'`），**PC 端所有现有 `@/types`、`@/api/auth`、`@/utils/auth` 的 import 路径不变**，零改动工作。`@/utils/form`、`@/utils/menu` 是 PC 专用，保持真实文件。
- **别名**：两端各自 vite.config 加 `@shared` → shared/。
- **mock 不动**：仓库根 `mock/` 保持，两端 dev 都指向它。

## 4. 移动端工程（mobile/）

### 4.1 结构

```
mobile/
├── index.html / vite.config.ts / .env.development / .env.production
├── src/
│   ├── main.ts                    # Vant + 路由 + pinia
│   ├── router/index.ts            # 移动端路由 + 守卫（无 token → 登录）
│   ├── stores/user.ts             # 轻量 user store（登录/登出，token 复用 shared）
│   ├── layouts/MainTab.vue        # 底部 TabBar（填报 / 我的）
│   ├── views/
│   │   ├── login/index.vue        # 登录页（Vant Field + Button）
│   │   ├── fill/index.vue         # 填报节点列表（从 /auth/me 菜单筛出业务填报节点）
│   │   ├── fill/detail.vue        # 单个节点填报表单（动态渲染 + 提交）
│   │   ├── profile/index.vue      # 个人中心（昵称/角色 + 退出登录）
│   │   └── password/index.vue     # 修改密码
│   └── styles/
```

### 4.2 页面清单（轻量子集）

| 页面 | 说明 |
|---|---|
| 登录 | 账号密码，调 shared `login`；成功跳填报列表 |
| 填报列表 | 调 `getMe()` 拿菜单 → 筛出业务填报子节点（标题/字段预览）→ 点击进入 |
| 填报详情 | 按节点 `fields` 动态渲染移动端表单 → 提交 `submitNodeData` → 成功 Toast + 重置 |
| 个人中心 | 昵称/角色展示 + 修改密码入口 + 退出登录 |
| 修改密码 | 原/新/确认，调 shared `changePassword`，成功跳登录 |

### 4.3 移动端表单适配（核心工作量）

Vant 是声明式 Field 组件，做一层 `FieldConfig[] → Vant 表单` 适配：

| FieldConfig.type | Vant 控件 |
|---|---|
| input | van-field |
| textarea | van-field type="textarea" |
| number | van-field type="number" |
| select | van-picker（弹出选择） |
| date | van-calendar |
| radio | van-radio-group |

- 必填校验用 Vant `rules`（或提交前手动校验）
- 适配函数独立可单测

### 4.4 登录/权限

- 复用后端同一 `/auth/login`、同一 token 体系
- 移动端路由守卫检查 token，逻辑与 PC 端一致但独立实现（不共享 PC 的 router 守卫）

## 5. 壳打包（Capacitor）

```
mobile/ 开发 → npm run build（产出 dist）
            → npx cap sync（同步到 android/ios 原生壳）
            → npx cap open android（Android Studio 签名打包 APK）
```

**App 内访问后端（与纯浏览器不同）**：
- 浏览器 H5：`VITE_API_BASE_URL=/api` 相对路径，走同域代理/nginx
- App 壳（WebView origin 为 http://localhost）：跨域访问内网后端——
  - 后端开 CORS + App 用绝对地址 `VITE_API_BASE_URL=http://<内网后端>/hrSystem`（推荐）
  - 或集成 `@capacitor/http` 原生网络插件绕过 WebView CORS
- 两个构建产物区分浏览器版 / App 版（同一套代码，不同 env）

## 6. mock 与后端切换（两端统一）

| 阶段 | PC 端 | 移动端 |
|---|---|---|
| 开发 | `VITE_USE_MOCK=true`，走仓库根 mock/ | 同左，共用同一套 mock |
| 接真实后端 | `VITE_USE_MOCK=false` + `VITE_API_BASE_URL` 指后端 + 配 proxy | 同左；App 版改绝对地址 + 后端 CORS |

- shared api 层两端零改动切换；换后端只改各自 env + mock 开关

## 7. 首期交付范围

1. shared 提取（types + api + utils）+ PC 端薄 re-export 改造，PC 端回归（37 测试绿 + build）
2. 移动端脚手架（Vite + Vue 3 + Vant 4 + 路由 + pinia + @shared + mock）
3. 登录页 + 守卫
4. 填报列表（/auth/me 筛业务填报节点）
5. 填报详情（动态表单 + 提交）
6. 个人中心 + 修改密码
7. Capacitor 壳（android 工程生成 + cap sync 验证）
8. 权限联动验证（PC admin 配节点/分配角色 → 移动端 user 看到对应节点）

## 8. 测试策略

| 层 | 方式 |
|---|---|
| shared 纯函数 | 单测保留（request 拦截器、token 工具）；PC 专用函数（toFormFields、buildMenuIdsFromLeaves）随 PC 端测试保留原位 |
| 移动端逻辑 | 表单适配函数、节点菜单筛选单测 |
| 端到端手测 | PC admin 配节点 → 移动端 user 看到节点 → 填报提交 → mock 收到 |
| 壳 | `npm run build && npx cap sync` 通过 + 浏览器移动视图验证 |

## 9. 风险与后续

- 待办/审批：当前系统无此能力，列为后续扩展（后端 + PC + 移动一起加）
- App 内跨域：需后端配合 CORS（或 @capacitor/http），首期浏览器 H5 形态验证
- Vant 表单适配层是移动端核心工作量，独立可测
- PC 端薄 re-export 改造是一次性重构，需 PC 端回归验证
