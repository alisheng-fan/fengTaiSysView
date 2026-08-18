<script setup lang="ts">
import { ref } from 'vue'
import SideMenu from './SideMenu.vue'
import Navbar from './Navbar.vue'
import TagsView from './TagsView.vue'

const collapsed = ref(false)
</script>

<template>
  <el-container class="main-layout">
    <el-aside :width="collapsed ? '64px' : '220px'" class="main-aside">
      <div class="logo">fengtaiSysView</div>
      <SideMenu :collapse="collapsed" />
    </el-aside>
    <el-container>
      <el-header class="main-header">
        <Navbar @toggle="collapsed = !collapsed" />
        <TagsView />
      </el-header>
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.main-layout {
  height: 100%;
}
.main-aside {
  background: #1f2d3d;
  transition: width 0.2s;
  overflow-x: hidden;
}
.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 50px;
  color: #fff;
  font-weight: 600;
  font-size: 16px;
  white-space: nowrap;
}
.main-header {
  height: auto;
  padding: 0;
}
.main-content {
  background: #f0f2f5;
  overflow-y: auto;
}
</style>
