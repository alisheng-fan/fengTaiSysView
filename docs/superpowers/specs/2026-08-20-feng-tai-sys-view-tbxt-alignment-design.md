# fengTaiSysView 对齐 TBXT 全生命周期能力设计

- 日期：2026-08-20
- 状态：已实现（2026-08-20）
- 类型：架构扩展（按 tbxt 完善系统——补阶段层/时限/科室/规则/公示/通知/附件/人员/日志/统计增强）
- 依据：`D:\fengtai\tbxt`（数据库设计.md、CLAUDE.md、建设目标.txt、前端页面）

## 1. 目标

把 fengTaiSysView（纯前端 + mock 基座）完善到 tbxt 的业务深度：四层配置模型（项目→阶段→节点→信息项）、节点元数据（时限/经办科室/核心/前置）、字段触发规则、公示公告、通知提醒、附件、人员+登录日志、统计增强、移动端看板。

## 2. 数据模型（shared/types 扩展/升级）

```ts
/** 阶段配置（work_phase） */
export interface PhaseItem {
  id: string
  name: string                 // 前期立项/土地征地/土地供应/建设及核验
  prePhaseId?: string          // 前置阶段
  preIsAll?: boolean           // 前置是否要求齐全
  levelNo: number
  sortNo: number
}

/** 流程节点（work_node + biz_flow_node 合并升级） */
export interface NodeItem {
  id: string
  projectId: string
  phaseId: string              // 【新】所属阶段
  name: string
  step: number                 // 阶段内顺序
  sort: number
  status: number               // 生命周期 1进行中 / 2已完成
  date?: string
  preNodeIds?: string[]        // 【新】前置节点
  preIsAll?: boolean           // 【新】前置是否全部
  isNeed: boolean              // 【新】是否必要环节
  isDefault: boolean           // 【新】是否默认出现（false=条件开启）
  dutyDepId?: string           // 【新】经办科室
  deadlineDays?: number        // 【新】办理时限（天）
  deadline?: string            // 【新】截止时间（创建节点实例时按时限计算）
  fields: FieldConfig[]
}

/** 字段触发条件（work_node_cond，简化） */
export interface FieldCondition {
  id: string
  nodeId: string               // 目标节点（被开启/隐藏）
  triggerNodeId: string        // 触发节点
  triggerFieldId: string
  operator: 'eq' | 'neq' | 'in' | 'notin' | 'empty' | 'notempty'
  condValue: string
  action: 'OPEN' | 'HIDE'
  enabled: boolean
}

/** 公示公告（biz_announcement） */
export interface AnnouncementItem {
  id: string
  projectId?: string
  annType: '公示' | '公告' | '发布信息'
  title: string
  content: string
  publishDate: string
  source?: string
}

/** 通知提醒（biz_notice） */
export interface NoticeItem {
  id: string
  projectId: string
  nodeId: string
  title: string
  content: string
  noticeType: 'REMIND' | 'NOTICE'
  read: boolean
  createTime: string
}

/** 附件（biz_flow_file，mock 存路径） */
export interface FlowFileItem {
  id: string
  projectId: string
  nodeId: string
  fileName: string
  filePath: string
  fileSize: number
  uploadMan: string
  uploadTime: string
}

/** 人员（sys_per） */
export interface PerItem {
  id: string
  name: string
  deptId: string
  phone?: string
  email?: string
  status: number
}

/** 登录日志（sys_loginlog） */
export interface LoginLogItem {
  id: string
  username: string
  ip?: string
  loginTime: string
  status: number                // 1成功 / 0失败
  msg?: string
}

/** 统计增强（StatsOverview 扩展） */
export interface StatsOverview {
  totalProjects: number
  firstCount: number
  secondCount: number
  issueTotal: number
  issueSolved: number
  bizTotal: number
  nodeTotal: number             // 【新】
  nodeDone: number              // 【新】
  nodeRate: number              // 【新】节点完成率
  overdueNodes: number          // 【新】超时节点
  overdueProjects: number       // 【新】超时项目
  depEfficiency: { depName: string; done: number; total: number }[]  // 【新】科室效率
}
```

## 3. 接口层（shared/api 扩展）

```
/api/system/phase/list|create|update|delete        阶段 CRUD
/api/system/node/* 已有，节点含 phaseId/deadline/dutyDep
/api/system/condition/list|create|update|delete    字段触发条件
/api/announcement/list|create|update|delete        公示公告
/api/notice/list|read                              通知列表 + 标记已读
/api/node/{id}/files|upload                        附件列表 + 上传（mock 存路径）
/api/system/per/list|create|update|delete          人员 CRUD
/api/system/loginlog/list                          登录日志
/api/statistics/overview 扩展                      统计增强
/api/engine/apply?nodeId={id}&values={...}         规则引擎：按填报值返回应开启/隐藏的节点
```

