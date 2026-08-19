<script setup lang="ts">
/**
 * 面包屑：由当前路由的 matched 记录生成
 * 取带 meta.title 的路由记录作为层级，首页固定在第一位
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
/** 匹配的带标题路由记录 → { path, title } 列表 */
const items = computed(() =>
  route.matched
    .filter((r) => r.meta?.title)
    .map((r) => ({ path: r.path, title: r.meta?.title as string })),
)
</script>

<template>
  <el-breadcrumb separator="/">
    <el-breadcrumb-item to="/">首页</el-breadcrumb-item>
    <el-breadcrumb-item v-for="item in items" :key="item.path">{{ item.title }}</el-breadcrumb-item>
  </el-breadcrumb>
</template>
