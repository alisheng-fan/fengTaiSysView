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
  /** 填报节点时携带字段配置（方案 A：随菜单下发） */
  fields?: FieldConfig[]
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
  perId?: string            // 关联人员（sys_per.id）
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

/** 节点字段类型（填报表单控件） */
export type FieldType = 'input' | 'textarea' | 'number' | 'select' | 'date' | 'radio'

/** 一个字段的配置 */
export interface FieldConfig {
  prop: string
  label: string
  type: FieldType
  required?: boolean
  options?: { label: string; value: string }[]
  placeholder?: string
}

/** 阶段配置（work_phase） */
export interface PhaseItem {
  id: string
  name: string                 // 前期立项/土地征地/土地供应/建设及核验
  prePhaseId?: string          // 前置阶段
  preIsAll?: boolean           // 前置是否要求齐全
  levelNo: number
  sortNo: number
}

/** 流程节点（work_node + biz_flow_node 合并升级：挂项目/阶段、带流程顺序与状态） */
export interface NodeItem {
  id: string
  projectId: string
  phaseId: string              // 所属阶段
  name: string
  step: number                 // 阶段内顺序
  sort: number
  status: number               // 生命周期 1 进行中 / 2 已完成
  date?: string
  preNodeIds?: string[]        // 前置节点
  preIsAll?: boolean           // 前置是否全部
  isNeed: boolean              // 是否必要环节
  isDefault: boolean           // 是否默认出现（false=条件开启）
  dutyDepId?: string           // 经办科室
  deadlineDays?: number        // 办理时限（天）
  deadline?: string            // 截止时间（创建节点实例时按时限计算）
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
  status: number                // 1 成功 / 0 失败
  msg?: string
}

/** 修改密码请求 */
export interface ChangePasswordParams {
  oldPassword: string
  newPassword: string
}

/** 项目主数据 */
export interface ProjectItem {
  id: string
  name: string
  type: 'first' | 'second'
  prjCode?: string               // 项目编码
  builder?: string
  location?: string
  landUse?: string               // 土地用途
  landType?: string              // 土地性质
  prjType?: 'new' | 'rebuild' | 'alter'  // 项目类型（新建/续建/改建）
  landSize?: number
  buildingSize?: number
  ratio?: number                 // 容积率
  status: number
  createTime: string
}

/** 填报记录（进展录入） */
export interface FillRecordItem {
  id: string
  nodeId: string
  projectId: string
  values: Record<string, unknown>
  createBy: string
  createTime: string
}

/** 问题状态：已解决/部分解决/再商议/搁置 */
export type IssueStatus = 'solved' | 'partial' | 'discuss' | 'shelved'

/** 问题上报 */
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
  nodeTotal: number             // 节点总数
  nodeDone: number              // 已完成节点
  nodeRate: number              // 节点完成率
  overdueNodes: number          // 超时节点
  overdueProjects: number       // 超时项目
  depEfficiency: { depName: string; done: number; total: number }[]  // 科室效率
}
