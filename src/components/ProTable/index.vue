<script setup lang="ts">
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

const tableData = ref<Record<string, unknown>[]>([])
const loading = ref(false)
const total = ref(0)
const query = reactive<Record<string, unknown>>({})
const pagination = reactive({ page: 1, pageSize: 10 })

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

function handleSearch() {
  pagination.page = 1
  load()
}

function handleReset() {
  Object.keys(query).forEach((k) => {
    query[k] = ''
  })
  handleSearch()
}

function handlePageChange(page: number) {
  pagination.page = page
  load()
}

function handleSizeChange(size: number) {
  pagination.pageSize = size
  pagination.page = 1
  load()
}

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
