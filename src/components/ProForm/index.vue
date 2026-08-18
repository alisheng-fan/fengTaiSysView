<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormField } from './types'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title: string
    fields: FormField[]
    submitApi: (values: Record<string, unknown>) => Promise<unknown>
    initialValues?: Record<string, unknown>
  }>(),
  { initialValues: () => ({}) },
)

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'success'): void
}>()

const formRef = ref()
const submitting = ref(false)
const form = reactive<Record<string, unknown>>({})

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      Object.keys(form).forEach((k) => delete form[k])
      Object.assign(form, props.initialValues)
      formRef.value?.clearValidate?.()
    }
  },
)

function rulesOf(field: FormField) {
  return field.rules ?? []
}

async function handleConfirm() {
  if (!formRef.value) return
  await formRef.value.validate()
  submitting.value = true
  try {
    await props.submitApi({ ...form })
    ElMessage.success('保存成功')
    emit('success')
    emit('update:modelValue', false)
  } catch {
    // 错误已由请求层提示
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :title="title"
    width="520px"
    :close-on-click-modal="false"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-form ref="formRef" :model="form" label-width="90px">
      <el-form-item
        v-for="f in fields"
        :key="f.prop"
        :label="f.label"
        :prop="f.prop"
        :rules="rulesOf(f)"
      >
        <el-input
          v-if="f.type === 'input' || !f.type"
          v-model="form[f.prop]"
          :placeholder="f.placeholder ?? `请输入${f.label}`"
        />
        <el-input
          v-else-if="f.type === 'textarea'"
          v-model="form[f.prop]"
          type="textarea"
          :rows="3"
          :placeholder="f.placeholder ?? `请输入${f.label}`"
        />
        <el-input-number
          v-else-if="f.type === 'number'"
          v-model="form[f.prop] as number"
          style="width: 100%"
        />
        <el-select
          v-else-if="f.type === 'select'"
          v-model="form[f.prop]"
          :multiple="f.multiple"
          :placeholder="f.placeholder ?? `请选择${f.label}`"
          style="width: 100%"
        >
          <el-option
            v-for="o in f.options ?? []"
            :key="o.value"
            :label="o.label"
            :value="o.value"
          />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleConfirm">确定</el-button>
    </template>
  </el-dialog>
</template>
