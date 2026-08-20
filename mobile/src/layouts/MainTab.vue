<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const active = computed(() => {
  if (route.path.startsWith('/monitor')) return 'monitor'
  if (route.path.startsWith('/progress')) return 'progress'
  if (route.path.startsWith('/profile') || route.path.startsWith('/password')) return 'profile'
  return 'home'
})
</script>

<template>
  <div class="main-tab">
    <router-view />
    <van-tabbar :model-value="active" route>
      <van-tabbar-item name="home" to="/home" icon="apps-o">首页</van-tabbar-item>
      <van-tabbar-item name="monitor" to="/monitor" icon="bar-chart-o">监测</van-tabbar-item>
      <van-tabbar-item name="profile" to="/profile" icon="user-o">我的</van-tabbar-item>
      <van-tabbar-item name="progress" to="/progress" icon="clock-o">进度</van-tabbar-item>
    </van-tabbar>
  </div>
</template>
