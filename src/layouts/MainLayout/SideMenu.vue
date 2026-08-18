<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { usePermissionStore } from '@/stores/permission'
import type { MenuNode } from '@/types'

// 组件文件名 SideMenu.vue 在 <script setup> 中可自引用，直接使用 <SideMenu> 递归。
// 根调用（menus 未传）渲染唯一的 <el-menu>；递归调用只渲染菜单项，项从单个
// el-menu 的 provide 中注入 rootMenu。router 模式下点击 index（菜单 path）即导航，
// default-active 用当前路由路径高亮并自动展开父级子菜单。
const props = withDefaults(defineProps<{ menus?: MenuNode[]; collapse?: boolean }>(), {
  menus: undefined,
  collapse: false,
})

const route = useRoute()
const permissionStore = usePermissionStore()

/** 根调用：未传 menus，用权限 store 的顶级菜单 */
const isRoot = computed(() => !props.menus)

/** 未传 menus 时用权限 store 的顶级菜单；递归时传子节点 */
const menus = computed(() => props.menus ?? permissionStore.menus)
</script>

<template>
  <el-menu
    v-if="isRoot"
    :default-active="route.path"
    router
    :collapse="collapse"
    :collapse-transition="false"
  >
    <SideMenu :menus="menus" />
  </el-menu>
  <template v-else>
    <template v-for="menu in menus" :key="menu.id">
      <el-menu-item v-if="!menu.children?.length" :index="menu.path">
        <el-icon v-if="menu.icon"><component :is="menu.icon" /></el-icon>
        <span>{{ menu.title }}</span>
      </el-menu-item>
      <el-sub-menu v-else :index="menu.path">
        <template #title>
          <el-icon v-if="menu.icon"><component :is="menu.icon" /></el-icon>
          <span>{{ menu.title }}</span>
        </template>
        <SideMenu :menus="menu.children" />
      </el-sub-menu>
    </template>
  </template>
</template>

<style scoped>
/* 侧栏深色主题：el-menu 默认白底，需与 aside 的 #1f2d3d 一致 */
.el-menu {
  --el-menu-bg-color: #1f2d3d;
  --el-menu-text-color: #bfcbd9;
  --el-menu-hover-text-color: #fff;
  --el-menu-hover-bg-color: #263445;
  --el-menu-active-color: #409eff;
  --el-menu-active-bg-color: #263445;
  border-right: none;
}
</style>
