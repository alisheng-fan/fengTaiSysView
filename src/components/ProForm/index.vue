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
    /** true=弹窗表单；false=整页表单（无弹窗外壳，底部自带提交按钮） */
    dialog?: boolean
    successMessage?: string
  }>(),
  { initialValues: () => ({}), dialog: true, successMessage: '保存成功' },
)

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'success'): void
}>()

const formRef = ref()
const submitting = ref(false)
const form = reactive<Record<string, unknown>>({})

function resetForm() {
  Object.keys(form).forEach((k) => delete form[k])
  Object.assign(form, props.initialValues)
  formRef.value?.clearValidate?.()
}

watch(
  () => props.modelValue,
  (visible) => {
    if (visible && props.dialog) resetForm()
  },
)

function rulesOf(field: FormField) {
  return field.rules ?? []
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate()
  submitting.value = true
  try {
    await props.submitApi({ ...form })
    ElMessage.success(props.successMessage)
    emit('success')
    if (props.dialog) {
      emit('update:modelValue', false)
    } else {
      resetForm()
    }
  } catch {
    // 错误已由请求层提示
  } finally {
    submitting.value = false
  }
}

defineExpose({ reset: resetForm, submit: handleSubmit })
</script>

<template>
  <!-- 弹窗模式 -->
  <el-dialog
    v-if="dialog"
    :model-value="modelValue"
    :title="title"
    width="520px"
    :close-on-click-modal="false"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-form ref="formRef" :model="form" label-width="90px">
      <el-form-item v-for="f in fields" :key="f.prop" :label="f.label" :prop="f.prop" :rules="rulesOf(f)">
        <el-input v-if="f.type === 'input' || !f.type" v-model="form[f.prop]" :placeholder="f.placeholder ?? `请输入${f.label}`" />
        <el-input v-else-if="f.type === 'textarea'" v-model="form[f.prop]" type="textarea" :rows="3" :placeholder="f.placeholder ?? `请输入${f.label}`" />
        <el-input-number v-else-if="f.type === 'number'" v-model="form[f.prop] as number" style="width: 100%" />
        <el-select v-else-if="f.type === 'select'" v-model="form[f.prop]" :multiple="f.multiple" :placeholder="f.placeholder ?? `请选择${f.label}`" style="width: 100%">
          <el-option v-for="o in f.options ?? []" :key="o.value" :label="o.label" :value="o.value" />
        </el-select>
        <el-date-picker v-else-if="f.type === 'date'" v-model="form[f.prop]" type="date" value-format="YYYY-MM-DD" :placeholder="f.placeholder ?? `请选择${f.label}`" style="width: 100%" />
        <el-radio-group v-else-if="f.type === 'radio'" v-model="form[f.prop]">
          <el-radio v-for="o in f.options ?? []" :key="o.value" :value="o.value">{{ o.label }}</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>

  <!-- 整页模式 -->
  <div v-else class="pro-form-page">
    <el-form ref="formRef" :model="form" label-width="110px">
      <el-form-item v-for="f in fields" :key="f.prop" :label="f.label" :prop="f.prop" :rules="rulesOf(f)">
        <el-input v-if="f.type === 'input' || !f.type" v-model="form[f.prop]" :placeholder="f.placeholder ?? `请输入${f.label}`" />
        <el-input v-else-if="f.type === 'textarea'" v-model="form[f.prop]" type="textarea" :rows="4" :placeholder="f.placeholder ?? `请输入${f.label}`" />
        <el-input-number v-else-if="f.type === 'number'" v-model="form[f.prop] as number" style="width: 100%" />
        <el-select v-else-if="f.type === 'select'" v-model="form[f.prop]" :multiple="f.multiple" :placeholder="f.placeholder ?? `请选择${f.label}`" style="width: 100%">
          <el-option v-for="o in f.options ?? []" :key="o.value" :label="o.label" :value="o.value" />
        </el-select>
        <el-date-picker v-else-if="f.type === 'date'" v-model="form[f.prop]" type="date" value-format="YYYY-MM-DD" :placeholder="f.placeholder ?? `请选择${f.label}`" style="width: 100%" />
        <el-radio-group v-else-if="f.type === 'radio'" v-model="form[f.prop]">
          <el-radio v-for="o in f.options ?? []" :key="o.value" :value="o.value">{{ o.label }}</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">提交</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped>
.pro-form-page {
  max-width: 640px;
}
</style>
