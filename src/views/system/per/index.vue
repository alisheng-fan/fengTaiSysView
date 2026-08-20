<script setup lang="ts">
/**
 * 人员管理页（PC）
 * - 人员列表（姓名/部门/电话/邮箱/状态）+ 新增/编辑/删除
 * - 表单：姓名(必填)/部门 select(getDeptList 扁平化)/电话/邮箱/状态 radio
 * - v-perm system:per:add/edit/delete 控制操作可见性
 */
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createPer, deletePer, getDeptList, getPerList, updatePer } from '@/api/system'
import ProForm from '@/components/ProForm/index.vue'
import type { DeptItem, PerItem } from '@/types'

/** 人员列表数据 */
const list = ref<PerItem[]>([])
/** 部门列表（部门下拉 + 部门列回显） */
const depts = ref<DeptItem[]>([])
/** 列表加载中标志（el-table v-loading） */
const loading = ref(false)
/** 新增/编辑人员弹窗可见性 */
const dialogVisible = ref(false)
/** 当前弹窗是否为编辑模式（true=编辑，false=新增） */
const isEdit = ref(false)
/** 新增/编辑弹窗的表单数据（编辑时整行人员回填） */
const form = reactive<Partial<PerItem>>({})

/** 部门树 → 扁平选项 */
function flattenDepts(depts: DeptItem[]): { label: string; value: string }[] {
  return depts.flatMap((d) => [
    { label: d.name, value: d.id },
    ...(d.children ? flattenDepts(d.children) : []),
  ])
}

/** 按部门 id 查找部门名称（部门列回显，扁平化查找以覆盖嵌套部门，无匹配显示占位符） */
function deptName(id?: string) {
  if (!id) return '-'
  return flattenDepts(depts.value).find((d) => d.value === id)?.label ?? '-'
}

/** 加载人员列表 */
async function load() {
  loading.value = true
  try {
    list.value = await getPerList()
  } finally {
    loading.value = false
  }
}

/** 打开"新增人员"弹窗，重置表单为默认值 */
function openAdd() {
  isEdit.value = false
  Object.assign(form, { name: '', deptId: '', phone: '', email: '', status: 1 })
  dialogVisible.value = true
}

/**
 * 打开"编辑人员"弹窗，回填人员数据
 * @param row 当前行人员数据
 */
function openEdit(row: PerItem) {
  isEdit.value = true
  Object.assign(form, { ...row })
  dialogVisible.value = true
}

/**
 * 新增/编辑弹窗提交回调（由 ProForm submitApi 调用），成功后刷新列表
 * @param values 弹窗表单提交的字段值
 */
async function handleSubmit(values: Record<string, unknown>) {
  if (isEdit.value) {
    // 编辑：以原人员为基础合并新值（保留 id 等字段）
    await updatePer({ ...(form as PerItem), ...values } as PerItem)
  } else {
    // 新增：提交表单值创建人员
    await createPer(values as Partial<PerItem>)
  }
  load()
}

/**
 * 删除人员（二次确认后调用接口），成功后刷新列表
 * @param row 当前行人员数据
 */
async function handleDelete(row: PerItem) {
  await ElMessageBox.confirm(`确定删除人员「${row.name}」？`, '提示', { type: 'warning' })
  await deletePer(row.id)
  ElMessage.success('删除成功')
  load()
}

onMounted(async () => {
  // 并行加载人员列表与部门列表（下拉与列回显均依赖部门）
  await Promise.all([load(), getDeptList().then((d) => (depts.value = d))])
})
</script>

<template>
  <el-card>
    <div class="toolbar">
      <el-button v-perm="'system:per:add'" type="primary" @click="openAdd">新增人员</el-button>
    </div>

    <el-table v-loading="loading" :data="list" border>
      <el-table-column prop="name" label="姓名" min-width="120" />
      <el-table-column label="部门" min-width="140">
        <template #default="{ row }">{{ deptName(row.deptId) }}</template>
      </el-table-column>
      <el-table-column prop="phone" label="电话" width="150" />
      <el-table-column prop="email" label="邮箱" min-width="180" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'">{{
            row.status === 1 ? '启用' : '停用'
          }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150">
        <template #default="{ row }">
          <el-button v-perm="'system:per:edit'" type="primary" link @click="openEdit(row)"
            >编辑</el-button
          >
          <el-button v-perm="'system:per:delete'" type="danger" link @click="handleDelete(row)"
            >删除</el-button
          >
        </template>
      </el-table-column>
    </el-table>

    <ProForm
      v-model="dialogVisible"
      :title="isEdit ? '编辑人员' : '新增人员'"
      :initial-values="form as Record<string, unknown>"
      :submit-api="handleSubmit"
      :fields="[
        {
          prop: 'name',
          label: '姓名',
          rules: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
        },
        { prop: 'deptId', label: '部门', type: 'select', options: flattenDepts(depts) },
        { prop: 'phone', label: '电话' },
        { prop: 'email', label: '邮箱' },
        {
          prop: 'status',
          label: '状态',
          type: 'radio',
          options: [
            { label: '启用', value: 1 },
            { label: '停用', value: 0 },
          ],
        },
      ]"
    />
  </el-card>
</template>

<style scoped>
.toolbar {
  margin-bottom: 12px;
}
</style>
