<script setup lang="ts">
/**
 * 阶段管理页（PC）
 * - 阶段列表（名称/前置阶段/是否齐全/级别/顺序）+ 新增/编辑/删除
 * - 前置阶段下拉排除当前编辑阶段自身（避免自引用）
 */
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createPhase, deletePhase, getPhaseList, updatePhase } from '@/api/system'
import ProForm from '@/components/ProForm/index.vue'
import type { PhaseItem } from '@/types'

/** 阶段列表数据 */
const list = ref<PhaseItem[]>([])
/** 列表加载中标志（el-table v-loading） */
const loading = ref(false)
/** 新增/编辑阶段弹窗可见性 */
const dialogVisible = ref(false)
/** 当前弹窗是否为编辑模式（true=编辑，false=新增） */
const isEdit = ref(false)
/** 新增/编辑弹窗的表单数据（编辑时整行阶段回填） */
const form = reactive<Partial<PhaseItem>>({})

/** 前置阶段下拉选项（排除当前编辑阶段自身，避免自引用） */
const prePhaseOptions = computed(() =>
  list.value.filter((p) => p.id !== form.id).map((p) => ({ label: p.name, value: p.id })),
)

/** 按阶段 id 查找阶段名称（前置阶段列回显用，无匹配显示占位符） */
function phaseName(id?: string) {
  return id ? list.value.find((p) => p.id === id)?.name ?? '-' : '-'
}

/** 加载阶段列表 */
async function load() {
  loading.value = true
  try {
    list.value = await getPhaseList()
  } finally {
    loading.value = false
  }
}

/** 打开"新增阶段"弹窗，重置表单为默认值（preIsAll 用 1/0 表示布尔，提交时再还原） */
function openAdd() {
  isEdit.value = false
  Object.assign(form, { name: '', preIsAll: 1, levelNo: 1, sortNo: 1 })
  dialogVisible.value = true
}

/**
 * 打开"编辑阶段"弹窗，回填阶段数据（布尔 preIsAll → 1/0 供单选回显）
 * @param row 当前行阶段数据
 */
function openEdit(row: PhaseItem) {
  isEdit.value = true
  Object.assign(form, { ...row, preIsAll: row.preIsAll ? 1 : 0 })
  dialogVisible.value = true
}

/**
 * 新增/编辑弹窗提交回调（由 ProForm submitApi 调用），成功后刷新列表。
 * 1/0 → 布尔 preIsAll，保持与 shared 类型一致
 * @param values 弹窗表单提交的字段值
 */
async function handleSubmit(values: Record<string, unknown>) {
  const payload = { ...values, preIsAll: Boolean(values.preIsAll) }
  if (isEdit.value) {
    // 编辑：以原阶段为基础合并新值（保留 id 等字段）
    await updatePhase({ ...(form as PhaseItem), ...payload } as PhaseItem)
  } else {
    // 新增：提交表单值创建阶段
    await createPhase(payload as Partial<PhaseItem>)
  }
  load()
}

/**
 * 删除阶段（二次确认后调用接口），成功后刷新列表
 * @param row 当前行阶段数据
 */
async function handleDelete(row: PhaseItem) {
  await ElMessageBox.confirm(`确定删除阶段「${row.name}」？`, '提示', { type: 'warning' })
  await deletePhase(row.id)
  ElMessage.success('删除成功')
  load()
}

onMounted(load)
</script>

<template>
  <el-card>
    <div class="toolbar">
      <el-button v-perm="'system:phase:add'" type="primary" @click="openAdd">新增阶段</el-button>
    </div>

    <el-table v-loading="loading" :data="list" border>
      <el-table-column prop="name" label="阶段名称" min-width="160" />
      <el-table-column label="前置阶段" min-width="120">
        <template #default="{ row }">{{ phaseName(row.prePhaseId) }}</template>
      </el-table-column>
      <el-table-column label="是否齐全" width="100">
        <template #default="{ row }">
          <el-tag :type="row.preIsAll ? 'success' : 'info'">{{ row.preIsAll ? '是' : '否' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="levelNo" label="级别" width="80" />
      <el-table-column prop="sortNo" label="顺序" width="80" />
      <el-table-column label="操作" width="150">
        <template #default="{ row }">
          <el-button v-perm="'system:phase:edit'" type="primary" link @click="openEdit(row)"
            >编辑</el-button
          >
          <el-button v-perm="'system:phase:delete'" type="danger" link @click="handleDelete(row)"
            >删除</el-button
          >
        </template>
      </el-table-column>
    </el-table>

    <ProForm
      v-model="dialogVisible"
      :title="isEdit ? '编辑阶段' : '新增阶段'"
      :initial-values="form as Record<string, unknown>"
      :submit-api="handleSubmit"
      :fields="[
        {
          prop: 'name',
          label: '阶段名称',
          rules: [{ required: true, message: '请输入阶段名称', trigger: 'blur' }],
        },
        { prop: 'prePhaseId', label: '前置阶段', type: 'select', options: prePhaseOptions },
        {
          prop: 'preIsAll',
          label: '是否齐全',
          type: 'radio',
          options: [
            { label: '是', value: 1 },
            { label: '否', value: 0 },
          ],
        },
        { prop: 'levelNo', label: '级别', type: 'number' },
        { prop: 'sortNo', label: '顺序', type: 'number' },
      ]"
    />
  </el-card>
</template>

<style scoped>
.toolbar {
  margin-bottom: 12px;
}
</style>
