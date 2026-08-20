<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div>
    <van-nav-bar title="节点填报" left-arrow @click-left="router.back()" />
    <p style="padding: 40px 16px; text-align: center; color: #999;">
      节点填报（Task 5 填充）
    </p>
  </div>
</template>
