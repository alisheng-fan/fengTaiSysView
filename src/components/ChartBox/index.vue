<script setup lang="ts">
/**
 * 图表容器：封装 echarts 初始化、渲染、自适应尺寸与卸载清理
 * - 接收 EChartsOption，option 变化时自动重绘（loading 中不重绘）
 * - 通过 ResizeObserver 跟随容器尺寸变化自动 resize
 */
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'

const props = withDefaults(
  defineProps<{ option: EChartsOption; height?: string; loading?: boolean }>(),
  { height: '300px', loading: false },
)

/** 图表容器 DOM（挂载 echarts 实例的节点） */
const el = ref<HTMLDivElement>()
/** echarts 实例（懒创建，卸载时销毁置空） */
let chart: echarts.ECharts | null = null
/** 容器尺寸监听器（容器大小变化时调用 chart.resize） */
let observer: ResizeObserver | null = null

/** 渲染图表：实例不存在则初始化，notMerge=true 完全替换旧配置 */
function render() {
  if (!el.value) return
  if (!chart) chart = echarts.init(el.value)
  chart.setOption(props.option, true)
}

onMounted(() => {
  render()
  observer = new ResizeObserver(() => chart?.resize())
  if (el.value) observer.observe(el.value)
})

// option 变化时重绘；loading 中跳过，避免加载态下被旧数据覆盖
watch(
  () => props.option,
  () => {
    if (!props.loading) render()
  },
  { deep: true },
)

onBeforeUnmount(() => {
  observer?.disconnect()
  chart?.dispose()
  chart = null
})
</script>

<template>
  <div v-loading="loading" class="chart-box" :style="{ height }">
    <div ref="el" :style="{ height }" />
  </div>
</template>
