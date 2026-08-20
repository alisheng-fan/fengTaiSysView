<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showSuccessToast, showToast } from 'vant'
import { useFillStore } from '@/stores/fill'
import { submitNodeData } from '@shared/api/system'
import { toVantFields, type VantField } from '@/utils/toVantFields'

const route = useRoute()
const router = useRouter()
const fillStore = useFillStore()

const nodeId = route.params.nodeId as string
const node = computed(() => fillStore.nodes.find((n) => n.id === nodeId))
const fields = computed(() => toVantFields(node.value?.fields ?? []))
const form = reactive<Record<string, unknown>>({})

const loading = ref(false)

/** 直进/刷新详情页时 store 未初始化：主动加载一次，加载失败由请求层提示 */
onMounted(async () => {
  if (!fillStore.nodes.length) {
    loading.value = true
    try {
      await fillStore.loadNodes()
    } catch {
      // 加载失败由请求层提示
    } finally {
      loading.value = false
    }
  }
})

// select 用 Picker 弹出选择
const pickerVisible = ref(false)
const activeField = ref<VantField | null>(null)

function openPicker(field: VantField) {
  activeField.value = field
  pickerVisible.value = true
}

// 与 radio 一致，统一存 value（columns 的 value 即选项 value）
function onPickerConfirm({ selectedOptions }: { selectedOptions: { text: string; value: string }[] }) {
  if (activeField.value) form[activeField.value.prop] = selectedOptions[0]?.value ?? ''
  pickerVisible.value = false
}

// date 用 Calendar
const calendarVisible = ref(false)

function onCalendarConfirm(value: Date) {
  if (activeField.value) {
    const y = value.getFullYear()
    const m = String(value.getMonth() + 1).padStart(2, '0')
    const d = String(value.getDate()).padStart(2, '0')
    form[activeField.value.prop] = `${y}-${m}-${d}`
  }
  calendarVisible.value = false
}

function openDate(field: VantField) {
  activeField.value = field
  calendarVisible.value = true
}

/** 必填校验 + 提交 */
async function submit() {
  for (const f of fields.value) {
    if (f.required && (form[f.prop] === undefined || form[f.prop] === '')) {
      showToast(`请填写${f.label}`)
      return
    }
  }
  try {
    await submitNodeData(nodeId, { ...form })
    showSuccessToast('提交成功')
    Object.keys(form).forEach((k) => delete form[k])
  } catch {
    // 错误已由请求层提示
  }
}
</script>

<template>
  <div class="fill-detail">
    <van-nav-bar :title="node?.title ?? '填报'" left-arrow @click-left="router.back()" />

    <van-loading v-if="loading" class="page-loading" size="24">加载中...</van-loading>
    <van-empty v-else-if="!node" description="节点不存在或无权访问" />
    <van-form v-else @submit="submit">
      <van-cell-group inset>
        <template v-for="field in fields" :key="field.prop">
          <van-field
            v-if="field.type === 'input' || field.type === 'number'"
            v-model="form[field.prop]"
            :name="field.prop"
            :label="field.label"
            :type="field.type === 'number' ? 'number' : 'text'"
            :placeholder="field.placeholder"
            :rules="field.required ? [{ required: true, message: field.placeholder }] : []"
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
                <van-radio v-for="o in field.options ?? []" :key="o.value" :name="o.value">
                  {{ o.label }}
                </van-radio>
              </van-radio-group>
            </template>
          </van-field>
        </template>
      </van-cell-group>

      <div style="margin: 16px">
        <van-button round block type="primary" native-type="submit">提交</van-button>
      </div>
    </van-form>

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
        @close="calendarVisible = false"
      />
    </van-popup>
  </div>
</template>
