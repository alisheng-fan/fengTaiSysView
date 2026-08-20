<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { showToast } from 'vant'
import { getStatisticsOverview } from '@shared/api/system'
import type { StatisticsOverview } from '@shared/types'

const stat = ref<StatisticsOverview | null>(null)
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    stat.value = await getStatisticsOverview()
  } catch {
    showToast('加载失败')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="monitor">
    <van-nav-bar title="项目监测" />
    <van-loading v-if="loading" class="page-loading">加载中...</van-loading>
    <template v-else-if="stat">
      <van-grid :column-num="3" :border="false">
        <van-grid-item icon="records-o" :text="`项目 ${stat.totalProjects}`" />
        <van-grid-item icon="label-o" :text="`一级 ${stat.firstCount}`" />
        <van-grid-item icon="label-o" :text="`二级 ${stat.secondCount}`" />
        <van-grid-item icon="warning-o" :text="`问题 ${stat.issueTotal}`" />
        <van-grid-item icon="success" :text="`已解决 ${stat.issueSolved}`" />
        <van-grid-item icon="chart-trending-o" :text="`业务量 ${stat.bizTotal}`" />
      </van-grid>
    </template>
  </div>
</template>
