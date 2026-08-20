<script setup lang="ts">
/**
 * 触发条件管理页（PC）
 * - 条件列表（目标节点/触发节点/触发字段/运算符/条件值/动作/启用）+ 新增/编辑/删除
 * - 表单：目标节点/触发节点 下拉选节点；触发字段下拉按所选触发节点动态加载其字段配置
 *   （ProForm change 事件驱动 liveTriggerNodeId → 重建 triggerFieldOptions）
 */
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createCondition, deleteCondition, getConditionList, getNodeList, updateCondition } from '@/api/system'
import ProForm from '@/components/ProForm/index.vue'
import type { FieldCondition, NodeItem } from '@/types'

/** 条件列表数据 */
const list = ref<FieldCondition[]>([])
/** 节点列表（目标/触发节点下拉 + 列回显节点名/字段标签） */
const nodes = ref<NodeItem[]>([])
/** 列表加载中标志（el-table v-loading） */
const loading = ref(false)
/** 新增/编辑条件弹窗可见性 */
const dialogVisible = ref(false)
/** 当前弹窗是否为编辑模式（true=编辑，false=新增） */
const isEdit = ref(false)
/** 新增/编辑弹窗的表单数据（编辑时整行条件回填） */
const form = reactive<Partial<FieldCondition>>({})
/** 弹窗内当前选中的触发节点（由 ProForm change 事件驱动，供触发字段下拉重建选项） */
const liveTriggerNodeId = ref('')

/** 节点下拉选项（目标节点/触发节点共用） */
const nodeOptions = computed(() => nodes.value.map((n) => ({ label: n.name, value: n.id })))
/** 触发字段下拉选项：按弹窗内所选触发节点动态加载该节点的字段配置 */
const triggerFieldOptions = computed(() => {
  const node = nodes.value.find((n) => n.id === liveTriggerNodeId.value)
  return (node?.fields ?? []).map((f) => ({ label: f.label, value: f.prop }))
})

/** 运算符下拉选项 */
const operatorOptions = [
  { label: '等于', value: 'eq' },
  { label: '不等于', value: 'neq' },
  { label: '属于', value: 'in' },
  { label: '不属于', value: 'notin' },
  { label: '为空', value: 'empty' },
  { label: '不为空', value: 'notempty' },
]
/** 运算符 → 中文（表格列回显用） */
const operatorLabel: Record<FieldCondition['operator'], string> = {
  eq: '等于',
  neq: '不等于',
  in: '属于',
  notin: '不属于',
  empty: '为空',
  notempty: '不为空',
}

/** 按节点 id 查找节点名称（目标/触发节点列回显用，无匹配显示占位符） */
function nodeName(id?: string) {
  return id ? nodes.value.find((n) => n.id === id)?.name ?? '-' : '-'
}
/** 按触发节点 + 字段 prop 查找字段标签（触发字段列回显用，无匹配显示原始 prop） */
function fieldLabel(nodeId?: string, prop?: string) {
  if (!nodeId || !prop) return '-'
  return nodes.value.find((n) => n.id === nodeId)?.fields.find((f) => f.prop === prop)?.label ?? prop
}

/** 加载条件列表 */
async function load() {
  loading.value = true
  try {
    list.value = await getConditionList()
  } finally {
    loading.value = false
  }
}

/** 打开"新增条件"弹窗，重置表单为默认值（enabled 用 1/0 表示布尔，提交时再还原） */
function openAdd() {
  isEdit.value = false
  Object.assign(form, {
    nodeId: '',
    triggerNodeId: '',
    triggerFieldId: '',
    operator: 'eq',
    condValue: '',
    action: 'OPEN',
    enabled: 1,
  })
  liveTriggerNodeId.value = ''
  dialogVisible.value = true
}

/**
 * 打开"编辑条件"弹窗，回填条件数据（布尔 enabled → 1/0 供单选回显）
 * @param row 当前行条件数据
 */
function openEdit(row: FieldCondition) {
  isEdit.value = true
  Object.assign(form, { ...row, enabled: row.enabled ? 1 : 0 })
  liveTriggerNodeId.value = row.triggerNodeId
  dialogVisible.value = true
}

/** ProForm 表单值变化回调：触发节点切换时同步"当前触发节点"，触发字段下拉据此重建选项 */
function onFormChange(prop: string, value: unknown) {
  if (prop === 'triggerNodeId') liveTriggerNodeId.value = String(value ?? '')
}

/**
 * 新增/编辑弹窗提交回调（由 ProForm submitApi 调用），成功后刷新列表。
 * 1/0 → 布尔 enabled，保持与 shared 类型一致。
 * 若所选触发节点不含当前触发字段（切换节点遗留），回退为空串，避免生成非法条件。
 * @param values 弹窗表单提交的字段值
 */
