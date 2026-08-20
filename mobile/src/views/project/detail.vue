<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
</script>

<template>
  <div>
    <van-nav-bar title="项目详情" left-arrow @click-left="router.back()" />
    <p style="padding: 40px 16px; text-align: center; color: #999;">
      项目 {{ route.params.id }} 详情（Task 5 填充）
    </p>
  </div>
</template>
