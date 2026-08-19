<script setup lang="ts">
/**
 * 多标签页：按访问过的路由（meta.title）生成页签，点击跳转、可关闭
 * 仪表盘（/dashboard）作为常驻首页不可关闭；关闭当前页签时跳到相邻页签
 */
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

/** 页签项：path/title 供展示，fullPath 作唯一 key 并用于跳转 */
interface Tab {
  path: string
  title: string
  fullPath: string
}

const route = useRoute()
const router = useRouter()
/** 页签列表，初始自带仪表盘首页 */
const tabs = ref<Tab[]>([{ path: '/dashboard', title: '仪表盘', fullPath: '/dashboard' }])

/** 当前激活的页签（高亮用） */
const activePath = computed(() => route.path)

// 路由变化时按 fullPath 去重，把带标题的新页面追加为页签
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

/**
 * 关闭指定页签；若关闭的是当前激活页签，则跳到相邻页签（优先右侧，其次左侧）
 * @param tab 要关闭的页签
 */
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
