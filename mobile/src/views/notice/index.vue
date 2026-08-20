<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="notice">
    <van-nav-bar title="通知提醒" left-arrow @click-left="router.back()" />
    <div class="placeholder">建设中</div>
  </div>
</template>

<style scoped>
.placeholder {
  padding: 48px 0;
  text-align: center;
  color: #969799;
}
</style>
