<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { getDeptList, getNodeList, getPhaseList } from '@shared/api/system'
import { useFillStore } from '@/stores/fill'
import type { DeptItem, NodeItem, PhaseItem } from '@shared/types'

const route = useRoute()
const router = useRouter()
const fillStore = useFillStore()
const projectId = route.params.id as string

const allNodes = ref<NodeItem[]>([])
const phases = ref<PhaseItem[]>([])
const depts = ref<DeptItem[]>([])
const loading = ref(false)

/** 流程节点：getNodeList 按项目过滤 ∩ 角色可见节点（RBAC 可见性），分组时组内按 step 排序 */
const nodes = computed(() => {
  const visible = new Set(fillStore.nodes.map((n) => n.id))
  return allNodes.value.filter((n) => n.projectId === projectId && visible.has(n.id))
})

const phaseMap = computed(() => new Map(phases.value.map((p) => [p.id, p])))

/** 扁平化部门树 → id→name 映射（经办科室显示用） */
const depNameMap = computed(() => {
  const map = new Map<string, string>()
  const walk = (list: DeptItem[]) => {
    for (const d of list) {
      map.set(d.id, d.name)
      if (d.children?.length) walk(d.children)
    }
  }
  walk(depts.value)
  return map
})

/** 经办科室名：无 dutyDepId 返回空（label 省略该段），有但查不到返回 '-' */
function depName(n: NodeItem): string {
  return n.dutyDepId ? (depNameMap.value.get(n.dutyDepId) ?? '-') : ''
}

/** 超时：未完成且截止时间已过（与 mock buildOverview 一致） */
function isOverdue(n: NodeItem): boolean {
  return n.status !== 2 && !!n.deadline && n.deadline < new Date().toISOString().slice(0, 10)
}

/** 节点卡片 label：日期 · 状态 · 经办科室 · 截止日期（无数据字段省略或 '-'） */
function nodeLabel(n: NodeItem): string {
  const parts = [n.date ?? '', n.status === 1 ? '进行中' : '已完成']
  if (n.dutyDepId) parts.push(`经办 ${depName(n)}`)
  if (n.deadline) parts.push(`截止 ${n.deadline}`)
  return parts.join(' · ')
}

interface PhaseGroup {
  phase: PhaseItem | null // null = 未分类
  nodes: NodeItem[]
}

/** 按阶段分组：组间按 phase.sortNo 排序，组内按 step 排序，无 phaseId/查不到阶段的节点归入「未分类」放最后 */
const phaseGroups = computed<PhaseGroup[]>(() => {
  const byPhase = new Map<string, NodeItem[]>()
  const uncategorized: NodeItem[] = []
  for (const n of nodes.value) {
    if (n.phaseId && phaseMap.value.has(n.phaseId)) {
      const arr = byPhase.get(n.phaseId) ?? []
      arr.push(n)
      byPhase.set(n.phaseId, arr)
    } else {
      uncategorized.push(n)
    }
  }
  const groups: PhaseGroup[] = [...byPhase.entries()].map(([id, ns]) => ({
    phase: phaseMap.value.get(id) ?? null,
    nodes: [...ns].sort((a, b) => a.step - b.step),
  }))
  groups.sort((a, b) => (a.phase?.sortNo ?? Number.MAX_SAFE_INTEGER) - (b.phase?.sortNo ?? Number.MAX_SAFE_INTEGER))
  if (uncategorized.length) groups.push({ phase: null, nodes: uncategorized.sort((a, b) => a.step - b.step) })
  return groups
})

onMounted(async () => {
  loading.value = true
  try {
    if (!fillStore.nodes.length) await fillStore.loadNodes()
    // 节点列表必须成功渲染；阶段/部门请求失败时降级（phases 空 → 全归「未分类」），不阻塞节点展示
    allNodes.value = await getNodeList()
    const [, p, d] = await Promise.allSettled([getPhaseList(), getDeptList()])
    phases.value = p.status === 'fulfilled' ? p.value : []
    depts.value = d.status === 'fulfilled' ? d.value : []
  } catch {
    showToast('加载失败')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="project-detail">
    <van-nav-bar title="项目流程" left-arrow @click-left="router.back()" />
    <van-loading v-if="loading" class="page-loading">加载中...</van-loading>
    <van-empty v-else-if="!nodes.length" description="暂无流程节点" />
    <template v-else>
      <van-cell-group
        v-for="(g, i) in phaseGroups"
        :key="g.phase?.id ?? `uncategorized-${i}`"
        :title="`${g.phase?.name ?? '未分类'}（${g.nodes.length}）`"
        inset
      >
        <van-cell
          v-for="n in g.nodes"
          :key="n.id"
          :title="`${n.step}. ${n.name}`"
          :label="nodeLabel(n)"
          is-link
          @click="router.push(`/project/${projectId}/node/${n.id}`)"
        >
          <template #value>
            <van-tag v-if="isOverdue(n)" type="danger">已超时</van-tag>
            <van-tag v-else :type="n.status === 1 ? 'primary' : 'default'">{{ n.status === 1 ? '进行中' : '已完成' }}</van-tag>
          </template>
        </van-cell>
      </van-cell-group>
    </template>
    <div style="margin: 16px; display: flex; flex-direction: column; gap: 12px">
      <van-button round block plain type="warning" @click="router.push(`/project/${projectId}/issues`)">问题协助记录</van-button>
      <div style="display: flex; gap: 12px">
        <van-button round block plain type="primary" @click="router.push(`/project/${projectId}/announcement`)">公示公告</van-button>
        <van-button round block plain type="primary" @click="router.push(`/project/${projectId}/notice`)">通知提醒</van-button>
      </div>
    </div>
  </div>
</template>
