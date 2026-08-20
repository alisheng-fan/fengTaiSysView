<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showSuccessToast, showToast } from 'vant'
import { applyConditions } from '@shared/api/engine'
import {
  createFillRecord,
  getDeptList,
  getNodeFiles,
  getNodeList,
  getNodeRecords,
  updateFillRecord,
  uploadNodeFile,
} from '@shared/api/system'
import { useFillStore } from '@/stores/fill'
import { toVantFields, type VantField } from '@/utils/toVantFields'
import type { DeptItem, FillRecordItem, FlowFileItem } from '@shared/types'

const route = useRoute()
const router = useRouter()
const nodeId = route.params.nodeId as string

const fillStore = useFillStore()

/** 节点信息（含时限/截止/经办科室/状态，供信息卡与超时判定） */
const node = ref<{
  name: string
  fields: VantField[]
  projectId: string
  deadline?: string
  deadlineDays?: number
  dutyDepId?: string
  status?: number
} | null>(null)
const records = ref<FillRecordItem[]>([])
const loading = ref(false)
const denied = ref(false)
const showForm = ref(false)
const editingId = ref('')
const form = reactive<Record<string, string>>({})

/** 规则显隐状态：hideFieldIds 隐藏字段；openNodeIds 保存成功后提示已开启节点 */
const ruleState = ref<{ hideFieldIds: string[]; openNodeIds: string[] }>({ hideFieldIds: [], openNodeIds: [] })
/** 保存成功提示条（openNodeIds 非空时展示） */
const openedNotice = ref('')

/** 附件列表 + 上传 */
const files = ref<FlowFileItem[]>([])
const uploadVisible = ref(false)
const uploadFileName = ref('')

const pickerVisible = ref(false)
const activeField = ref<VantField | null>(null)
const calendarVisible = ref(false)

/** 节点 id → name 映射（openNodeIds 提示用） */
const nodeNameMap = ref(new Map<string, string>())
/** 科室 id → name 映射（扁平化部门树） */
const depNameMap = ref(new Map<string, string>())

/** 可见字段：node.fields 过滤规则隐藏字段（表单渲染与必填校验共用） */
const visibleFields = computed(() =>
  (node.value?.fields ?? []).filter((f) => !ruleState.value.hideFieldIds.includes(f.prop)),
)

/** 经办科室名：映射失败回退 id，无 dutyDepId 显示 '-' */
const depName = computed(() => {
  const id = node.value?.dutyDepId
  if (!id) return '-'
  return depNameMap.value.get(id) ?? id
})

/** 超时：未完成且截止时间已过（与 detail.vue / mock 口径一致） */
const isOverdue = computed(() => {
  const n = node.value
  return !!n && n.status !== 2 && !!n.deadline && n.deadline < new Date().toISOString().slice(0, 10)
})

/** 字段 prop → label 映射（记录摘要用中文标签替代 prop） */
const fieldLabels = computed(() => {
  const map: Record<string, string> = {}
  for (const f of node.value?.fields ?? []) map[f.prop] = f.label
  return map
})

/** 附件大小格式化：字节 → KB */
const fmtSize = (bytes: number) => (bytes > 0 ? `${Math.round(bytes / 1024)} KB` : '0 KB')

/** 加载科室名映射（失败降级为空映射，不影响节点展示） */
async function loadDepts() {
  try {
    const list = await getDeptList()
    const map = new Map<string, string>()
    const walk = (ds: DeptItem[]) => {
      for (const d of ds) {
        map.set(d.id, d.name)
        if (d.children?.length) walk(d.children)
      }
    }
    walk(list)
    depNameMap.value = map
  } catch {
    depNameMap.value = new Map()
  }
}

/** 加载附件列表（失败降级为空列表） */
async function loadFiles() {
  try {
    files.value = await getNodeFiles(nodeId)
  } catch {
    files.value = []
  }
}

/**
 * 加载节点配置 + 填报记录 + 附件
 * 深链防护：节点可见性由角色分配决定（fillStore = getMe 菜单中的业务填报节点），
 * 未分配的用户直接访问 /project/:id/node/:nodeId 一律按无权访问处理。
 */
async function load() {
  loading.value = true
  ruleState.value = { hideFieldIds: [], openNodeIds: [] }
  openedNotice.value = ''
  try {
    if (!fillStore.nodes.length) await fillStore.loadNodes()
    if (!fillStore.nodes.some((n) => n.id === nodeId)) {
      denied.value = true
      node.value = null
      records.value = []
      return
    }
    const nodes = await getNodeList()
    const n = nodes.find((x) => x.id === nodeId)
    if (!n) {
      denied.value = true
      node.value = null
      records.value = []
      return
    }
    nodeNameMap.value = new Map(nodes.map((x) => [x.id, x.name]))
    node.value = {
      name: n.name,
      fields: toVantFields(n.fields),
      projectId: n.projectId,
      deadline: n.deadline,
      deadlineDays: n.deadlineDays,
      dutyDepId: n.dutyDepId,
      status: n.status,
    }
    records.value = await getNodeRecords(nodeId)
    await Promise.allSettled([loadDepts(), loadFiles()])
  } catch {
    showToast('加载失败')
  } finally {
    loading.value = false
  }
}

/** 打开新增填报表单 */
function openAdd() {
  editingId.value = ''
  ruleState.value = { hideFieldIds: [], openNodeIds: [] }
  openedNotice.value = ''
  Object.keys(form).forEach((k) => delete form[k])
  showForm.value = true
}

