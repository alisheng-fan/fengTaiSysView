<script setup lang="ts">
/**
 * 统计增强页（PC，只读）
 * - 顶部指标卡：项目总数 / 节点完成率 / 超时节点 / 超时项目 / 问题总数 / 问题已解决
 * - 科室效率表格：各科室节点已完成/总数/完成率
 * - 超时项目清单表格：未完成且截止已过的节点（可跳转节点管理处理）
 * 无权限按钮，页面级只读，不依赖 v-perm。
 */
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getOverdueProjects, getStatisticsOverview } from '@/api/system'
import type { OverdueProjectItem, StatisticsOverview } from '@/types'

const router = useRouter()

/** 统计总览（加载中为 null，卡片区 v-if 兜底） */
const overview = ref<StatisticsOverview | null>(null)
/** 超时项目清单 */
const overdueList = ref<OverdueProjectItem[]>([])
/** 加载中标志（el-table v-loading） */
const loading = ref(false)

/** 顶部指标卡文案与数值（null 时以 '—' 占位） */
const statCards = computed(() => {
  const o = overview.value
  return [
    { label: '项目总数', value: o ? String(o.totalProjects) : '—' },
    { label: '节点完成率', value: o ? `${o.nodeRate}%` : '—' },
    { label: '超时节点', value: o ? String(o.overdueNodes) : '—' },
    { label: '超时项目', value: o ? String(o.overdueProjects) : '—' },
    { label: '问题总数', value: o ? String(o.issueTotal) : '—' },
    { label: '问题已解决', value: o ? String(o.issueSolved) : '—' },
  ]
})

/** 科室效率数据（overview 未加载时给空数组，表格照常渲染） */
const depData = computed(() => overview.value?.depEfficiency ?? [])

/** 完成率（整数百分比，total 为 0 时返回 0） */
function percent(done: number, total: number) {
  return total ? Math.round((done / total) * 100) : 0
}

/** 并行加载总览与超时清单（互不阻塞） */
async function load() {
  loading.value = true
  try {
    const [o, list] = await Promise.all([getStatisticsOverview(), getOverdueProjects()])
    overview.value = o
    overdueList.value = list
  } finally {
    loading.value = false
  }
}

/** 去处理：跳转节点管理页（在办节点在此维护） */
function goHandle() {
  router.push('/system/node')
}

onMounted(load)
</script>

<template>
  <el-card>
    <!-- 顶部指标卡 -->
    <el-row :gutter="16">
      <el-col v-for="s in statCards" :key="s.label" :span="4">
        <div class="stat-card">
          <div class="stat-value">{{ s.value }}</div>
          <div class="stat-label">{{ s.label }}</div>
        </div>
      </el-col>
    </el-row>

    <!-- 科室效率表格 -->
    <el-card class="block" shadow="never">
      <template #header>科室效率</template>
      <el-table v-loading="loading" :data="depData" border>
        <el-table-column prop="depName" label="科室名称" min-width="160" />
        <el-table-column prop="done" label="已完成" width="120" />
        <el-table-column prop="total" label="总数" width="120" />
        <el-table-column label="完成率" min-width="140">
          <template #default="{ row }">
            <el-progress :percentage="percent(row.done, row.total)" />
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 超时项目清单表格 -->
    <el-card class="block" shadow="never">
      <template #header>超时项目清单</template>
      <el-table v-loading="loading" :data="overdueList" border>
        <el-table-column prop="projectName" label="项目名称" min-width="220" />
        <el-table-column prop="nodeName" label="节点名称" min-width="140" />
        <el-table-column prop="deadline" label="截止时间" width="140" />
        <el-table-column label="操作" width="120">
          <template #default>
            <el-button type="primary" link @click="goHandle">去处理</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && overdueList.length === 0" description="暂无超时项目" />
    </el-card>
  </el-card>
</template>

<style scoped>
.stat-card {
  text-align: center;
  padding: 12px 0;
}
.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #409eff;
}
.stat-label {
  margin-top: 4px;
  color: #666;
}
.block {
  margin-top: 16px;
}
</style>
