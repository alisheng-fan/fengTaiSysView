<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { getOverdueProjects, getStatisticsOverview } from '@shared/api/system'
import type { OverdueProjectItem, StatisticsOverview } from '@shared/types'

const router = useRouter()

/** 统计总览（加载中为 null，模板 v-if 兜底） */
const stat = ref<StatisticsOverview | null>(null)
/** 超时项目清单（未完成且截止已过，按截止时间升序） */
const overdueList = ref<OverdueProjectItem[]>([])
const loading = ref(false)

/** 完成率（整数百分比，total 为 0 时返回 0） */
function percent(done: number, total: number) {
  return total ? Math.round((done / total) * 100) : 0
}

/** 跳转项目详情：仅当存在 projectId 时跳转 */
function goProject(item: OverdueProjectItem) {
  if (item.projectId) router.push(`/project/${item.projectId}`)
}

onMounted(async () => {
  loading.value = true
  try {
    // 总览与超时清单并行加载（互不阻塞）
    const [o, list] = await Promise.all([getStatisticsOverview(), getOverdueProjects()])
    stat.value = o
    overdueList.value = list
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
      <!-- 既有 6 卡（项目/一级/二级/问题/已解决/业务量） -->
      <van-grid :column-num="3" :border="false">
        <van-grid-item icon="records-o" :text="`项目 ${stat.totalProjects}`" />
        <van-grid-item icon="label-o" :text="`一级 ${stat.firstCount}`" />
        <van-grid-item icon="label-o" :text="`二级 ${stat.secondCount}`" />
        <van-grid-item icon="warning-o" :text="`问题 ${stat.issueTotal}`" />
        <van-grid-item icon="success" :text="`已解决 ${stat.issueSolved}`" />
        <van-grid-item icon="chart-trending-o" :text="`业务量 ${stat.bizTotal}`" />
      </van-grid>

      <!-- 节点完成率 -->
      <van-cell-group inset class="block">
        <van-cell title="节点完成率">
          <template #value>
            <span class="rate-num">{{ stat.nodeRate }}%</span>
          </template>
          <template #label>
            <van-progress :percentage="stat.nodeRate" :show-pivot="false" :stroke-width="8" color="#1989fa" />
            <div class="rate-text">节点完成率 {{ stat.nodeRate }}%（{{ stat.nodeDone }}/{{ stat.nodeTotal }}）</div>
          </template>
        </van-cell>
      </van-cell-group>

      <!-- 超时统计卡片 -->
      <van-grid :column-num="2" :border="false" class="block overdue-grid">
        <van-grid-item>
          <div class="overdue-num danger">{{ stat.overdueNodes }}</div>
          <div class="overdue-label">超时节点</div>
        </van-grid-item>
        <van-grid-item>
          <div class="overdue-num danger">{{ stat.overdueProjects }}</div>
          <div class="overdue-label">超时项目</div>
        </van-grid-item>
      </van-grid>

      <!-- 科室效率 -->
      <van-cell-group inset class="block">
        <van-cell title="科室效率" />
        <template v-if="stat.depEfficiency.length">
          <van-cell v-for="d in stat.depEfficiency" :key="d.depName" :title="`科室 ${d.depName}`">
            <template #label>
              <div class="dep-label">
                <span>已完成 {{ d.done }}/{{ d.total }}</span>
                <van-progress :percentage="percent(d.done, d.total)" :show-pivot="false" :stroke-width="6" class="dep-bar" />
              </div>
            </template>
            <template #value>
              <span class="dep-rate">{{ percent(d.done, d.total) }}%</span>
            </template>
          </van-cell>
        </template>
        <van-cell v-else title="暂无数据" />
      </van-cell-group>

      <!-- 超时项目清单 -->
      <van-cell-group inset class="block">
        <van-cell title="超时项目清单" />
        <template v-if="overdueList.length">
          <van-cell
            v-for="item in overdueList"
            :key="`${item.projectId}-${item.nodeName}-${item.deadline}`"
            :title="`${item.projectName} · ${item.nodeName}`"
            is-link
            @click="goProject(item)"
          >
            <template #label>
              <span class="deadline">截止 {{ item.deadline }}</span>
            </template>
          </van-cell>
        </template>
        <van-cell v-else title="暂无超时" />
      </van-cell-group>
    </template>
  </div>
</template>

<style scoped>
.monitor {
  padding-bottom: 70px;
}
.block {
  margin-top: 12px;
}
.rate-num {
  color: #1989fa;
  font-weight: 600;
}
.rate-text {
  margin-top: 6px;
  color: #969799;
}
.danger {
  color: #ee0a24;
}
.overdue-num {
  font-size: 26px;
  font-weight: 600;
  line-height: 1.2;
}
.overdue-label {
  margin-top: 4px;
  color: #969799;
}
.dep-label {
  display: flex;
  flex-direction: column;
  color: #969799;
}
.dep-bar {
  margin-top: 6px;
}
.dep-rate {
  color: #1989fa;
  font-weight: 600;
}
.deadline {
  color: #ee0a24;
}
</style>
