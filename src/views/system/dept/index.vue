<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createDept, deleteDept, getDeptList, updateDept } from '@/api/system'
import ProForm from '@/components/ProForm/index.vue'
import type { DeptItem } from '@/types'

const list = ref<DeptItem[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const form = reactive<Partial<DeptItem>>({})

async function load() {
  loading.value = true
  try {
    list.value = await getDeptList()
  } finally {
    loading.value = false
  }
}

function openAdd(parentId: string | null = null) {
  isEdit.value = false
  Object.assign(form, { parentId, name: '', sort: 1, status: 1, leader: '', phone: '' })
  dialogVisible.value = true
}

function openEdit(row: DeptItem) {
  isEdit.value = true
  Object.assign(form, { ...row })
  dialogVisible.value = true
}

async function handleSubmit(values: Record<string, unknown>) {
  if (isEdit.value) {
    await updateDept({ ...(form as DeptItem), ...values } as DeptItem)
  } else {
    await createDept(values as Partial<DeptItem>)
  }
  load()
}

async function handleDelete(row: DeptItem) {
  await ElMessageBox.confirm(`确定删除部门「${row.name}」？`, '提示', { type: 'warning' })
  await deleteDept(row.id)
  ElMessage.success('删除成功')
  load()
}

onMounted(load)
</script>

<template>
  <el-card>
    <div class="toolbar">
      <el-button v-perm="'system:dept:add'" type="primary" @click="openAdd()">新增部门</el-button>
    </div>

    <el-table
      v-loading="loading"
      :data="list"
      row-key="id"
      border
      default-expand-all
      :tree-props="{ children: 'children' }"
    >
      <el-table-column prop="name" label="部门名称" min-width="180" />
      <el-table-column prop="sort" label="排序" width="80" />
      <el-table-column prop="leader" label="负责人" width="120" />
      <el-table-column prop="phone" label="联系电话" width="140" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'">
            {{ row.status === 1 ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220">
        <template #default="{ row }">
          <el-button v-perm="'system:dept:add'" type="primary" link @click="openAdd(row.id)">新增子级</el-button>
          <el-button v-perm="'system:dept:edit'" type="primary" link @click="openEdit(row)">编辑</el-button>
          <el-button v-perm="'system:dept:delete'" type="danger" link @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <ProForm
      v-model="dialogVisible"
      :title="isEdit ? '编辑部门' : '新增部门'"
      :initial-values="form as Record<string, unknown>"
      :submit-api="handleSubmit"
      :fields="[
        { prop: 'name', label: '部门名称', rules: [{ required: true, message: '请输入部门名称', trigger: 'blur' }] },
        { prop: 'sort', label: '排序', type: 'number' },
        { prop: 'leader', label: '负责人' },
        { prop: 'phone', label: '联系电话' },
      ]"
    />
  </el-card>
</template>

<style scoped>
.toolbar {
  margin-bottom: 12px;
}
</style>
