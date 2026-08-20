<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const active = computed(() => (route.path.startsWith('/fill') ? 'fill' : 'profile'))
</script>

<template>
  <div class="main-tab">
    <router-view />
    <van-tabbar :model-value="active" route>
      <van-tabbar-item name="fill" to="/fill" icon="edit">填报</van-tabbar-item>
      <van-tabbar-item name="profile" to="/profile" icon="user-o">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>
