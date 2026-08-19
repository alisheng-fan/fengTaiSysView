<script setup lang="ts">
/**
 * 404 页面
 * - 路由未匹配时的兜底页，提供返回首页入口
 */
</script>

<template>
  <div class="not-found">
    <h1>404</h1>
    <p>页面不存在</p>
    <router-link to="/">返回首页</router-link>
  </div>
</template>

<style scoped>
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
}
.not-found h1 {
  font-size: 80px;
  color: #409eff;
}
</style>
