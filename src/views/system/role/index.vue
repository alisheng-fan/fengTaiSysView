<script setup lang="ts">
/**
 * 角色管理页
 * - 角色列表 + 新增/编辑/删除
 * - 分配权限：树形勾选菜单权限，保存时由叶子节点重建 menuIds
 */
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createRole, deleteRole, getAllMenuTree, getRoleList, updateRole } from '@/api/system'
import ProForm from '@/components/ProForm/index.vue'
import type { MenuNode, RoleItem } from '@/types'
import { buildMenuIdsFromLeaves } from '@/utils/menu'

/** 角色列表数据 */
const list = ref<RoleItem[]>([])
/** 列表加载中标志（el-table v-loading） */
const loading = ref(false)
/** 新增/编辑角色弹窗可见性 */
const dialogVisible = ref(false)
/** 当前弹窗是否为编辑模式（true=编辑，false=新增） */
const isEdit = ref(false)
/** 新增/编辑弹窗的表单数据（编辑时整行角色回填） */
const form = ref<Partial<RoleItem>>({})

// ---------- 分配权限弹窗 ----------
/** 分配权限弹窗可见性 */
const permVisible = ref(false)
/** 权限树组件实例（读取勾选节点） */
const permTreeRef = ref()
/** 正在分配权限的角色 */
const currentRole = ref<RoleItem | null>(null)
/** 权限树预勾选的节点 id 列表（仅叶子节点） */
const checkedKeys = ref<string[]>([])
/** 菜单权限树数据 */
const menuTree = ref<MenuNode[]>([])

/** 加载菜单权限树 */
async function loadMenuTree() {
  menuTree.value = await getAllMenuTree()
}

/** 加载角色列表 */
async function load() {
  loading.value = true
  try {
    list.value = await getRoleList()
  } finally {
    loading.value = false
  }
}

/** 打开"新增角色"弹窗，重置表单为默认值 */
function openAdd() {
  isEdit.value = false
  form.value = { name: '', code: '', sort: 1, status: 1, remark: '' }
  dialogVisible.value = true
}

/**
 * 打开"编辑角色"弹窗，回填角色数据
 * @param row 当前行角色数据
 */
function openEdit(row: RoleItem) {
  isEdit.value = true
  form.value = { ...row }
  dialogVisible.value = true
}

/**
 * 新增/编辑弹窗提交回调（由 ProForm submitApi 调用）
 * @param values 弹窗表单提交的字段值
 */
async function handleSubmit(values: Record<string, unknown>) {
  if (isEdit.value) {
    // 编辑：以原角色为基础合并新值（保留 id 等字段）
    await updateRole({ ...(form.value as RoleItem), ...values } as RoleItem)
  } else {
    // 新增：提交表单值创建角色
    await createRole(values as Partial<RoleItem>)
  }
  load()
}

/**
 * 删除角色（二次确认后调用接口）
 * @param row 当前行角色数据
 */
async function handleDelete(row: RoleItem) {
  await ElMessageBox.confirm(`确定删除角色「${row.name}」？`, '提示', { type: 'warning' })
  await deleteRole(row.id)
  ElMessage.success('删除成功')
  load()
}

/**
 * 打开"分配权限"弹窗，预勾选该角色已拥有的叶子权限
 * @param row 当前行角色数据
 */
function openPerm(row: RoleItem) {
  currentRole.value = row
  // 仅用叶子节点 id 预勾选：父节点级联会把整组勾满，显示不符
  const parentIds = new Set(
    menuTree.value.flatMap((n) => (n.children ?? []).map(() => n.id)),
  )
  checkedKeys.value = (row.menuIds ?? []).filter((id) => !parentIds.has(id))
  permVisible.value = true
}

/**
 * 保存权限：取树形勾选的叶子节点，重建父级 menuIds 后更新角色
 */
async function savePerm() {
  if (!currentRole.value) return
  const leafKeys = (permTreeRef.value?.getCheckedKeys(true) ?? []) as string[]
  const menuIds = buildMenuIdsFromLeaves(leafKeys)
  await updateRole({ ...currentRole.value, menuIds })
  ElMessage.success('权限已更新')
  permVisible.value = false
  load()
}

onMounted(() => {
  load()
  loadMenuTree()
})
</script>

<template>
  <el-card>
    <div class="toolbar">
      <el-button v-perm="'system:role:add'" type="primary" @click="openAdd">新增角色</el-button>
    </div>

    <el-table v-loading="loading" :data="list" border>
      <el-table-column prop="name" label="角色名称" min-width="140" />
      <el-table-column prop="code" label="角色编码" width="120" />
      <el-table-column prop="sort" label="排序" width="80" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'">{{ row.status === 1 ? '启用' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" min-width="160" />
      <el-table-column label="操作" width="240">
        <template #default="{ row }">
          <el-button v-perm="'system:role:edit'" type="primary" link @click="openEdit(row)">编辑</el-button>
          <el-button v-perm="'system:role:edit'" type="primary" link @click="openPerm(row)">分配权限</el-button>
          <el-button v-perm="'system:role:delete'" type="danger" link @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <ProForm
      v-model="dialogVisible"
      :title="isEdit ? '编辑角色' : '新增角色'"
      :initial-values="form as Record<string, unknown>"
      :submit-api="handleSubmit"
      :fields="[
        { prop: 'name', label: '角色名称', rules: [{ required: true, message: '请输入角色名称', trigger: 'blur' }] },
        { prop: 'code', label: '角色编码', rules: [{ required: true, message: '请输入角色编码', trigger: 'blur' }] },
        { prop: 'sort', label: '排序', type: 'number' },
        { prop: 'remark', label: '备注', type: 'textarea' },
      ]"
    />

    <el-dialog v-model="permVisible" title="分配权限" width="420px" destroy-on-close>
      <el-tree
        ref="permTreeRef"
        :data="menuTree"
        show-checkbox
        node-key="id"
        :default-checked-keys="checkedKeys"
        :props="{ label: 'title', children: 'children' }"
        @check="checkedKeys = permTreeRef.getCheckedKeys() as string[]"
      />
      <template #footer>
        <el-button @click="permVisible = false">取消</el-button>
        <el-button type="primary" @click="savePerm">保存</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<style scoped>
.toolbar {
  margin-bottom: 12px;
}
</style>
