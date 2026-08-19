<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import ProForm from '@/components/ProForm/index.vue'
import type { FormField } from '@/components/ProForm/types'
import { submitNodeData } from '@/api/system'
import { toFormFields } from '@/utils/form'
import type { FieldConfig } from '@/types'

const route = useRoute()

const nodeId = computed(() => (route.meta.nodeId as string) ?? '')
const title = computed(() => (route.meta.title as string) ?? '填报')
const fields = computed<FormField[]>(() => toFormFields((route.meta.fields as FieldConfig[]) ?? []))

async function submit(values: Record<string, unknown>): Promise<void> {
  await submitNodeData(nodeId.value, values)
}
</script>

<template>
  <el-card>
    <template #header>{{ title }}</template>
    <ProForm
      :model-value="false"
      :dialog="false"
      :title="title"
      :fields="fields"
      :submit-api="submit"
      success-message="提交成功"
    />
  </el-card>
</template>