async function handleSubmit(values: Record<string, unknown>) {
  const triggerNode = nodes.value.find((n) => n.id === String(values.triggerNodeId ?? ''))
  const hasField = (triggerNode?.fields ?? []).some((f) => f.prop === values.triggerFieldId)
  const payload = { ...values, triggerFieldId: hasField ? values.triggerFieldId : '', enabled: Boolean(values.enabled) }
  if (isEdit.value) {
    // 编辑：以原条件为基础合并新值（保留 id 等字段）
    await updateCondition({ ...(form as FieldCondition), ...payload } as FieldCondition)
  } else {
    // 新增：提交表单值创建条件
    await createCondition(payload as Partial<FieldCondition>)
  }
  load()
}

/**
 * 删除条件（二次确认后调用接口），成功后刷新列表
 * @param row 当前行条件数据
 */
async function handleDelete(row: FieldCondition) {
  await ElMessageBox.confirm(`确定删除触发条件「${nodeName(row.triggerNodeId)} → ${nodeName(row.nodeId)}」？`, '提示', { type: 'warning' })
  await deleteCondition(row.id)
  ElMessage.success('删除成功')
  load()
}

onMounted(async () => {
  // 并行加载条件列表与节点列表（下拉与列回显均依赖节点）
  await Promise.all([load(), getNodeList().then((d) => (nodes.value = d))])
})
</script>

<template>
  <el-card>
    <div class="toolbar">
      <el-button v-perm="'system:condition:add'" type="primary" @click="openAdd">新增条件</el-button>
    </div>

    <el-table v-loading="loading" :data="list" border>
      <el-table-column label="目标节点" min-width="140">
        <template #default="{ row }">{{ nodeName(row.nodeId) }}</template>
      </el-table-column>
      <el-table-column label="触发节点" min-width="140">
        <template #default="{ row }">{{ nodeName(row.triggerNodeId) }}</template>
      </el-table-column>
      <el-table-column label="触发字段" min-width="120">
        <template #default="{ row }">{{ fieldLabel(row.triggerNodeId, row.triggerFieldId) }}</template>
      </el-table-column>
      <el-table-column label="运算符" width="100">
        <template #default="{ row }">{{ operatorLabel[row.operator as FieldCondition['operator']] }}</template>
      </el-table-column>
      <el-table-column prop="condValue" label="条件值" min-width="100" />
      <el-table-column label="动作" width="90">
        <template #default="{ row }">
          <el-tag :type="row.action === 'OPEN' ? 'success' : 'warning'">{{
            row.action === 'OPEN' ? '开启' : '隐藏'
          }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="启用" width="80">
        <template #default="{ row }">
          <el-tag :type="row.enabled ? 'success' : 'info'">{{ row.enabled ? '是' : '否' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150">
        <template #default="{ row }">
          <el-button v-perm="'system:condition:edit'" type="primary" link @click="openEdit(row)"
            >编辑</el-button
          >
          <el-button v-perm="'system:condition:delete'" type="danger" link @click="handleDelete(row)"
            >删除</el-button
          >
        </template>
      </el-table-column>
    </el-table>

    <ProForm
      v-model="dialogVisible"
      :title="isEdit ? '编辑条件' : '新增条件'"
      :initial-values="form as Record<string, unknown>"
      :submit-api="handleSubmit"
      :fields="[
        {
          prop: 'nodeId',
          label: '目标节点',
          type: 'select',
          options: nodeOptions,
          rules: [{ required: true, message: '请选择目标节点', trigger: 'change' }],
        },
        {
          prop: 'triggerNodeId',
          label: '触发节点',
          type: 'select',
          options: nodeOptions,
          rules: [{ required: true, message: '请选择触发节点', trigger: 'change' }],
        },
        {
          prop: 'triggerFieldId',
          label: '触发字段',
          type: 'select',
          options: triggerFieldOptions,
          rules: [{ required: true, message: '请选择触发字段', trigger: 'change' }],
        },
        { prop: 'operator', label: '运算符', type: 'select', options: operatorOptions },
        { prop: 'condValue', label: '条件值' },
        {
          prop: 'action',
          label: '动作',
          type: 'radio',
          options: [
            { label: '开启', value: 'OPEN' },
            { label: '隐藏', value: 'HIDE' },
          ],
        },
        {
          prop: 'enabled',
          label: '启用',
          type: 'radio',
          options: [
            { label: '是', value: 1 },
            { label: '否', value: 0 },
          ],
        },
      ]"
      @change="onFormChange"
    />
  </el-card>
</template>

<style scoped>
.toolbar {
  margin-bottom: 12px;
}
</style>
