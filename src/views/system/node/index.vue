<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createNode, deleteNode, getNodeList, updateNode } from '@/api/system'
import ProForm from '@/components/ProForm/index.vue'
import type { FieldConfig, FieldType, NodeItem } from '@/types'

const list = ref<NodeItem[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const form = reactive<Partial<NodeItem>>({})

async function load() {
  loading.value = true
  try {
    list.value = await getNodeList()
  } finally {
    loading.value = false
  }
}

function openAdd() {
  isEdit.value = false
  Object.assign(form, { name: '', sort: 1, status: 1 })
  dialogVisible.value = true
}

function openEdit(row: NodeItem) {
  isEdit.value = true
  Object.assign(form, { ...row })
  dialogVisible.value = true
}

async function handleSubmit(values: Record<string, unknown>) {
  if (isEdit.value) {
    await updateNode({ ...(form as NodeItem), ...values } as NodeItem)
  } else {
    await createNode(values as Partial<NodeItem>)
  }
  load()
}

async function handleDelete(row: NodeItem) {
  await ElMessageBox.confirm(`确定删除节点「${row.name}」？`, '提示', { type: 'warning' })
  await deleteNode(row.id)
  ElMessage.success('删除成功')
  load()
}

// ---------- 字段配置编辑器 ----------
const fieldVisible = ref(false)
const fieldRows = ref<(FieldConfig & { optionsText?: string })[]>([])
const editingNode = ref<NodeItem | null>(null)

function openFieldConfig(row: NodeItem) {
  editingNode.value = row
  fieldRows.value = row.fields.map((f) => ({
    ...f,
    optionsText: (f.options ?? []).map((o) => o.label).join('\n'),
  }))
  fieldVisible.value = true
}

function addFieldRow() {
  fieldRows.value.push({ prop: `field_${fieldRows.value.length + 1}`, label: '', type: 'input' })
}

function removeFieldRow(index: number) {
  fieldRows.value.splice(index, 1)
}

async function saveFieldConfig() {
  const empty = fieldRows.value.find((f) => !f.label.trim() || !f.prop.trim())
  if (empty) {
    ElMessage.warning('字段的标签和字段名不能为空')
    return
  }
  if (new Set(fieldRows.value.map((f) => f.prop.trim())).size !== fieldRows.value.length) {
    ElMessage.warning('字段名不能重复')
    return
  }
  const finalRows: FieldConfig[] = fieldRows.value.map((row) => {
    const base: FieldConfig = {
      prop: row.prop,
      label: row.label,
      type: row.type,
      required: row.required ?? false,
    }
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
  await updateNode({ ...editingNode.value, fields: finalRows })
  ElMessage.success('字段配置已保存')
  fieldVisible.value = false
  load()
}

const typeLabel: Record<FieldType, string> = {
  input: '输入框',
  textarea: '多行文本',
  number: '数字',
  select: '下拉',
  date: '日期',
  radio: '单选',
}

onMounted(load)
</script>

<template>
  <el-card>
    <div class="toolbar">
      <el-button v-perm="'system:node:add'" type="primary" @click="openAdd">新增节点</el-button>
    </div>

    <el-table v-loading="loading" :data="list" border>
      <el-table-column prop="name" label="节点名称" min-width="140" />
      <el-table-column prop="sort" label="排序" width="80" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'">{{
            row.status === 1 ? '启用' : '停用'
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
        { prop: 'sort', label: '排序', type: 'number' },
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
