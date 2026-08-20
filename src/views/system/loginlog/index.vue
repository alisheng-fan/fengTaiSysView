<script setup lang="ts">
/**
 * 登录日志页（PC）
 * - 只读列表：用户名/IP/登录时间/状态(成功·失败 tag)/信息
 * - 数据源 /system/loginlog/list（/auth/login 成功/失败时实时写入，本页只读展示）
 */
import { onMounted, ref } from 'vue'
import { getLoginLogList } from '@/api/system'
import type { LoginLogItem } from '@/types'

/** 登录日志列表数据 */
const list = ref<LoginLogItem[]>([])
/** 列表加载中标志（el-table v-loading） */
const loading = ref(false)

/** 加载登录日志列表 */
async function load() {
  loading.value = true
  try {
    list.value = await getLoginLogList()
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <el-card>
    <el-table v-loading="loading" :data="list" border>
      <el-table-column prop="username" label="用户名" min-width="120" />
      <el-table-column prop="ip" label="IP" width="150" />
      <el-table-column prop="loginTime" label="登录时间" width="190" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'">{{
            row.status === 1 ? '成功' : '失败'
          }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="msg" label="信息" min-width="180" />
    </el-table>
  </el-card>
</template>
