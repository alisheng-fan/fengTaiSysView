<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { getNodeList } from '@shared/api/system'
import { useFillStore } from '@/stores/fill'
import type { NodeItem } from '@shared/types'

const route = useRoute()
const router = useRouter()
const fillStore = useFillStore()
const projectId = route.params.id as string

const allNodes = ref<NodeItem[]>([])
const loading = ref(false)

/** 流程节点：getNodeList 按项目过滤 ∩ 角色可见节点，按 step 排序 */
const nodes = computed(() => {
  const visible = new Set(fillStore.nodes.map((n) => n.id))
  return allNodes.value
    .filter((n) => n.projectId === projectId && visible.has(n.id))
    .sort((a, b) => a.step - b.step)
})

onMounted(async () => {
  loading.value = true
  try {
    if (!fillStore.nodes.length) await fillStore.loadNodes()
    allNodes.value = await getNodeList()
  } catch {
    showToast('加载失败')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="project-detail">
    <van-nav-bar title="项目流程" left-arrow @click-left="router.back()" />
    <van-loading v-if="loading" class="page-loading">加载中...</van-loading>
    <van-empty v-else-if="!nodes.length" description="暂无流程节点" />
    <van-cell-group v-else inset>
      <van-cell
        v-for="n in nodes"
        :key="n.id"
        :title="`${n.step}. ${n.name}`"
        :label="`${n.date ?? ''} · ${n.status === 1 ? '进行中' : '已完成'}`"
        is-link
        @click="router.push(`/project/${projectId}/node/${n.id}`)"
      />
    </van-cell-group>
    <div style="margin: 16px">
      <van-button round block plain type="warning" @click="router.push(`/project/${projectId}/issues`)">问题协助记录</van-button>
    </div>
  </div>
</template>
