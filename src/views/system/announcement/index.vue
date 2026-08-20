<script setup lang="ts">
/**
 * 公示公告页（PC）
 * - 公告 CRUD：类型（公示/公告/发布信息）、标题、内容(textarea)、发布时间、关联项目（可选）
 */
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncementList,
  getProjectList,
  updateAnnouncement,
} from '@/api/system'
import ProForm from '@/components/ProForm/index.vue'
import type { AnnouncementItem, ProjectItem } from '@/types'

/** 公告列表数据 */
const list = ref<AnnouncementItem[]>([])
/** 项目列表（用于 项目 列回显与表单下拉） */
const projects = ref<ProjectItem[]>([])
/** 列表加载中标志（el-table v-loading） */
const loading = ref(false)
/** 新增/编辑公告弹窗可见性 */
const dialogVisible = ref(false)
/** 当前弹窗是否为编辑模式（true=编辑，false=新增） */
const isEdit = ref(false)
/** 新增/编辑弹窗的表单数据（编辑时整行公告回填） */
const form = reactive<Partial<AnnouncementItem>>({})

/** 公告类型列 tag 颜色 */
const annTypeTag = { 公示: 'warning', 公告: 'primary', 发布信息: 'success' } as const

/** 项目下拉选项（关联项目可选） */
const projectOptions = computed(() =>
  projects.value.map((p) => ({ label: p.name, value: p.id })),
)

/** 按项目 id 查找项目名称（项目列回显，无匹配显示占位符） */
function projectName(id?: string) {
  return id ? projects.value.find((p) => p.id === id)?.name ?? '-' : '-'
}

/** 加载公告列表 */
async function load() {
  loading.value = true
  try {
    list.value = await getAnnouncementList()
  } finally {
    loading.value = false
  }
}

/** 加载项目列表（下拉/回显用，失败不影响公告列表展示） */
async function loadProjects() {
  try {
    projects.value = await getProjectList()
  } catch {
    projects.value = []
  }
}

/** 打开"发布公告"弹窗，重置表单为默认值 */
function openAdd() {
  isEdit.value = false
  Object.assign(form, { annType: '公示', title: '', content: '', publishDate: '' })
  dialogVisible.value = true
}

/**
 * 打开"编辑公告"弹窗，回填公告数据
 * （种子发布时间含时分秒，截取到日期，与表单 date 控件格式 YYYY-MM-DD 保持一致）
 * @param row 当前行公告数据
 */
function openEdit(row: AnnouncementItem) {
  isEdit.value = true
  Object.assign(form, { ...row, publishDate: row.publishDate?.slice(0, 10) ?? '' })
  dialogVisible.value = true
}

/**
 * 新增/编辑弹窗提交回调（由 ProForm submitApi 调用），成功后刷新列表
 * @param values 弹窗表单提交的字段值
 */
async function handleSubmit(values: Record<string, unknown>) {
  if (isEdit.value) {
    // 编辑：以原公告为基础合并新值（保留 id 等字段）
    await updateAnnouncement({ ...(form as AnnouncementItem), ...values } as AnnouncementItem)
  } else {
    // 新增：提交表单值发布公告
    await createAnnouncement(values as Partial<AnnouncementItem>)
  }
  load()
}

/**
 * 删除公告（二次确认后调用接口），成功后刷新列表
 * @param row 当前行公告数据
 */
async function handleDelete(row: AnnouncementItem) {
  await ElMessageBox.confirm(`确定删除公告「${row.title}」？`, '提示', { type: 'warning' })
  await deleteAnnouncement(row.id)
  ElMessage.success('删除成功')
  load()
}

onMounted(() => {
  load()
  loadProjects()
})
</script>

<template>
  <el-card>
    <div class="toolbar">
      <el-button v-perm="'system:announcement:add'" type="primary" @click="openAdd">发布公告</el-button>
    </div>

    <el-table v-loading="loading" :data="list" border>
      <el-table-column label="类型" width="100">
        <template #default="{ row }">
          <el-tag :type="annTypeTag[row.annType as keyof typeof annTypeTag] ?? 'info'">{{
            row.annType
          }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="title" label="标题" min-width="200" />
      <el-table-column prop="content" label="内容" min-width="280" show-overflow-tooltip />
      <el-table-column prop="publishDate" label="发布时间" width="170" />
      <el-table-column label="项目" min-width="180">
        <template #default="{ row }">{{ projectName(row.projectId) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="150">
        <template #default="{ row }">
          <el-button v-perm="'system:announcement:edit'" type="primary" link @click="openEdit(row)"
            >编辑</el-button
          >
          <el-button v-perm="'system:announcement:delete'" type="danger" link @click="handleDelete(row)"
            >删除</el-button
          >
        </template>
      </el-table-column>
    </el-table>

    <ProForm
      v-model="dialogVisible"
      :title="isEdit ? '编辑公告' : '发布公告'"
      :initial-values="form as Record<string, unknown>"
      :submit-api="handleSubmit"
      :fields="[
        {
          prop: 'annType',
          label: '类型',
          type: 'select',
          options: [
            { label: '公示', value: '公示' },
            { label: '公告', value: '公告' },
            { label: '发布信息', value: '发布信息' },
          ],
        },
        {
          prop: 'title',
          label: '标题',
          rules: [{ required: true, message: '请输入标题', trigger: 'blur' }],
        },
        { prop: 'content', label: '内容', type: 'textarea' },
        { prop: 'publishDate', label: '发布时间', type: 'date' },
        { prop: 'projectId', label: '关联项目', type: 'select', options: projectOptions },
      ]"
    />
  </el-card>
</template>

<style scoped>
.toolbar {
  margin-bottom: 12px;
}
</style>
