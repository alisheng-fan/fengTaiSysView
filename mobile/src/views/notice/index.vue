<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showSuccessToast, showToast } from 'vant'
import { getNoticeList, readNotice } from '@shared/api/system'
import type { NoticeItem } from '@shared/types'

const route = useRoute()
const router = useRouter()
const projectId = route.params.id as string

const list = ref<NoticeItem[]>([])
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    list.value = await getNoticeList(projectId)
  } finally {
    loading.value = false
  }
}

/** 点击通知：未读先标记已读，再跳对应节点填报页 */
async function onClick(item: NoticeItem) {
  if (!item.read) {
    try {
      await readNotice(item.id)
      item.read = true
    } catch {
      // 错误已提示
    }
  }
  if (item.nodeId) {
    router.push(`/project/${projectId}/node/${item.nodeId}`)
  }
}

/** 全部已读：遍历未读通知标记已读（本地更新，不整表刷新） */
async function readAll() {
  const unread = list.value.filter((n) => !n.read)
  if (!unread.length) {
    showToast('暂无未读通知')
    return
  }
  try {
    await Promise.all(unread.map((n) => readNotice(n.id)))
    unread.forEach((n) => (n.read = true))
    showSuccessToast('已全部标记已读')
  } catch {
    // 错误已提示
  }
}

onMounted(load)
</script>

<template>
  <div class="notice">
    <van-nav-bar title="通知提醒" left-arrow @click-left="router.back()">
      <template #right>
        <span class="read-all" @click="readAll">全部已读</span>
      </template>
    </van-nav-bar>

    <van-loading v-if="loading" class="page-loading">加载中...</van-loading>
    <van-empty v-else-if="!list.length" description="暂无通知" />
    <van-cell-group v-else inset>
      <van-cell v-for="item in list" :key="item.id" is-link @click="onClick(item)">
        <template #title>
          <span class="notice-title">
            <span v-if="!item.read" class="unread-dot" />
            <span :class="{ 'unread-text': !item.read }">{{ item.title }}</span>
          </span>
        </template>
        <template #label>
          <div class="notice-content">{{ item.content }}</div>
        </template>
        <template #value>
          <span class="notice-time">{{ item.createTime }}</span>
        </template>
      </van-cell>
    </van-cell-group>
  </div>
</template>

<style scoped>
.read-all {
  font-size: 14px;
  color: #1989fa;
}
.notice-title {
  display: flex;
  align-items: center;
  line-height: 22px;
}
.unread-dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  margin-right: 6px;
  border-radius: 50%;
  background: #ee0a24;
}
.unread-text {
  font-weight: 600;
}
.notice-content {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}
.notice-time {
  font-size: 12px;
  color: #969799;
}
</style>
