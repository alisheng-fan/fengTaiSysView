<script setup lang="ts">
/**
 * 通知提醒页（PC）
 * - 通知列表（标题/内容/类型 tag/已读状态/时间）：未读高亮 + 每行"标记已读"
 */
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getNoticeList, readNotice } from '@/api/system'
import type { NoticeItem } from '@/types'

/** 通知列表数据 */
const list = ref<NoticeItem[]>([])
/** 列表加载中标志（el-table v-loading） */
const loading = ref(false)

/** 通知类型 tag：REMIND 提醒(warning) / NOTICE 通知(primary) */
const noticeTypeTag = { REMIND: 'warning', NOTICE: 'primary' } as const

/**
 * 标记通知已读（调 /notice/read 后就地更新行状态，避免整表刷新闪烁）
 * @param row 当前行通知数据
 */
async function handleRead(row: NoticeItem) {
  if (row.read) return
  await readNotice(row.id)
  row.read = true
  ElMessage.success('已标记已读')
}

/** 未读行高亮样式（el-table row-class-name 回调） */
function rowClassName({ row }: { row: NoticeItem }) {
  return row.read ? '' : 'notice-unread'
}

/** 加载通知列表 */
async function load() {
  loading.value = true
  try {
    list.value = await getNoticeList()
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <el-card>
    <el-table v-loading="loading" :data="list" :row-class-name="rowClassName" border>
      <el-table-column label="类型" width="90">
        <template #default="{ row }">
          <el-tag :type="noticeTypeTag[row.noticeType as keyof typeof noticeTypeTag] ?? 'info'">{{
            row.noticeType === 'REMIND' ? '提醒' : '通知'
          }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="title" label="标题" min-width="200" />
      <el-table-column prop="content" label="内容" min-width="300" show-overflow-tooltip />
      <el-table-column label="已读状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.read ? 'info' : 'danger'" size="small">{{
            row.read ? '已读' : '未读'
          }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="时间" width="170" />
      <el-table-column label="操作" width="110">
        <template #default="{ row }">
          <el-button v-if="!row.read" type="primary" link @click="handleRead(row)">标记已读</el-button>
          <span v-else>-</span>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<style scoped>
/* 未读行高亮（row-class-name 作用在 el-table 行上，需 :deep 穿透） */
:deep(.notice-unread) {
  font-weight: 600;
  color: var(--el-color-danger);
}
</style>
