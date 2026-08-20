<script setup lang="ts">
/**
 * 节点管理页
 * - 节点列表（所属项目/名称/步骤/排序/状态/字段数）+ 新增/编辑/删除
 * - 字段配置编辑器：为每个节点配置动态填报表单的字段（标签/字段名/类型/必填/选项）
 */
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createNode, deleteNode, getNodeList, getProjectList, updateNode } from '@/api/system'
import ProForm from '@/components/ProForm/index.vue'
import type { FieldConfig, FieldType, NodeItem, ProjectItem } from '@/types'

/** 节点列表数据 */
const list = ref<NodeItem[]>([])
/** 列表加载中标志（el-table v-loading） */
const loading = ref(false)
/** 新增/编辑节点弹窗可见性 */
const dialogVisible = ref(false)
/** 当前弹窗是否为编辑模式（true=编辑，false=新增） */
const isEdit = ref(false)
/** 新增/编辑弹窗的表单数据（编辑时整行节点回填） */
const form = reactive<Partial<NodeItem>>({})
/** 项目列表（所属项目下拉与列回显用） */
const projects = ref<ProjectItem[]>([])

/** 按项目 id 查找项目名称（无匹配显示占位符） */
function projectName(id: string) {
  return projects.value.find((p) => p.id === id)?.name ?? '-'
}

/** 加载节点列表 */
async function load() {
  loading.value = true
  try {
    list.value = await getNodeList()
  } finally {
    loading.value = false
  }
}

/** 打开"新增节点"弹窗，重置表单为默认值 */
function openAdd() {
  isEdit.value = false
  Object.assign(form, { name: '', projectId: '', step: 1, sort: 1, status: 1 })
  dialogVisible.value = true
}

/**
 * 打开"编辑节点"弹窗，回填节点数据
 * @param row 当前行节点数据
 */
function openEdit(row: NodeItem) {
  isEdit.value = true
  Object.assign(form, { ...row })
  dialogVisible.value = true
}

/**
 * 新增/编辑弹窗提交回调（由 ProForm submitApi 调用）
 * @param values 弹窗表单提交的字段值（name/projectId/step/sort/status）
 */
async function handleSubmit(values: Record<string, unknown>) {
  if (isEdit.value) {
    // 编辑：以原节点为基础合并新值（保留 id/fields 等字段）
    await updateNode({ ...(form as NodeItem), ...values } as NodeItem)
  } else {
    // 新增：提交表单值创建节点（fields 默认空数组）
    await createNode(values as Partial<NodeItem>)
  }
  load()
}

/**
 * 删除节点（二次确认后调用接口）
 * @param row 当前行节点数据
 */
async function handleDelete(row: NodeItem) {
  await ElMessageBox.confirm(`确定删除节点「${row.name}」？`, '提示', { type: 'warning' })
  await deleteNode(row.id)
  ElMessage.success('删除成功')
  load()
}

// ---------- 字段配置编辑器 ----------
/** 字段配置弹窗可见性 */
const fieldVisible = ref(false)
/**
 * 正在编辑的字段行。
 * optionsText 为编辑器内专用字段（textarea 每行一个选项），保存时转成 options，不持久化
 */
const fieldRows = ref<(FieldConfig & { optionsText?: string })[]>([])
/** 正在配置字段的节点 */
const editingNode = ref<NodeItem | null>(null)

/**
 * 打开"配置字段"弹窗，把节点的 options 还原为编辑器用的 optionsText（每行一个）
 * @param row 当前行节点数据
 */
function openFieldConfig(row: NodeItem) {
  editingNode.value = row
  fieldRows.value = row.fields.map((f) => ({
    ...f,
    optionsText: (f.options ?? []).map((o) => o.label).join('\n'),
  }))
  fieldVisible.value = true
}

/** 添加一行空白字段（prop 默认 field_N） */
function addFieldRow() {
  fieldRows.value.push({ prop: `field_${fieldRows.value.length + 1}`, label: '', type: 'input' })
}

/**
 * 删除指定行的字段
 * @param index 字段在 fieldRows 中的下标
 */
function removeFieldRow(index: number) {
  fieldRows.value.splice(index, 1)
}

/**
 * 保存字段配置：校验（标签/字段名非空、字段名唯一）→ select/radio 的 optionsText 转 options → 更新节点
 */
async function saveFieldConfig() {
  // 校验 1：标签与字段名不能为空
  const empty = fieldRows.value.find((f) => !f.label.trim() || !f.prop.trim())
  if (empty) {
    ElMessage.warning('字段的标签和字段名不能为空')
    return
  }
  // 校验 2：字段名不能重复（避免填报页多个字段共用一个 key 导致数据覆盖）
  if (new Set(fieldRows.value.map((f) => f.prop.trim())).size !== fieldRows.value.length) {
    ElMessage.warning('字段名不能重复')
    return
  }
  // 把编辑行转成持久化的 FieldConfig（去掉编辑器专用的 optionsText）
  const finalRows: FieldConfig[] = fieldRows.value.map((row) => {
    const base: FieldConfig = {
      prop: row.prop,
      label: row.label,
      type: row.type,
      required: row.required ?? false,
    }
    // 下拉/单选：把"每行一个选项"的文本转成 options 数组
    const isChoice = row.type === 'select' || row.type === 'radio'
    if (isChoice) {
      base.options = (row.optionsText ?? '')
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => ({ label: s, value: s }))
    }
    return base
  })
  if (!editingNode.value) return
  // 更新节点并携带新的字段配置
  await updateNode({ ...editingNode.value, fields: finalRows })
  ElMessage.success('字段配置已保存')
  fieldVisible.value = false
  load()
}