/** 打开编辑填报表单，回填记录 */
function openEdit(r: FillRecordItem) {
  editingId.value = r.id
  // 编辑不沿用上次判定的隐藏字段：重置规则，让用户看到全部字段
  ruleState.value = { hideFieldIds: [], openNodeIds: [] }
  openedNotice.value = ''
  Object.keys(form).forEach((k) => delete form[k])
  Object.assign(form, r.values)
  showForm.value = true
}

/** 提交新增/编辑填报 */
async function submit() {
  if (!node.value) return
  // 规则判定：按当前表单值实时计算隐藏字段与应开启节点（必填校验与表单渲染都用判定后的 visibleFields）
  try {
    ruleState.value = await applyConditions(nodeId, { ...form })
  } catch {
    ruleState.value = { hideFieldIds: [], openNodeIds: [] }
  }
  for (const f of visibleFields.value) {
    if (f.required && !form[f.prop]) {
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
    const openNames = ruleState.value.openNodeIds.map((id) => nodeNameMap.value.get(id) ?? id).join('、')
    // 持久化开启门禁：isDefault=false 的条件节点在本次会话内于详情看板可见
    if (ruleState.value.openNodeIds.length) fillStore.openNodes(ruleState.value.openNodeIds)
    showSuccessToast('保存成功')
    showForm.value = false
    await load()
    // load() 已清空 openedNotice，这里重新设置，让提示条在刷新后仍然可见
    if (openNames) openedNotice.value = `已开启节点：${openNames}`
  } catch {
    // 错误已提示
  }
}

/** 打开附件（mock 路径可直接打开） */
function openFile(f: FlowFileItem) {
  window.open(f.filePath)
}

/** 上传前校验：文件名非空才允许关闭弹窗 */
function beforeUploadClose(action: string): boolean {
  if (action === 'confirm' && !uploadFileName.value.trim()) {
    showToast('请输入文件名')
    return false
  }
  return true
}

/** 确认上传附件：mock 只存文件名，成功后刷新附件列表 */
async function confirmUpload() {
  try {
    await uploadNodeFile(nodeId, uploadFileName.value.trim())
    showSuccessToast('上传成功')
    uploadFileName.value = ''
    await loadFiles()
  } catch {
    // 错误已提示
  }
}

// 注：填报记录"删除"本期未实现（mock 无 delete 端点），如需补 /api/node/:id/records/:rid DELETE

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
    <van-empty v-else-if="denied" description="节点不存在或无权访问" />
    <template v-else-if="node">
      <van-notice-bar v-if="openedNotice" :text="openedNotice" color="#1989fa" background="#ecf9ff" />

      <!-- 节点信息卡：办理时限 / 截止 / 经办科室 / 状态（超时红标） -->
      <div class="node-info">
        <div class="node-info-line">
          办理时限 {{ node.deadlineDays ?? '-' }}天 · 截止 {{ node.deadline ?? '-' }} · 经办科室 {{ depName }}
        </div>
        <div class="node-info-tags">
          <van-tag v-if="isOverdue" type="danger">已超时</van-tag>
          <van-tag v-else :type="node.status === 1 ? 'primary' : 'default'">
            {{ node.status === 1 ? '进行中' : '已完成' }}
          </van-tag>
        </div>
      </div>

      <!-- 附件列表 -->
      <div class="section-title">附件</div>
      <van-cell-group v-if="files.length" inset>
        <van-cell
          v-for="f in files"
          :key="f.id"
          :title="f.fileName"
          :label="`${fmtSize(f.fileSize)} · ${f.uploadMan} · ${f.uploadTime}`"
          is-link
          @click="openFile(f)"
        />
      </van-cell-group>
      <van-empty v-else description="暂无附件" />

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
          :label="Object.entries(r.values).map(([k, v]) => `${fieldLabels[k] ?? k}: ${v}`).join('；')"
          is-link
          @click="openEdit(r)"
        />
      </van-cell-group>

      <!-- 填报弹窗 -->
      <van-popup v-model:show="showForm" position="bottom" round style="height: 80%">
        <van-nav-bar :title="editingId ? '编辑填报' : '新增填报'" @click-left="showForm = false" />
        <van-form @submit="submit">
          <van-cell-group inset>
            <template v-for="field in visibleFields" :key="field.prop">
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
          <div style="margin: 16px; display: flex; flex-direction: column; gap: 8px">
            <van-button round block type="primary" native-type="submit">保存</van-button>
            <van-button round block plain type="primary" @click="uploadVisible = true">添加附件</van-button>
          </div>
        </van-form>
      </van-popup>

      <!-- 添加附件弹窗：输文件名即可（mock 只存文件名） -->
      <van-dialog
        v-model:show="uploadVisible"
        title="添加附件"
        show-cancel-button
        :before-close="beforeUploadClose"
        @confirm="confirmUpload"
      >
        <van-field v-model="uploadFileName" label="文件名" placeholder="如：台账数据表.xlsx" />
      </van-dialog>

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
.node-info {
  margin: 12px 16px;
  padding: 12px;
  border-radius: 8px;
  background: #f7f8fa;
  font-size: 13px;
  color: #323233;
}
.node-info-line {
  line-height: 1.6;
}
.node-info-tags {
  margin-top: 6px;
}
.section-title {
  margin: 16px 16px 8px;
  font-size: 14px;
  font-weight: 600;
  color: #323233;
}
.record-toolbar {
  margin: 12px 16px;
  text-align: right;
}
</style>
