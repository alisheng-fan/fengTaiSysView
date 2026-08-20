<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showConfirmDialog, showSuccessToast, showToast } from 'vant'
import { createFillRecord, getNodeList, getNodeRecords, updateFillRecord } from '@shared/api/system'
import { toVantFields, type VantField } from '@/utils/toVantFields'
import type { FillRecordItem } from '@shared/types'

const route = useRoute()
const router = useRouter()
const projectId = route.params.id as string
const nodeId = route.params.nodeId as string

const node = ref<{ name: string; fields: VantField[]; projectId: string } | null>(null)
const records = ref<FillRecordItem[]>([])
const loading = ref(false)
const showForm = ref(false)
const editingId = ref('')
const form = reactive<Record<string, unknown>>({})

const pickerVisible = ref(false)
const activeField = ref<VantField | null>(null)
const calendarVisible = ref(false)

/** 加载节点配置 + 填报记录 */
async function load() {
  loading.value = true
  try {
    const nodes = await getNodeList()
    const n = nodes.find((x) => x.id === nodeId)
    node.value = n ? { name: n.name, fields: toVantFields(n.fields), projectId: n.projectId } : null
    records.value = await getNodeRecords(nodeId)
  } catch {
    showToast('加载失败')
  } finally {
    loading.value = false
  }
}

/** 打开新增填报表单 */
function openAdd() {
  editingId.value = ''
  Object.keys(form).forEach((k) => delete form[k])
  showForm.value = true
}

/** 打开编辑填报表单，回填记录 */
function openEdit(r: FillRecordItem) {
  editingId.value = r.id
  Object.keys(form).forEach((k) => delete form[k])
  Object.assign(form, r.values)
  showForm.value = true
}

/** 提交新增/编辑填报 */
async function submit() {
  if (!node.value) return
  for (const f of node.value.fields) {
    if (f.required && (form[f.prop] === undefined || form[f.prop] === '')) {
      showToast(`请填写${f.label}`)
      return
    }
  }
  try {
    if (editingId.value) {
      await updateFillRecord(nodeId, editingId.value, { ...form })
    } else {
      await createFillRecord({ nodeId, projectId: node.value.projectId, values: { ...form } })
    }
    showSuccessToast('保存成功')
    showForm.value = false
    await load()
  } catch {
    // 错误已提示
  }
}

/** 删除填报记录（本期提供删除） */
async function removeRecord(r: FillRecordItem) {
  await showConfirmDialog({ title: '提示', message: '确定删除这条填报记录？' })
  // mock 未提供 delete 端点，本期暂不实现删除（仅前端确认占位）
  showToast('删除功能待接入')
}

function openPicker(field: VantField) {
  activeField.value = field
  pickerVisible.value = true
}
function onPickerConfirm({ selectedOptions }: { selectedOptions: { text: string; value: string }[] }) {
  if (activeField.value) form[activeField.value.prop] = selectedOptions[0]?.value ?? ''
  pickerVisible.value = false
}
function openDate(field: VantField) {
  activeField.value = field
  calendarVisible.value = true
}
function onCalendarConfirm(value: Date) {
  if (activeField.value) {
    const y = value.getFullYear()
    const m = String(value.getMonth() + 1).padStart(2, '0')
    const d = String(value.getDate()).padStart(2, '0')
    form[activeField.value.prop] = `${y}-${m}-${d}`
  }
  calendarVisible.value = false
}

onMounted(load)
</script>

<template>
  <div class="node-fill">
    <van-nav-bar :title="node?.name ?? '填报'" left-arrow @click-left="router.back()" />

    <van-loading v-if="loading" class="page-loading">加载中...</van-loading>
    <template v-else-if="node">
      <!-- 记录列表 -->
      <div class="record-toolbar">
        <van-button size="small" round type="primary" @click="openAdd">新增填报</van-button>
      </div>
      <van-empty v-if="!records.length" description="暂无填报记录" />
      <van-cell-group v-else inset>
        <van-cell
          v-for="r in records"
          :key="r.id"
          :title="`${r.createTime} · ${r.createBy}`"
          :label="Object.entries(r.values).map(([k, v]) => `${k}: ${v}`).join('；')"
          is-link
          @click="openEdit(r)"
        />
      </van-cell-group>

      <!-- 填报弹窗 -->
      <van-popup v-model:show="showForm" position="bottom" round style="height: 80%">
        <van-nav-bar :title="editingId ? '编辑填报' : '新增填报'" @click-left="showForm = false" />
        <van-form @submit="submit">
          <van-cell-group inset>
            <template v-for="field in node.fields" :key="field.prop">
              <van-field
                v-if="field.type === 'input' || field.type === 'number'"
                v-model="form[field.prop]"
                :name="field.prop"
                :label="field.label"
                :type="field.type === 'number' ? 'number' : 'text'"
                :placeholder="field.placeholder"
              />
              <van-field
                v-else-if="field.type === 'textarea'"
                v-model="form[field.prop]"
                :name="field.prop"
                :label="field.label"
                type="textarea"
                rows="3"
                autosize
                :placeholder="field.placeholder"
              />
              <van-field
                v-else-if="field.type === 'select'"
                :model-value="String(form[field.prop] ?? '')"
                :name="field.prop"
                :label="field.label"
                is-link
                readonly
                :placeholder="field.placeholder"
                @click="openPicker(field)"
              />
              <van-field
                v-else-if="field.type === 'date'"
                :model-value="String(form[field.prop] ?? '')"
                :name="field.prop"
                :label="field.label"
                is-link
                readonly
                :placeholder="field.placeholder"
                @click="openDate(field)"
              />
              <van-field v-else-if="field.type === 'radio'" :name="field.prop" :label="field.label">
                <template #input>
                  <van-radio-group v-model="form[field.prop]">
                    <van-radio v-for="o in field.options ?? []" :key="o.value" :name="o.value">{{ o.label }}</van-radio>
                  </van-radio-group>
                </template>
              </van-field>
            </template>
          </van-cell-group>
          <div style="margin: 16px">
            <van-button round block type="primary" native-type="submit">保存</van-button>
          </div>
        </van-form>
      </van-popup>

      <van-popup v-model:show="pickerVisible" position="bottom">
        <van-picker
          :columns="(activeField?.options ?? []).map((o) => ({ text: o.label, value: o.value }))"
          @confirm="onPickerConfirm"
          @cancel="pickerVisible = false"
        />
      </van-popup>
      <van-popup v-model:show="calendarVisible" position="bottom">
        <van-calendar
          :poppable="false"
          :min-date="new Date(2000, 0, 1)"
          :max-date="new Date(2100, 11, 31)"
          @confirm="onCalendarConfirm"
        />
      </van-popup>
    </template>
  </div>
</template>

<style scoped>
.record-toolbar {
  margin: 12px 16px;
  text-align: right;
}
</style>
