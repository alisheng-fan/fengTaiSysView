<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import Breadcrumb from './Breadcrumb.vue'

const emit = defineEmits<{ (e: 'toggle'): void }>()
const router = useRouter()
const userStore = useUserStore()

const nickname = computed(() => userStore.userInfo?.nickname ?? userStore.userInfo?.username ?? '')

async function handleCommand(command: string) {
  if (command === 'logout') {
    await userStore.logout()
    ElMessage.success('已退出登录')
    router.replace('/login')
  }
}
</script>

<template>
  <div class="navbar">
    <el-icon class="collapse-btn" size="20" @click="emit('toggle')">
      <Fold />
    </el-icon>
    <Breadcrumb class="navbar-breadcrumb" />
    <div class="navbar-right">
      <el-dropdown @command="handleCommand">
        <span class="user-name">
          <el-icon><User /></el-icon>
          {{ nickname }}
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="logout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<style scoped>
.navbar {
  display: flex;
  align-items: center;
  height: 50px;
  padding: 0 16px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
}
.collapse-btn {
  cursor: pointer;
}
.navbar-breadcrumb {
  margin-left: 16px;
}
.navbar-right {
  margin-left: auto;
}
.user-name {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  color: #333;
}
</style>
