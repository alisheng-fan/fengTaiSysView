<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

interface Tab {
  path: string
  title: string
  fullPath: string
}

const route = useRoute()
const router = useRouter()
const tabs = ref<Tab[]>([{ path: '/dashboard', title: '仪表盘', fullPath: '/dashboard' }])

const activePath = computed(() => route.path)

watch(
  () => route.fullPath,
  (fullPath) => {
    const title = route.meta?.title as string | undefined
    if (!title || !fullPath) return
    const exists = tabs.value.some((t) => t.fullPath === fullPath)
    if (!exists) tabs.value.push({ path: route.path, title, fullPath })
  },
  { immediate: true },
)

function closeTab(tab: Tab) {
  const index = tabs.value.findIndex((t) => t.fullPath === tab.fullPath)
  tabs.value.splice(index, 1)
  if (tab.fullPath === activePath.value) {
    const next = tabs.value[index] ?? tabs.value[index - 1]
    if (next) router.push(next.fullPath)
  }
}
</script>

<template>
  <div class="tags-view">
    <el-tag
      v-for="tab in tabs"
      :key="tab.fullPath"
      :closable="tab.fullPath !== '/dashboard'"
      :effect="tab.fullPath === activePath ? 'dark' : 'plain'"
      @click="router.push(tab.fullPath)"
      @close="closeTab(tab)"
    >
      {{ tab.title }}
    </el-tag>
  </div>
</template>

<style scoped>
.tags-view {
  display: flex;
  gap: 8px;
  padding: 8px 16px;
  border-bottom: 1px solid #e4e7ed;
  background: #fff;
}
.tags-view .el-tag {
  cursor: pointer;
}
</style>
