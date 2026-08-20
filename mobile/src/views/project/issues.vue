<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showSuccessToast, showToast } from 'vant'
import { createIssue, getIssueList, updateIssue } from '@shared/api/system'
import type { IssueItem, IssueStatus } from '@shared/types'

const route = useRoute()
const router = useRouter()
const projectId = route.params.id as string
const nodeId = (route.query.nodeId as string) ?? ''
const nodeName = (route.query.nodeName as string) ?? ''

const list = ref<IssueItem[]>([])
const loading = ref(false)
const showForm = ref(false)
const form = reactive({ dept: '', description: '', status: 'discuss' as IssueStatus })

const statusLabel: Record<IssueStatus, string> = {
  solved: '已解决', partial: '部分解决', discuss: '再商议', shelved: '搁置',
}
const statusTag: Record<IssueStatus, 'success' | 'warning' | 'primary' | 'default'> = {
  solved: 'success', partial: 'warning', discuss: 'primary', shelved: 'default',
}
/** 状态流转顺序：点击状态标签按此循环到下一态 */
const statusOrder: IssueStatus[] = ['discuss', 'partial', 'solved', 'shelved']

/** 点击状态标签：流转到下一状态并持久化（updateIssue） */
async function cycleStatus(item: IssueItem) {
  const next = statusOrder[(statusOrder.indexOf(item.status) + 1) % statusOrder.length]
  try {
    await updateIssue({ ...item, status: next })
    item.status = next
  } catch {
    // 错误已提示
  }
}

async function load() {
  loading.value = true
  try {
    list.value = await getIssueList(projectId)
  } finally {
    loading.value = false
  }
}

/** 打开上报弹窗 */
function openAdd() {
  Object.assign(form, { dept: '', description: '', status: 'discuss' })
  showForm.value = true
}

/** 提交问题 */
async function submit() {
  if (!form.description.trim()) {
    showToast('请填写问题描述')
    return
  }
  try {
    await createIssue({
      projectId,
      nodeId,
      nodeName,
      dept: form.dept || '规划实施科',
      description: form.description,
      status: form.status,
    })
    showSuccessToast('上报成功')
    showForm.value = false
    await load()
  } catch {
    // 错误已提示
  }
}

onMounted(load)
</script>

<template>
  <div class="issues">
    <van-nav-bar title="问题协助记录" left-arrow @click-left="router.back()">
      <template #right>
        <van-button size="small" type="primary" @click="openAdd">上报问题</van-button>
      </template>
    </van-nav-bar>

    <van-loading v-if="loading" class="page-loading">加载中...</van-loading>
    <van-empty v-else-if="!list.length" description="暂无问题" />
    <van-cell-group v-else inset>
      <van-cell
        v-for="item in list"
        :key="item.id"
        :title="item.nodeName || '项目问题'"
        :label="`${item.dept} · ${item.createTime}\n${item.description}`"
      >
        <template #value>
          <van-tag class="status-tag" :type="statusTag[item.status]" @click="cycleStatus(item)">{{ statusLabel[item.status] }}</van-tag>
        </template>
      </van-cell>
    </van-cell-group>

    <van-popup v-model:show="showForm" position="bottom" round style="height: 60%">
      <van-nav-bar title="上报问题" @click-left="showForm = false" />
      <van-form @submit="submit">
        <van-cell-group inset>
          <van-field v-model="form.dept" label="提出部门" placeholder="请输入部门" />
          <van-field v-model="form.description" label="问题描述" type="textarea" rows="4" autosize placeholder="请输入问题描述" />
          <van-field label="状态">
            <template #input>
              <van-radio-group v-model="form.status">
                <van-radio v-for="(label, s) in statusLabel" :key="s" :name="s">{{ label }}</van-radio>
              </van-radio-group>
            </template>
          </van-field>
        </van-cell-group>
        <div style="margin: 16px">
          <van-button round block type="primary" native-type="submit">提交</van-button>
        </div>
      </van-form>
    </van-popup>
  </div>
</template>

<style scoped>
.status-tag {
  cursor: pointer;
}
</style>
