<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useProjectStore } from '@/stores/project'

const projectStore = useProjectStore()
const router = useRouter()
const loading = ref(false)
const keyword = ref('')
const filterType = ref('')

const typeLabel = { first: '一级开发', second: '二级开发' } as const

/** 类型筛选项（常量引用，避免每次渲染重建触发 van-dropdown-menu 递归更新） */
const typeOptions = [
  { text: '全部', value: '' },
  { text: '一级开发', value: 'first' },
  { text: '二级开发', value: 'second' },
]

const filtered = computed(() =>
  projectStore.projects.filter(
    (p) =>
      (!filterType.value || p.type === filterType.value) &&
      (!keyword.value || p.name.includes(keyword.value) || (p.builder ?? '').includes(keyword.value)),
  ),
)

onMounted(async () => {
  loading.value = true
  try {
    await projectStore.loadProjects()
  } catch {
    showToast('加载失败')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="home">
    <van-nav-bar title="丰台区项目全周期跟踪平台" />
    <van-search v-model="keyword" placeholder="搜索项目/建设单位" />
    <van-dropdown-menu>
      <van-dropdown-item v-model="filterType" :options="typeOptions" />
    </van-dropdown-menu>

    <van-loading v-if="loading" class="page-loading">加载中...</van-loading>
    <van-empty v-else-if="!filtered.length" description="暂无项目" />
    <van-cell-group v-else inset>
      <van-cell
        v-for="p in filtered"
        :key="p.id"
        :title="p.name"
        :label="`${typeLabel[p.type as keyof typeof typeLabel] ?? p.type} · ${p.location ?? ''}\n用地 ${p.landSize ?? '-'} · 建面 ${p.buildingSize ?? '-'}`"
        is-link
        @click="router.push(`/project/${p.id}`)"
      >
        <template #value>
          <van-tag :type="p.status === 1 ? 'primary' : 'default'">{{ p.status === 1 ? '进行中' : '已完成' }}</van-tag>
        </template>
      </van-cell>
    </van-cell-group>
  </div>
</template>
