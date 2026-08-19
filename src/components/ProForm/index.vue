<script setup lang="ts">
/**
 * 通用 ProForm：按 fields 声明渲染表单，自动校验 + 提交
 * 两种模式由 dialog prop 区分：
 * - dialog=true（默认）：弹窗表单，取消/确定按钮在弹窗底部，提交成功自动关闭
 * - dialog=false：整页表单，无弹窗外壳，底部自带提交按钮，提交成功重置表单
 */
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

/** el-form 实例（用于 validate / clearValidate） */
const formRef = ref()
/** 提交中标志（提交按钮 loading） */
const submitting = ref(false)
/** 表单数据（与 fields 的 prop 一一对应） */
const form = reactive<Record<string, unknown>>({})

/** 重置表单为 initialValues 并清除校验错误 */
function resetForm() {
  Object.keys(form).forEach((k) => delete form[k])
  Object.assign(form, props.initialValues)
  formRef.value?.clearValidate?.()
}

// 弹窗打开时回填初始值（仅弹窗模式需要，页模式首次打开即初始化）
watch(
  () => props.modelValue,
  (visible) => {
    if (visible && props.dialog) resetForm()
  },
)

/** 取字段声明的校验规则（未声明则为空数组） */
function rulesOf(field: FormField) {
  return field.rules ?? []
}

/**
 * 提交：先校验，通过后调用 submitApi；成功提示 + 派发 success 事件，
 * 弹窗模式关闭弹窗、页模式重置表单
 */
async function handleSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    // 校验不通过：表单已展示错误提示，终止提交
    return
  }
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

/** 对外暴露：reset 重置表单，submit 触发校验并提交 */
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
