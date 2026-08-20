# fengTaiSysView 项目全周期业务化设计

- 日期：2026-08-20
- 状态：设计待确认
- 类型：架构扩展（把通用基座套上丰台土地项目全周期业务）
- 依据：`docs/business/2026-08-20-fengtai-mobile-prototype-requirements.md`（原型需求）

## 1. 目标与范围

把 fengTaiSysView 从"通用填报基座"扩展为"**丰台区项目全周期跟踪平台**"：项目概念、流程节点挂项目、进展填报记录、问题上报闭环、监测统计。

### 1.1 核心扩展（对应需求文档第 9 节）

| # | 扩展 | 说明 |
|---|---|---|
| 1 | **项目主数据** | ProjectItem：项目 CRUD，一级/二级分类 |
| 2 | **节点挂项目** | NodeItem 增加 projectId/step/date，成为"流程节点" |
| 3 | **填报记录** | 从"仅提交"升级为"记录列表 + 新增/编辑"（进展录入） |
| 4 | **问题闭环** | 问题上报/协助，四态（已解决/部分解决/再商议/搁置） |
| 5 | **监测统计** | 项目/问题/业务量聚合 |
| 6 | **移动端调整** | TabBar 改 首页/监测/我的/进度；项目查询 → 详情 → 节点填报 |

### 1.2 非目标（本期）

- 真实后端对接（沿用 mock，架构预留）
- 附件上传（原型有结案证明等，本期用文本/占位，后续加 upload）
- 流程审批流引擎（节点状态手动推进）

## 2. 数据模型（shared/types 扩展）

```ts
/** 项目主数据 */
export interface ProjectItem {
  id: string
  name: string
  type: 'first' | 'second'        // 一级开发 / 二级开发
  builder?: string                // 建设单位
  location?: string
  landSize?: number               // 用地规模
  buildingSize?: number           // 建筑面积
  status: number                  // 1 进行中 / 2 已完成
  createTime: string
}

/** 流程节点（NodeItem 升级：挂项目、带流程顺序与状态） */
export interface NodeItem {
  id: string
  projectId: string               // 所属项目
  name: string
  step: number                    // 流程顺序
  sort: number                    // 组内排序（兼容保留）
  status: number                  // 1 进行中 / 2 已完成
  date?: string                   // 节点办理日期
  fields: FieldConfig[]
}

/** 填报记录（从"仅提交"升级） */
export interface FillRecordItem {
  id: string
  nodeId: string
  projectId: string
  values: Record<string, unknown>
  createBy: string
  createTime: string
}

/** 问题上报 */
export type IssueStatus = 'solved' | 'partial' | 'discuss' | 'shelved'
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

### 2.1 兼容与迁移

- 现有 n1/n2 节点升级为挂项目的流程节点：预置 2 个项目（一级/二级各一），n1/n2 挂到二级项目下，补 step/date/status。
- `/auth/me` 返回的菜单树不变（业务填报组仍是节点入口）；节点字段下发机制（MenuNode.fields）沿用。

## 3. 接口层（shared/api 扩展）

```
/api/project/list|create|update|delete       项目 CRUD
/api/node/list?projectId=                    按项目查节点（含 step 排序）
/api/node/{id}/records                       该节点填报记录列表
/api/node/{id}/records  POST                 新增填报记录
/api/node/{id}/records/{rid} PUT            编辑填报记录
/api/issue/list?projectId=                   问题列表
/api/issue  POST|PUT                         新增/更新问题
/api/statistics/overview                     监测统计聚合
```

- `submitNodeData` 升级为 `createFillRecord(nodeId, projectId, values)`。
- 请求函数命名沿用 `reqXxx` 风格？现有 api 是 `getNodeList` 等（PC 项目风格）。保持一致，用 `getProjectList`/`createProject`/…。

## 4. PC 端页面

| 页面 | 说明 |
|---|---|
| 项目管理（/system/project） | 项目 CRUD：名称/分类/建设单位/位置/用地/建筑面积/状态；v-perm system:project:add/edit/delete |
| 节点管理升级 | 节点表加"所属项目"列；新增/编辑表单加 projectId 选择 + step + date |

## 5. 移动端（mobile/）

### 5.1 TabBar（4 tab，匹配原型）

```
首页（项目查询） 监测（统计） 我的（个人中心） 进度（我的项目流程）
```

### 5.2 页面

| 页面 | 说明 |
|---|---|
| 项目查询（首页） | 项目卡片列表 + 筛选（全部/一级/二级/进行中/已完成）+ 搜索 |
| 项目详情 | 流程节点列表（step 排序，状态 tag，办理日期）→ 点击进入填报 |
| 节点填报 | 该节点填报记录列表 + "新增填报"（动态表单 toVantFields 复用）→ 新增/编辑 |
| 问题上报 | 项目详情内发起（环节名称/部门/描述）；问题记录列表（状态 tag） |
| 监测 | 统计卡片（项目数/问题数/业务量） |
| 进度 | 我参与的项目列表（复用项目查询数据，简化） |

- 复用现有：登录/个人中心/改密/填报动态表单（toVantFields）/fill store 改造为按 projectId 取节点。

## 6. mock 改造

- 新增 `mock/project.ts`：项目种子（一级"槐房村改造"、二级"公交首末站"等）+ CRUD + 统计聚合
- `mock/nodes.ts` 升级：节点含 projectId/step/date；新增填报记录数组 + records 端点
- `mock/issue.ts`（或并入 project）：问题种子 + CRUD
- `mock/auth.ts` 菜单构建不变；业务填报节点来自挂项目节点

## 7. 首期交付范围

1. 数据模型扩展 + 接口层（project/node-records/issue/statistics）
2. mock：项目 + 节点挂项目 + 填报记录 + 问题 + 统计
3. PC：项目管理页 + 节点管理加项目/步骤
4. 移动端：TabBar 4-tab + 项目查询 + 项目详情（节点流程）+ 节点填报（记录+编辑）+ 问题上报 + 监测
5. 权限联动：admin 全量 / user 可见分配节点（沿用角色→节点）

## 8. 测试策略

- 单测：节点按项目分组排序、填报记录 CRUD 校验、统计聚合纯函数
- 端到端手测：PC 建项目/挂节点 → 移动端首页看到项目 → 详情节点 → 填报记录新增/编辑 → 问题上报 → 监测数字变化

## 9. 风险与后续

- 迁移影响：NodeItem 加 projectId 必填，现有 mock 测试需同步（auth/nodes 断言）
- 附件上传：后续加 upload 端点 + 移动端 file 控件
- 移动端原型的横向流程节点图：本期用纵向列表（step 排序），后续可加图
