# fengTaiSysView 对齐 TBXT 全生命周期能力实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox syntax.

**Goal:** 按 tbxt 把 fengTaiSysView 完善到业务深度：阶段层、节点元数据（时限/科室/核心/前置）、字段触发规则、公示公告、通知提醒、附件、人员+登录日志、统计增强、移动端看板。

**Architecture:** 沿用 shared/ 契约 + mock（globalThis 单源）+ PC Element Plus + 移动 Vant 4-tab。数据模型升级为四层（项目→阶段→节点→信息项）；规则引擎为 mock 简化纯函数（applyConditions）；统计聚合扩展。

**Spec:** [docs/superpowers/specs/2026-08-20-feng-tai-sys-view-tbxt-alignment-design.md](../specs/2026-08-20-feng-tai-sys-view-tbxt-alignment-design.md)
**业务依据:** `D:\fengtai\tbxt`（数据库设计.md）

## Global Constraints

- 沿用全部约定：shared/ 唯一契约、mock globalThis 单源、TDD、conventional commits。
- **NodeItem 升级**：加 `phaseId`（必填）、`preNodeIds?`/`preIsAll?`/`isNeed`/`isDefault`/`dutyDepId?`/`deadlineDays?`/`deadline?`。现有种子/测试同步。
- 新 mock 数组：`__fengtaiPhases`/`__fengtaiAnnouncements`/`__fengtaiNotices`/`__fengtaiPers`/`__fengtaiLoginLogs`/`__fengtaiConditions`/`__fengtaiFiles`。
- 规则引擎：`applyConditions(nodeId, values)` 纯函数，可单测；移动端填报前调用，按结果开启/隐藏节点与字段。
- 附件：mock 存路径（文件名入数组），不上传。
- 外部数据源推送（biz_external_source）不在本期（需真实后端）。
- 演示账号沿用 admin/user；新菜单/权限码：system:phase / system:announcement / system:notice / system:per / system:loginlog / system:condition / system:file。

## 文件结构总览

| 路径 | 职责 |
|---|---|
| `shared/types/index.ts` | PhaseItem/FieldCondition/AnnouncementItem/NoticeItem/FlowFileItem/PerItem/LoginLogItem；NodeItem 升级；StatsOverview 扩展 |
| `shared/api/system.ts` | phase/condition/announcement/notice/file/per/loginlog + 统计扩展 |
| `shared/api/engine.ts` | `applyConditions(nodeId, values)` |
| `mock/phase.ts` / `announcement.ts` / `notice.ts` / `per.ts` / `loginlog.ts` / `condition.ts` / `file.ts` | 各表 mock（globalThis） |
| `mock/nodes.ts` | 节点升级（phaseId/时限/科室/前置）+ 附件关联 |
| `mock/project.ts` | 统计聚合扩展（含超时/科室效率） |
| `mock/auth.ts` | 登录写登录日志 |
| `src/views/system/phase/index.vue` | 阶段管理 |
| `src/views/system/node/index.vue` | 节点管理升级（阶段/前置/时限/科室/核心） |
| `src/views/system/cond/index.vue` | 触发条件管理 |
| `src/views/system/announcement/index.vue` | 公示公告 |
| `src/views/system/notice/index.vue` | 通知提醒 |
| `src/views/system/per/index.vue` | 人员管理 |
| `src/views/system/loginlog/index.vue` | 登录日志 |
| `src/views/system/project/index.vue` | 项目管理升级 |
| `src/views/system/stats/index.vue` | 统计增强 |
| `mobile/src/views/project/detail.vue` | 阶段看板（按阶段分组节点） |
| `mobile/src/views/project/node-fill.vue` | 填报升级（时限/超时/附件/规则显隐） |
| `mobile/src/views/notice/index.vue` | 通知列表 |
| `mobile/src/views/announcement/index.vue` | 公告列表 |
| `mobile/src/views/monitor/index.vue` | 监测增强 |
| README/docs | 更新 |

---

### Task 1: 数据模型 + 接口层扩展

**Files:** `shared/types/index.ts`、`shared/api/system.ts`、`shared/api/engine.ts`

**Interfaces:** 全部新类型/api；NodeItem 升级；`applyConditions` 纯函数签名

- [ ] **Step 1: 类型扩展**