## 4. 规则引擎（mock 简化版）

- `applyConditions(nodeId, values)` 纯函数：遍历目标为该节点或其字段的启用条件，按 triggerFieldId 的填报值 + operator 判断 → 返回 `{ openNodeIds: string[], hideFieldIds: string[] }`
- 填报页提交前调用：按返回开启/隐藏节点入口、字段显隐
- 移动端项目详情按 `isDefault` + 规则结果过滤节点显示
- 可单测

## 5. PC 页面

| 页面 | 说明 |
|---|---|
| 阶段管理（/system/phase） | 阶段 CRUD（名称/前置/是否齐全/级别/顺序） |
| 节点管理升级 | 加 所属阶段/前置节点/是否必要/是否默认/经办科室/办理时限 字段；字段编辑器保留 |
| 触发条件管理（/system/node/cond） | 条件 CRUD：目标节点/触发节点/触发字段/运算符/条件值/动作(开启·隐藏) |
| 公示公告（/system/announcement） | 公告 CRUD（类型/标题/内容/发布时间） |
| 通知提醒（/system/notice） | 通知列表 + 标记已读 |
| 人员管理（/system/per） | 人员 CRUD（姓名/部门/电话/邮箱），用户关联人员（用户管理加 perId 选择） |
| 登录日志（/system/loginlog） | 登录成功/失败记录列表（mock 记录登录动作） |
| 项目管理升级 | 加 项目编码/土地用途/土地性质/项目类型/流程类型/容积率 等（适度） |
| 统计增强 | 节点完成率/超时清单/科室效率（卡片 + 表格） |

## 6. 移动端

| 页面 | 说明 |
|---|---|
| 首页 4-tab 不变 | 首页(项目查询) / 监测(统计增强) / 我的 / 进度 |
| 项目详情升级 | **阶段看板**：按阶段分组节点（阶段名 + 节点列表 + 完成状态 + 超时高亮 + 时限展示 + 经办科室）；公示公告入口 |
| 节点填报升级 | 时限展示、超时高亮、附件上传（选择文件 mock 存名）、字段级规则显隐 |
| 通知 | 通知列表 + 未读标记（提醒下一环节） |
| 公告 | 公告列表 + 详情 |
| 监测升级 | 节点完成率 / 超时清单 / 科室效率 |

## 7. mock 改造

- 新增 `mock/phase.ts`、`mock/announcement.ts`、`mock/notice.ts`、`mock/per.ts`、`mock/loginlog.ts`、`mock/condition.ts`（均 globalThis 单源）
- `mock/nodes.ts` 升级：节点含 phaseId/preNodeIds/isNeed/isDefault/dutyDep/deadlineDays/deadline；种子 4 阶段（前期立项/土地征地/土地供应/建设及核验）各挂节点
- `mock/project.ts`：统计聚合扩展（nodeTotal/nodeDone/overdue/depEfficiency）
- `mock/engine.ts`：applyConditions 纯函数 + /api/engine/apply
- 附件：mock 存路径（表单选择文件 → 文件名入数组）

## 8. 首期交付范围（全量）

> 全部 6 项已交付（2026-08-20），端到端链路（建阶段 → 节点挂阶段/时限/科室 → 填 n1 触发开启 n2 → 通知产生 → 公告 → 统计变化 → 移动端看板/通知/公告/监测）经 Task 12 验证通过。

1. 数据模型 + 接口层（全部新类型/api）
2. mock：阶段/节点升级/条件/公告/通知/附件/人员/日志/统计增强/规则引擎
3. PC：阶段管理 + 节点管理升级 + 触发条件 + 公告 + 通知 + 人员 + 登录日志 + 项目管理升级 + 统计增强
4. 移动端：阶段看板 + 节点填报升级（时限/超时/附件/规则显隐）+ 通知 + 公告 + 监测增强
5. 权限：新菜单/权限码接入（system:phase、system:announcement、system:notice、system:per、system:loginlog、system:condition、system:file 等）
6. 端到端验证 + 文档

## 9. 测试策略

- 纯函数单测：applyConditions（各 operator）、统计聚合（含超时/科室效率）、deadline 计算
- 端到端手测：建阶段→节点挂阶段（含时限/科室）→填报→触发条件开启下一节点→提交后产生通知→公告发布→统计变化

## 10. 风险与后续

- 规则引擎为 mock 简化版（字段级条件，不含节点门禁软硬切换/乐观锁）；真实后端对接时按 tbxt 后端实现
- 附件为 mock 路径存名（真实上传需后端）；外部数据源推送（biz_external_source）不在本期（需真实后端）
- 工程量较大（约 14-16 任务），按 SDD 拆批执行
