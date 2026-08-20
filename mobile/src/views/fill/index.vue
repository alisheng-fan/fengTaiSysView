<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useFillStore } from '@/stores/fill'

const fillStore = useFillStore()
const router = useRouter()
const loading = ref(false)

/** 加载业务填报节点列表 */
onMounted(async () => {
  loading.value = true
  try {
    await fillStore.loadNodes()
  } catch {
    showToast('加载失败')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="fill-list">
    <van-nav-bar title="业务填报" />
    <van-loading v-if="loading" class="page-loading" size="24">加载中...</van-loading>
    <van-empty v-else-if="!fillStore.nodes.length" description="暂无填报节点" />
    <van-cell-group v-else inset>
      <van-cell
        v-for="node in fillStore.nodes"
        :key="node.id"
        :title="node.title"
        :label="`${node.fields?.length ?? 0} 个字段`"
        is-link
        @click="router.push(`/fill/${node.id}`)"
      />
    </van-cell-group>
  </div>
</template>