`shared/types/index.ts` 按 spec 追加 PhaseItem/FieldCondition/AnnouncementItem/NoticeItem/FlowFileItem/PerItem/LoginLogItem，NodeItem 加 phaseId/preNodeIds?/preIsAll?/isNeed/isDefault/dutyDepId?/deadlineDays?/deadline?，StatsOverview 加 nodeTotal/nodeDone/nodeRate/overdueNodes/overdueProjects/depEfficiency。

- [ ] **Step 2: 接口层**

`shared/api/system.ts` 追加：phase CRUD、condition CRUD、announcement CRUD、notice list/read、file list/upload（mock 传名）、per CRUD、loginlog list。`getStatisticsOverview` 返回扩展类型。

`shared/api/engine.ts`：

```ts
import { request } from './request'

/** 规则引擎：按填报值返回应开启/隐藏的节点与字段 */
export interface EngineResult {
  openNodeIds: string[]
  hideFieldIds: string[]
}

export function applyConditions(nodeId: string, values: Record<string, unknown>): Promise<EngineResult> {
  return request<EngineResult>({ url: '/engine/apply', method: 'post', data: { nodeId, values } })
}
```

- [ ] **Step 3: 回归验证 + Commit**

`npm run test`（39）+ `npm run build`；`feat: TBXT 对齐数据模型与接口层`

---

### Task 2: mock 扩展（阶段/条件/公告/通知/人员/日志/文件 + 节点升级 + 规则引擎 + 统计扩展）

**Files:** 新建 `mock/phase.ts`、`mock/condition.ts`、`mock/announcement.ts`、`mock/notice.ts`、`mock/per.ts`、`mock/loginlog.ts`、`mock/file.ts`、`mock/engine.ts`；改 `mock/nodes.ts`、`mock/project.ts`、`mock/auth.ts`、相关测试

**Interfaces:** 全部新端点；`applyConditions` mock 实现（纯函数可单测）

- [ ] **Step 1: mock/phase.ts + per.ts + loginlog.ts + announcement.ts + notice.ts + condition.ts + file.ts**

各文件：globalThis 数组 + CRUD 端点（沿用既有模式）。种子：
- phases：4 阶段（前期立项/土地征地/土地供应/建设及核验），p2 项目挂 土地征地(含 n1 征地公告/草拟公告节点) + 建设及核验(含 n2 监督节点)——适度
- pers：2 人（张三/规划实施科、李四/数据科）
- loginlogs：2 条种子（admin 成功、user 成功）
- announcements：2 条（征地公告公示/土地供应公告，项目 p1/p2）
- notices：1 条（提醒 数据科 处理 n2）
- conditions：1 条（n2 在 n1 某字段=是 时 OPEN）
- files：1 条种子

- [ ] **Step 2: mock/nodes.ts 升级**

节点种子加 phaseId/preNodeIds?/isNeed/isDefault/dutyDepId/deadlineDays/deadline。n1（台账填报）→ phase 土地征地、dutyDep 规划实施科、deadlineDays 10、isDefault true；n2（报表填报）→ phase 建设及核验、dutyDep 数据科、preNodeIds ['n1']、isNeed true、isDefault false。buildNodeMenuChildren 不变。

- [ ] **Step 3: mock/engine.ts（规则引擎纯函数 + 端点）**

```ts
import type { FieldCondition } from '@/types'
import { conditions } from './condition'
import { fillRecords } from './nodes'

/** 按触发节点的填报值判断条件是否满足 */
export function evalCondition(cond: FieldCondition, values: Record<string, unknown>): boolean {
  const v = values[cond.triggerFieldId]
  switch (cond.operator) {
    case 'eq': return String(v) === cond.condValue
    case 'neq': return String(v) !== cond.condValue
    case 'in': return String(v).split(',').includes(cond.condValue)
    case 'notin': return !String(v).split(',').includes(cond.condValue)
    case 'empty': return v === undefined || v === '' || v === null
    case 'notempty': return v !== undefined && v !== '' && v !== null
    default: return false
  }
}

/** 规则引擎：给定目标节点 + 该节点已提交的填报值，返回应开启的节点与应隐藏的字段 */
export function applyConditions(targetNodeId: string, values: Record<string, unknown>): {
  openNodeIds: string[]
  hideFieldIds: string[]
} {
  const openNodeIds: string[] = []
  const hideFieldIds: string[] = []
  for (const cond of conditions.filter((c) => c.enabled && c.triggerNodeId === targetNodeId)) {
    const hit = evalCondition(cond, values)
    if (cond.action === 'OPEN' && hit) openNodeIds.push(cond.nodeId)
    if (cond.action === 'HIDE' && hit) hideFieldIds.push(cond.triggerFieldId)
  }
  return { openNodeIds: [...new Set(openNodeIds)], hideFieldIds: [...new Set(hideFieldIds)] }
}
```

