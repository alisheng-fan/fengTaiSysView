<script setup lang="ts">
/**
 * 通用 ProTable：封装搜索表单 + 表格 + 分页
 * - 通过 fetchApi 拉取数据，自带 loading / 分页 / 查询 / 重置
 * - 表头支持插槽自定义渲染（Column.slot），外部可通过 ref 调用 load/refresh
 */
import { onMounted, reactive, ref } from 'vue'
import type { Column, FetchApi, SearchField } from './types'

const props = withDefaults(
  defineProps<{
    columns: Column[]
    searchFields?: SearchField[]
    fetchApi: FetchApi
    rowKey?: string
    pageSizes?: number[]
  }>(),
  { searchFields: () => [], rowKey: 'id', pageSizes: () => [10, 20, 50] },
)

/** 表格数据（fetchApi 返回的 list） */
const tableData = ref<Record<string, unknown>[]>([])
/** 加载中标志（el-table v-loading） */
const loading = ref(false)
/** 数据总条数（分页 total） */
const total = ref(0)
/** 搜索条件（key 为 searchFields 的 prop，查询时原样传给 fetchApi） */
const query = reactive<Record<string, unknown>>({})
/** 分页状态：当前页与每页条数 */
const pagination = reactive({ page: 1, pageSize: 10 })

/** 携带当前查询条件与分页参数请求列表 */
async function load() {
  loading.value = true
  try {
    const res = await props.fetchApi({ ...query, page: pagination.page, pageSize: pagination.pageSize })
    tableData.value = res.list as Record<string, unknown>[]
    total.value = res.total
  } finally {
    loading.value = false
  }
}

/** 查询：回到第一页再加载 */
function handleSearch() {
  pagination.page = 1
  load()
}

/** 重置：清空所有搜索条件并回到第一页重新查询 */
function handleReset() {
  Object.keys(query).forEach((k) => {
    query[k] = ''
  })
  handleSearch()
}

/** 页码变化时按新页码加载 */
function handlePageChange(page: number) {
  pagination.page = page
  load()
}

/** 每页条数变化时重置为第一页并重新加载 */
function handleSizeChange(size: number) {
  pagination.pageSize = size
  pagination.page = 1
  load()
}

/** 对外暴露刷新方法（refresh 为 load 的别名） */
defineExpose({ load, refresh: load })
onMounted(load)
</script>

<template>
  <div class="pro-table">
    <el-form v-if="searchFields.length" inline class="pro-table__search" @submit.prevent="handleSearch">
      <el-form-item v-for="f in searchFields" :key="f.prop" :label="f.label">
        <el-input
          v-if="(f.type ?? 'input') === 'input'"
          v-model="query[f.prop]"
          clearable
          :placeholder="f.placeholder ?? `请输入${f.label}`"
          style="width: 180px"
        />
        <el-select
          v-else
          v-model="query[f.prop]"
          clearable
          :placeholder="f.placeholder ?? `请选择${f.label}`"
          style="width: 180px"
        >
          <el-option v-for="o in f.options ?? []" :key="o.value" :label="o.label" :value="o.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="tableData" :row-key="rowKey" border>
      <el-table-column
        v-for="c in columns"
        :key="c.prop"
        :prop="c.prop"
        :label="c.label"
        :width="c.width"
        :min-width="c.minWidth"
        :align="c.align"
        :sortable="c.sortable"
        :show-overflow-tooltip="c.showOverflowTooltip"
      >
        <template v-if="c.slot" #default="{ row }">
          <slot :name="c.slot" :row="row">{{ row[c.prop] }}</slot>
        </template>
      </el-table-column>
    </el-table>

    <div class="pro-table__pager">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="total"
        :page-sizes="pageSizes"
        layout="total, sizes, prev, pager, next"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>
  </div>
</template>

<style scoped>
.pro-table__search {
  margin-bottom: 8px;
}
.pro-table__pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
</style>
