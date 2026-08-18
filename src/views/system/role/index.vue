<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createRole, deleteRole, getRoleList, updateRole } from '@/api/system'
import ProForm from '@/components/ProForm/index.vue'
import type { RoleItem } from '@/types'
import { adminMenus } from '../../../../mock/menus'

const list = ref<RoleItem[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const form = ref<Partial<RoleItem>>({})

// ---------- 分配权限弹窗 ----------
const permVisible = ref(false)
const permTreeRef = ref()
const currentRole = ref<RoleItem | null>(null)
const checkedKeys = ref<string[]>([])

async function load() {
  loading.value = true
  try {
    list.value = await getRoleList()
  } finally {
    loading.value = false
  }
}

function openAdd() {
  isEdit.value = false
  form.value = { name: '', code: '', sort: 1, status: 1, remark: '' }
  dialogVisible.value = true
}

function openEdit(row: RoleItem) {
  isEdit.value = true
  form.value = { ...row }
  dialogVisible.value = true
}

async function handleSubmit(values: Record<string, unknown>) {
  if (isEdit.value) {
    await updateRole({ ...(form.value as RoleItem), ...values } as RoleItem)
  } else {
    await createRole(values as Partial<RoleItem>)
  }
  load()
}

async function handleDelete(row: RoleItem) {
  await ElMessageBox.confirm(`确定删除角色「${row.name}」？`, '提示', { type: 'warning' })
  await deleteRole(row.id)
  ElMessage.success('删除成功')
  load()
}

function openPerm(row: RoleItem) {
  currentRole.value = row
  checkedKeys.value = row.menuIds ?? []
  permVisible.value = true
}

async function savePerm() {
  if (!currentRole.value) return
  await updateRole({ ...currentRole.value, menuIds: checkedKeys.value })
  ElMessage.success('权限已更新')
  permVisible.value = false
  load()
}

onMounted(load)
</script>

<template>
  <el-card>
    <div class="toolbar">
      <el-button v-perm="'system:role:add'" type="primary" @click="openAdd">新增角色</el-button>
    </div>

    <el-table v-loading="loading" :data="list" border>
      <el-table-column prop="name" label="角色名称" min-width="140" />
      <el-table-column prop="code" label="角色编码" width="120" />
      <el-table-column prop="sort" label="排序" width="80" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'">{{ row.status === 1 ? '启用' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" min-width="160" />
      <el-table-column label="操作" width="240">
        <template #default="{ row }">
          <el-button v-perm="'system:role:edit'" type="primary" link @click="openEdit(row)">编辑</el-button>
          <el-button v-perm="'system:role:edit'" type="primary" link @click="openPerm(row)">分配权限</el-button>
          <el-button v-perm="'system:role:delete'" type="danger" link @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <ProForm
      v-model="dialogVisible"
      :title="isEdit ? '编辑角色' : '新增角色'"
      :initial-values="form as Record<string, unknown>"
      :submit-api="handleSubmit"
      :fields="[
        { prop: 'name', label: '角色名称', rules: [{ required: true, message: '请输入角色名称', trigger: 'blur' }] },
        { prop: 'code', label: '角色编码', rules: [{ required: true, message: '请输入角色编码', trigger: 'blur' }] },
        { prop: 'sort', label: '排序', type: 'number' },
        { prop: 'remark', label: '备注', type: 'textarea' },
      ]"
    />

    <el-dialog v-model="permVisible" title="分配权限" width="420px">
      <el-tree
        ref="permTreeRef"
        :data="adminMenus"
        show-checkbox
        node-key="id"
        :default-checked-keys="checkedKeys"
        :props="{ label: 'title', children: 'children' }"
        @check="checkedKeys = permTreeRef.getCheckedKeys() as string[]"
      />
      <template #footer>
        <el-button @click="permVisible = false">取消</el-button>
        <el-button type="primary" @click="savePerm">保存</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<style scoped>
.toolbar {
  margin-bottom: 12px;
}
</style>