端点 `POST /api/engine/apply`：取 body.nodeId 的最新填报记录 values → applyConditions。

- [ ] **Step 4: mock/project.ts 统计扩展**

`buildOverview` 扩展签名（传入 nodes + depts）：计算 nodeTotal/nodeDone/overdue（deadline < now 且未完成）/depEfficiency（按 dutyDepId 分组 完成/总数）。更新测试。

- [ ] **Step 5: mock/auth.ts 登录写日志**

login 端点成功/失败时 push 登录日志。

- [ ] **Step 6: 测试 + Commit**

单测：`mock/engine.test.ts`（evalCondition 各 operator + applyConditions 开启/隐藏）、`mock/project.test.ts` 更新。全量测试 + build。`feat: TBXT 对齐 mock 数据与规则引擎`

---

### Task 3: PC 阶段管理 + 节点管理升级

**Files:** 新建 `src/views/system/phase/index.vue`；改 `src/views/system/node/index.vue`

**Interfaces:** phase CRUD 页；节点管理加 阶段/前置/时限/科室/核心/默认 字段

- [ ] **Step 1: 阶段管理页**（仿项目页 CRUD：名称/前置阶段/是否齐全/级别/顺序，v-perm system:phase:*）
- [ ] **Step 2: 节点管理升级**：表格加 所属阶段/经办科室/时限/是否必要/是否默认 列；表单加 phaseId select（getPhaseList）+ dutyDepId select（getDeptList）+ deadlineDays number + isNeed/isDefault radio + preNodeIds multi-select（getNodeList）
- [ ] **Step 3: mock/menus.ts 加阶段管理菜单（id '27'）** + admin menuIds + auth.test 断言；dev 验证 + Commit `feat: PC 阶段管理与节点管理升级`

---

### Task 4: PC 触发条件 + 项目管理升级

**Files:** 新建 `src/views/system/cond/index.vue`；改 `src/views/system/project/index.vue`

**Interfaces:** 条件 CRUD 页（目标节点/触发节点/触发字段/运算符/条件值/动作）；项目页加 编码/土地用途/土地性质/项目类型/容积率

- [ ] **Step 1: 触发条件页**（表格 + ProForm：目标节点 select、触发节点 select、触发字段 select（按触发节点 loadNodeList→fields）、运算符 select、条件值 input、动作 radio OPEN/HIDE、启用）
- [ ] **Step 2: 项目管理升级**：表单加 prjCode/landUse/landType/prjType/ratio 字段；类型补全（ProjectItem 扩展）
- [ ] **Step 3: mock/menus.ts 加条件菜单（id '28'）** + admin menuIds + 测试；Commit `feat: PC 触发条件与项目信息扩展`

---

### Task 5: PC 公示公告 + 通知提醒

**Files:** 新建 `src/views/system/announcement/index.vue`、`src/views/system/notice/index.vue`

**Interfaces:** 公告 CRUD；通知列表 + 标记已读

- [ ] **Step 1: 公告页**（类型/标题/内容(textarea)/发布时间/项目；v-perm system:announcement:*）
- [ ] **Step 2: 通知页**（列表：标题/内容/类型 tag/已读状态；未读高亮；"标记已读"）
- [ ] **Step 3: 菜单接入（id '29' 公告、'30' 通知）** + admin menuIds + 测试；Commit

---

### Task 6: PC 人员管理 + 登录日志

**Files:** 新建 `src/views/system/per/index.vue`、`src/views/system/loginlog/index.vue`；改用户管理（关联人员）

**Interfaces:** 人员 CRUD；登录日志列表（只读）；用户管理加 perId 选择

- [ ] **Step 1: 人员页**（姓名/部门 select/电话/邮箱/状态；v-perm system:per:*）
- [ ] **Step 2: 登录日志页**（只读表格：用户名/IP/时间/状态/信息）
- [ ] **Step 3: 用户管理加 perId select**（getPerList）；菜单接入（'31' 人员、'32' 日志）；Commit

---

### Task 7: PC 统计增强

**Files:** 新建 `src/views/system/stats/index.vue`

**Interfaces:** 统计页（节点完成率/超时清单/科室效率）

