<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectStore } from '@/stores/project'

const projectStore = useProjectStore()
const router = useRouter()

onMounted(async () => {
  await projectStore.loadProjects()
})
</script>

<template>
  <div class="progress">
    <van-nav-bar title="项目进度" />
    <van-cell-group inset>
      <van-cell
        v-for="p in projectStore.projects"
        :key="p.id"
        :title="p.name"
        :label="p.status === 1 ? '进行中' : '已完成'"
        is-link
        @click="router.push(`/project/${p.id}`)"
      />
    </van-cell-group>
  </div>
</template>
