<script setup lang="ts">
/**
 * 工作台首页
 * - 顶部统计卡片：部门/角色/用户/在线用户数
 * - 下方图表：各部门人数柱状图、近 7 日访问趋势折线图
 */
import type { EChartsOption } from 'echarts'
import ChartBox from '@/components/ChartBox/index.vue'

/** 统计卡片数据（文案与数值） */
const stats = [
  { label: '部门数', value: 4 },
  { label: '角色数', value: 2 },
  { label: '用户数', value: 2 },
  { label: '在线用户', value: 1 },
]

/** 各部门人数柱状图配置 */
const deptBarOption: EChartsOption = {
  title: { text: '各部门人数' },
  tooltip: {},
  xAxis: { type: 'category', data: ['政务科', '数据科', '平台组'] },
  yAxis: { type: 'value' },
  series: [{ type: 'bar', data: [18, 25, 12], itemStyle: { color: '#409eff' } }],
}

/** 近 7 日访问趋势折线图配置 */
const trendLineOption: EChartsOption = {
  title: { text: '近 7 日访问趋势' },
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] },
  yAxis: { type: 'value' },
  series: [{ type: 'line', data: [120, 200, 150, 80, 170, 90, 210], smooth: true, areaStyle: {} }],
}
</script>

<template>
  <div class="dashboard">
    <el-row :gutter="16">
      <el-col v-for="s in stats" :key="s.label" :span="6">
        <el-card class="stat-card">
          <div class="stat-value">{{ s.value }}</div>
          <div class="stat-label">{{ s.label }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="chart-row">
      <el-col :span="12">
        <el-card><ChartBox :option="deptBarOption" height="320px" /></el-card>
      </el-col>
      <el-col :span="12">
        <el-card><ChartBox :option="trendLineOption" height="320px" /></el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.stat-card {
  text-align: center;
}
.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #409eff;
}
.stat-label {
  margin-top: 4px;
  color: #666;
}
.chart-row {
  margin-top: 16px;
}
</style>
