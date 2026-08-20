<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createProject, deleteProject, getProjectList, updateProject } from '@/api/system'
import ProForm from '@/components/ProForm/index.vue'
import type { ProjectItem } from '@/types'

/** 项目列表数据 */
const list = ref<ProjectItem[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const form = reactive<Partial<ProjectItem>>({})

/** 加载项目列表 */
async function load() {
  loading.value = true
  try {
    list.value = await getProjectList()
  } finally {
    loading.value = false
  }
}

/** 打开新增项目弹窗 */
function openAdd() {
  isEdit.value = false
  Object.assign(form, { name: '', type: 'second', prjType: 'new', status: 1 })
  dialogVisible.value = true
}

/** 打开编辑项目弹窗，回填数据 */
function openEdit(row: ProjectItem) {
  isEdit.value = true
  Object.assign(form, { ...row })
  dialogVisible.value = true
}

/** 新增/编辑提交 */
async function handleSubmit(values: Record<string, unknown>) {
  if (isEdit.value) await updateProject({ ...(form as ProjectItem), ...values } as ProjectItem)
  else await createProject(values as Partial<ProjectItem>)
  load()
}

/** 删除项目 */
async function handleDelete(row: ProjectItem) {
  await ElMessageBox.confirm(`确定删除项目「${row.name}」？`, '提示', { type: 'warning' })
  await deleteProject(row.id)
  ElMessage.success('删除成功')
  load()
}

const typeLabel = { first: '一级开发', second: '二级开发' } as const
const prjTypeLabel = { new: '新建', rebuild: '续建', alter: '改建' } as const

onMounted(load)
</script>

<template>
  <el-card>
    <div class="toolbar">
      <el-button v-perm="'system:project:add'" type="primary" @click="openAdd">新增项目</el-button>
    </div>

    <el-table v-loading="loading" :data="list" border>
      <el-table-column prop="name" label="项目名称" min-width="220" />
      <el-table-column prop="prjCode" label="编码" min-width="110" />
      <el-table-column label="分类" width="100">
        <template #default="{ row }">{{
          typeLabel[row.type as keyof typeof typeLabel] ?? row.type
        }}</template>
      </el-table-column>
      <el-table-column label="项目类型" width="90">
        <template #default="{ row }">{{
          prjTypeLabel[row.prjType as keyof typeof prjTypeLabel] ?? row.prjType ?? '-'
        }}</template>
      </el-table-column>
      <el-table-column prop="landUse" label="土地用途" min-width="110" />
      <el-table-column prop="landType" label="土地性质" min-width="90" />
      <el-table-column prop="ratio" label="容积率" width="90" />
      <el-table-column prop="builder" label="建设单位" min-width="120" />
      <el-table-column prop="location" label="项目位置" min-width="140" />
      <el-table-column prop="landSize" label="用地规模" width="100" />
      <el-table-column prop="buildingSize" label="建筑面积" width="100" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">{{
            row.status === 1 ? '进行中' : '已完成'
          }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150">
        <template #default="{ row }">
          <el-button v-perm="'system:project:edit'" type="primary" link @click="openEdit(row)"
            >编辑</el-button
          >
          <el-button v-perm="'system:project:delete'" type="danger" link @click="handleDelete(row)"
            >删除</el-button
          >
        </template>
      </el-table-column>
    </el-table>

    <ProForm
      v-model="dialogVisible"
      :title="isEdit ? '编辑项目' : '新增项目'"
      :initial-values="form as Record<string, unknown>"
      :submit-api="handleSubmit"
      :fields="[
        {
          prop: 'name',
          label: '项目名称',
          rules: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
        },
        { prop: 'prjCode', label: '编码' },
        {
          prop: 'type',
          label: '分类',
          type: 'radio',
          options: [
            { label: '一级开发', value: 'first' },
            { label: '二级开发', value: 'second' },
          ],
        },
        {
          prop: 'prjType',
          label: '项目类型',
          type: 'radio',
          options: [
            { label: '新建', value: 'new' },
            { label: '续建', value: 'rebuild' },
            { label: '改建', value: 'alter' },
          ],
        },
        { prop: 'landUse', label: '土地用途' },
        { prop: 'landType', label: '土地性质' },
        { prop: 'ratio', label: '容积率', type: 'number' },
        { prop: 'builder', label: '建设单位' },
        { prop: 'location', label: '项目位置' },
        { prop: 'landSize', label: '用地规模', type: 'number' },
        { prop: 'buildingSize', label: '建筑面积', type: 'number' },
        {
          prop: 'status',
          label: '状态',
          type: 'radio',
          options: [
            { label: '进行中', value: 1 },
            { label: '已完成', value: 2 },
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
