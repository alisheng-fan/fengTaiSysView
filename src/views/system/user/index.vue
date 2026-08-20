<script setup lang="ts">
/**
 * 用户管理页
 * - 用户列表（ProTable 分页/搜索）+ 新增/编辑/删除
 * - 表单中部门/角色下拉的选项在挂载时加载
 */
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createUser, deleteUser, getDeptList, getPerList, getRoleList, getUserPage, updateUser } from '@/api/system'
import ProTable from '@/components/ProTable/index.vue'
import type { Column, SearchField } from '@/components/ProTable/types'
import ProForm from '@/components/ProForm/index.vue'
import type { DeptItem, PerItem, RoleItem, UserItem } from '@/types'

/** 用户列表组件实例（提交/删除成功后刷新列表） */
const tableRef = ref()
/** 新增/编辑用户弹窗可见性 */
const dialogVisible = ref(false)
/** 当前弹窗是否为编辑模式（true=编辑，false=新增） */
const isEdit = ref(false)
/** 新增/编辑弹窗的表单数据（编辑时整行用户回填） */
const form = ref<Partial<UserItem>>({})

/** 部门选项数据（树形，用于下拉扁平化） */
const depts = ref<DeptItem[]>([])
/** 角色选项数据（用户下拉选择） */
const roles = ref<RoleItem[]>([])
/** 人员选项数据（用户关联人员下拉选择） */
const pers = ref<PerItem[]>([])

/** 加载部门/角色/人员下拉选项 */
async function loadOptions() {
  depts.value = await getDeptList()
  roles.value = await getRoleList()
  pers.value = await getPerList()
}

/** 部门树 → 扁平选项 */
function flattenDepts(depts: DeptItem[]): { label: string; value: string }[] {
  return depts.flatMap((d) => [
    { label: d.name, value: d.id },
    ...(d.children ? flattenDepts(d.children) : []),
  ])
}

/** 按人员 id 查找姓名（关联人员列回显，无匹配显示占位符） */
function perName(id?: string) {
  return id ? pers.value.find((p) => p.id === id)?.name ?? '-' : '-'
}

/** 打开"新增用户"弹窗，重置表单为默认值 */
function openAdd() {
  isEdit.value = false
  form.value = { username: '', nickname: '', deptId: null, perId: '', roleIds: [], phone: '', email: '', status: 1 }
  dialogVisible.value = true
}

/**
 * 打开"编辑用户"弹窗，回填用户数据
 * @param row 当前行用户数据
 */
function openEdit(row: UserItem) {
  isEdit.value = true
  form.value = { ...row }
  dialogVisible.value = true
}

/**
 * 新增/编辑弹窗提交回调（由 ProForm submitApi 调用），成功后刷新列表
 * @param values 弹窗表单提交的字段值
 */
async function handleSubmit(values: Record<string, unknown>) {
  if (isEdit.value) {
    // 编辑：以原用户为基础合并新值（保留 id 等字段）
    await updateUser({ ...(form.value as UserItem), ...values } as UserItem)
  } else {
    // 新增：提交表单值创建用户
    await createUser(values as Partial<UserItem>)
  }
  dialogVisible.value = false
  tableRef.value?.refresh()
}

/**
 * 删除用户（二次确认后调用接口），成功后刷新列表
 * @param row 当前行用户数据
 */
async function handleDelete(row: UserItem) {
  await ElMessageBox.confirm(`确定删除用户「${row.nickname}」？`, '提示', { type: 'warning' })
  await deleteUser(row.id)
  ElMessage.success('删除成功')
  tableRef.value?.refresh()
}

/** 用户列表列配置（status/perId/operation 使用具名插槽） */
const columns: Column[] = [
  { prop: 'username', label: '用户名', minWidth: 120 },
  { prop: 'nickname', label: '昵称', minWidth: 120 },
  { prop: 'phone', label: '手机号', width: 140 },
  { prop: 'perId', label: '关联人员', width: 120, slot: 'perId' },
  { prop: 'createTime', label: '创建时间', width: 180 },
  {
    prop: 'status',
    label: '状态',
    width: 90,
    slot: 'status',
  },
  { prop: 'operation', label: '操作', width: 160, slot: 'operation' },
]

/** 用户列表搜索区字段配置 */
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

/** 状态值 → 中文文案映射 */
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
      <template #perId="{ row }">{{ perName(row.perId) }}</template>
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
        { prop: 'deptId', label: '所属部门', type: 'select', options: flattenDepts(depts) },
        { prop: 'perId', label: '关联人员', type: 'select', options: pers.map((p) => ({ label: p.name, value: p.id })) },
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