- [ ] **Step 1: 统计页**：卡片（项目数/节点完成率/超时节点/超时项目/问题）+ 科室效率表格 + 超时项目清单表格（调 getStatisticsOverview + 新增 getOverdueProjects 或复用）
- [ ] **Step 2: 菜单接入（'33' 统计）**；Commit

---

### Task 8: 移动端阶段看板（项目详情升级）

**Files:** 改 `mobile/src/views/project/detail.vue`、`mobile/src/stores/phase.ts`（或并入 fill store）

**Interfaces:** 项目详情按阶段分组显示节点；公示/通知入口

- [ ] **Step 1: phase store**（getPhaseList）+ 项目详情改为：加载 phases + nodes（现有 RBAC 过滤）→ 按 phaseId 分组渲染（阶段名 + 节点卡片：步骤/名称/状态 tag/时限/科室/超时高亮）
- [ ] **Step 2: 详情加"公示公告""通知"入口按钮**
- [ ] **Step 3: 路由加 notice/announcement**；dev 验证 + Commit

---

### Task 9: 移动端节点填报升级（时限/超时/附件/规则显隐）

**Files:** 改 `mobile/src/views/project/node-fill.vue`

**Interfaces:** 填报前调 applyConditions 显隐字段；时限/超时展示；附件列表

- [ ] **Step 1: node-fill 加载节点后**：显示 时限/截止/经办科室；超时（deadline < now 且未完成）红色高亮
- [ ] **Step 2: 规则显隐**：提交前调 `applyConditions(nodeId, form)` → hideFieldIds 的字段隐藏；结果 openNodeIds 存储（回详情时提示/展开）
- [ ] **Step 3: 附件**：记录卡片显示该节点附件列表（getNodeFiles）；新增填报表单加"添加附件"（选择文件名入数组 → createFile）
- [ ] **Step 4: 提交后调通知接口产生提醒**（mock：提交完成 → 后端自动生成下一节点科室通知；前端提交后调 getNoticeList 刷新或后端完成）
- [ ] **Step 5: dev 验证 + Commit**

---

### Task 10: 移动端通知 + 公告

**Files:** 新建 `mobile/src/views/notice/index.vue`、`mobile/src/views/announcement/index.vue`

**Interfaces:** 通知列表（未读高亮 + 标记已读 + 跳项目）；公告列表 + 详情

- [ ] **Step 1: 通知页**（列表 + 未读红点 + 点击标记已读 + 跳项目详情）
- [ ] **Step 2: 公告页**（列表 + 详情弹层）
- [ ] **Step 3: 路由 + 项目详情/我的页入口**；dev 验证 + Commit

---

### Task 11: 移动端监测增强

**Files:** 改 `mobile/src/views/monitor/index.vue`

**Interfaces:** 统计增强展示

- [ ] **Step 1: 监测页扩展**：节点完成率卡片（进度条）+ 超时节点/超时项目 + 科室效率表（getStatisticsOverview 扩展字段）
- [ ] **Step 2: dev 验证 + Commit**

---

### Task 12: 端到端验证 + 文档

**Files:** README、需求/设计文档状态

**Interfaces:** 全量验证

- [ ] **Step 1: 全量测试 + build**（PC 39+ / mobile 2+）
- [ ] **Step 2: 端到端（单进程）**：建阶段 → 节点挂阶段（时限/科室）→ 填 n1（触发条件开启 n2）→ 提交 → 通知产生 → 公告发布 → 统计变化（完成率/超时/科室效率）→ 移动端看板/通知/公告/监测可见
- [ ] **Step 3: 文档更新**（README 功能表、设计文档状态）；Commit `docs: 更新至 TBXT 对齐能力`

---

## Self-Review

**1. Spec 覆盖：** 阶段层(T1-3)、节点元数据(T3)、规则引擎(T2/9)、公告(T5/10)、通知(T2/5/9/10)、附件(T2/9)、人员+日志(T6)、统计增强(T7/11)、移动端看板(T8)。

**2. 占位符：** 各任务有关键代码，页面沿既有 CRUD/表单模式。

**3. 类型一致性：** NodeItem 新字段在 types/mock/PC 节点页/移动端统一；`applyConditions` 返回 `{openNodeIds,hideFieldIds}` 两端一致；StatsOverview 扩展字段统计聚合与页面一致。

**已知待办：** 规则引擎 mock 简化（不含门禁软硬/乐观锁）；附件 mock 存名（真实上传待后端）；外部数据源不在本期；超时计算按 deadline < now 且未完成。
