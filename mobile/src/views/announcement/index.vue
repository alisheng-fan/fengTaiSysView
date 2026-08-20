<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getAnnouncementList } from '@shared/api/system'
import type { AnnouncementItem } from '@shared/types'

const route = useRoute()
const router = useRouter()
const projectId = route.params.id as string

const list = ref<AnnouncementItem[]>([])
const loading = ref(false)
const detailVisible = ref(false)
const current = ref<AnnouncementItem | null>(null)

async function load() {
  loading.value = true
  try {
    list.value = await getAnnouncementList(projectId)
  } finally {
    loading.value = false
  }
}

/** 点击公告：弹底部弹层显示完整内容 + 发布单位/时间 */
function showDetail(item: AnnouncementItem) {
  current.value = item
  detailVisible.value = true
}

onMounted(load)
</script>

<template>
  <div class="announcement">
    <van-nav-bar title="公示公告" left-arrow @click-left="router.back()" />

    <van-loading v-if="loading" class="page-loading">加载中...</van-loading>
    <van-empty v-else-if="!list.length" description="暂无公告" />
    <van-cell-group v-else inset>
      <van-cell
        v-for="item in list"
        :key="item.id"
        :title="`[${item.annType}] ${item.title}`"
        :label="item.publishDate"
        is-link
        @click="showDetail(item)"
      />
    </van-cell-group>

    <van-popup v-model:show="detailVisible" position="bottom" round style="height: 60%">
      <van-nav-bar
        :title="current ? `[${current.annType}] ${current.title}` : ''"
        @click-left="detailVisible = false"
      />
      <div class="detail-body">
        <div class="detail-content">{{ current?.content }}</div>
        <div class="detail-meta">
          <span v-if="current?.source">发布单位：{{ current.source }}</span>
          <span>发布时间：{{ current?.publishDate }}</span>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<style scoped>
.detail-body {
  padding: 16px;
}
.detail-content {
  font-size: 15px;
  line-height: 1.7;
  color: #323233;
  word-break: break-all;
}
.detail-meta {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: #969799;
}
</style>
