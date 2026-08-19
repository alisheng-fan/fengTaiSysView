<script setup lang="ts">
/**
 * 数据填报页
 * - 由跳转路由的 meta 携带节点配置（nodeId/title/fields），据此动态渲染 ProForm
 * - 提交时调用 submitNodeData 将表单值写入对应节点
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import ProForm from '@/components/ProForm/index.vue'
import type { FormField } from '@/components/ProForm/types'
import { submitNodeData } from '@/api/system'
import { toFormFields } from '@/utils/form'
import type { FieldConfig } from '@/types'

/** 路由实例（从 meta 读取填报节点配置） */
const route = useRoute()

/** 当前填报节点 id（route.meta.nodeId，缺省为空串） */
const nodeId = computed(() => (route.meta.nodeId as string) ?? '')
/** 填报页标题（route.meta.title，缺省为"填报"） */
const title = computed(() => (route.meta.title as string) ?? '填报')
/** 动态表单字段（将节点字段配置转为 ProForm 可用的 FormField[]） */
const fields = computed<FormField[]>(() => toFormFields((route.meta.fields as FieldConfig[]) ?? []))

/**
 * 提交填报数据到当前节点
 * @param values 表单提交的字段值
 */
async function submit(values: Record<string, unknown>): Promise<void> {
  await submitNodeData(nodeId.value, values)
}
</script>

<template>
  <el-card>
    <template #header>{{ title }}</template>
    <ProForm
      :key="nodeId"
      :model-value="false"
      :dialog="false"
      :title="title"
      :fields="fields"
      :submit-api="submit"
      success-message="提交成功"
    />
  </el-card>
</template>
