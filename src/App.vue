<script setup lang="ts">
/**
 * 应用根组件
 * - el-config-provider 注入 Element Plus 中文 locale（内置文案如分页、日期均为中文）
 * - 仅渲染路由出口，页面按路由切换
 */
import zhCn from 'element-plus/es/locale/lang/zh-cn'
</script>

<template>
  <el-config-provider :locale="zhCn">
    <router-view />
  </el-config-provider>
</template>