/** 字段类型 → 中文标签（字段配置编辑器的类型下拉用） */
const typeLabel: Record<FieldType, string> = {
  input: '输入框',
  textarea: '多行文本',
  number: '数字',
  select: '下拉',
  date: '日期',
  radio: '单选',
}

onMounted(async () => {
  // 并行加载节点列表与项目列表（所属项目列/下拉依赖项目数据）
  const [, projectList] = await Promise.all([load(), getProjectList()])
  projects.value = projectList
})
</script>

<template>
  <el-card>
    <div class="toolbar">
      <el-button v-perm="'system:node:add'" type="primary" @click="openAdd">新增节点</el-button>
    </div>

    <el-table v-loading="loading" :data="list" border>
      <el-table-column label="所属项目" min-width="220">
        <template #default="{ row }">{{ projectName(row.projectId) }}</template>
      </el-table-column>
      <el-table-column prop="name" label="节点名称" min-width="140" />
      <el-table-column prop="step" label="步骤" width="80" />
      <el-table-column prop="sort" label="排序" width="80" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">{{
            row.status === 1 ? '进行中' : '已完成'
          }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="字段数" width="90">
        <template #default="{ row }">{{ row.fields.length }}</template>
      </el-table-column>
      <el-table-column label="操作" width="240">
        <template #default="{ row }">
          <el-button v-perm="'system:node:config'" type="primary" link @click="openFieldConfig(row)"
            >配置字段</el-button
          >
          <el-button v-perm="'system:node:edit'" type="primary" link @click="openEdit(row)"
            >编辑</el-button
          >
          <el-button v-perm="'system:node:delete'" type="danger" link @click="handleDelete(row)"
            >删除</el-button
          >
        </template>
      </el-table-column>
    </el-table>

    <ProForm
      v-model="dialogVisible"
      :title="isEdit ? '编辑节点' : '新增节点'"
      :initial-values="form as Record<string, unknown>"
      :submit-api="handleSubmit"
      :fields="[
        {
          prop: 'name',
          label: '节点名称',
          rules: [{ required: true, message: '请输入节点名称', trigger: 'blur' }],
        },
        {
          prop: 'projectId',
          label: '所属项目',
          type: 'select',
          options: projects.map((p) => ({ label: p.name, value: p.id })),
        },
        { prop: 'step', label: '步骤', type: 'number' },
        { prop: 'sort', label: '排序', type: 'number' },
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

    <!-- 字段配置编辑器 -->
    <el-dialog
      v-model="fieldVisible"
      :title="`配置字段：${editingNode?.name ?? ''}`"
      width="680px"
      destroy-on-close
    >
      <el-table :data="fieldRows" border>
        <el-table-column label="标签" min-width="120">
          <template #default="{ row }">
            <el-input v-model="row.label" placeholder="显示名" />
          </template>
        </el-table-column>
        <el-table-column label="字段名" min-width="120">
          <template #default="{ row }">
            <el-input v-model="row.prop" placeholder="prop" />
          </template>
        </el-table-column>
        <el-table-column label="类型" width="120">
          <template #default="{ row }">
            <el-select v-model="row.type" style="width: 100%">
              <el-option
                v-for="(label, type) in typeLabel"
                :key="type"
                :label="label"
                :value="type"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="必填" width="60">
          <template #default="{ row }">
            <el-checkbox v-model="row.required" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80">
          <template #default="{ $index }">
            <el-button type="danger" link @click="removeFieldRow($index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 选项（仅 select/radio 显示） -->
      <div
        v-if="fieldRows.some((f) => f.type === 'select' || f.type === 'radio')"
        class="field-options"
      >
        <template v-for="(row, i) in fieldRows" :key="i">
          <div v-if="row.type === 'select' || row.type === 'radio'" class="field-option-row">
            <span class="option-label">{{ row.label || row.prop }} 选项（每行一个）：</span>
            <el-input
              v-model="row.optionsText"
              type="textarea"
              :rows="2"
              placeholder="每行一个选项，如：&#10;东城区&#10;西城区"
            />
          </div>
        </template>
      </div>

      <template #footer>
        <el-button @click="fieldVisible = false">取消</el-button>
        <el-button type="primary" @click="addFieldRow">添加字段</el-button>
        <el-button type="primary" @click="saveFieldConfig">保存</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<style scoped>
.toolbar {
  margin-bottom: 12px;
}
.field-options {
  margin-top: 12px;
}
.field-option-row {
  margin-bottom: 8px;
}
.option-label {
  font-size: 13px;
  color: #666;
}
</style>
