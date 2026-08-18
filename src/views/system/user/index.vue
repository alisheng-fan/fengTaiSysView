<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createUser, deleteUser, getDeptList, getRoleList, getUserPage, updateUser } from '@/api/system'
import ProTable from '@/components/ProTable/index.vue'
import type { Column, SearchField } from '@/components/ProTable/types'
import ProForm from '@/components/ProForm/index.vue'
import type { DeptItem, RoleItem, UserItem } from '@/types'

const tableRef = ref()
const dialogVisible = ref(false)
const isEdit = ref(false)
const form = ref<Partial<UserItem>>({})

const depts = ref<DeptItem[]>([])
const roles = ref<RoleItem[]>([])

async function loadOptions() {
  depts.value = await getDeptList()
  roles.value = await getRoleList()
}

function openAdd() {
  isEdit.value = false
  form.value = { username: '', nickname: '', deptId: null, roleIds: [], phone: '', email: '', status: 1 }
  dialogVisible.value = true
}

function openEdit(row: UserItem) {
  isEdit.value = true
  form.value = { ...row }
  dialogVisible.value = true
}

async function handleSubmit(values: Record<string, unknown>) {
  if (isEdit.value) {
    await updateUser({ ...(form.value as UserItem), ...values } as UserItem)
  } else {
    await createUser(values as Partial<UserItem>)
  }
  dialogVisible.value = false
  tableRef.value?.refresh()
}

async function handleDelete(row: UserItem) {
  await ElMessageBox.confirm(`确定删除用户「${row.nickname}」？`, '提示', { type: 'warning' })
  await deleteUser(row.id)
  ElMessage.success('删除成功')
  tableRef.value?.refresh()
}

const columns: Column[] = [
  { prop: 'username', label: '用户名', minWidth: 120 },
  { prop: 'nickname', label: '昵称', minWidth: 120 },
  { prop: 'phone', label: '手机号', width: 140 },
  { prop: 'createTime', label: '创建时间', width: 180 },
  {
    prop: 'status',
    label: '状态',
    width: 90,
    slot: 'status',
  },
  { prop: 'operation', label: '操作', width: 160, slot: 'operation' },
]

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
        { prop: 'deptId', label: '所属部门', type: 'select', options: depts.map((d) => ({ label: d.name, value: d.id })) },
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
