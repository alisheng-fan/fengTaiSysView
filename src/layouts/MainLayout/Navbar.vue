<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import Breadcrumb from './Breadcrumb.vue'

const emit = defineEmits<{ (e: 'toggle'): void }>()
const router = useRouter()
const userStore = useUserStore()

const dropdownVisible = ref(false)

const nickname = computed(() => userStore.userInfo?.nickname ?? userStore.userInfo?.username ?? '')
const avatarSrc = computed(() => userStore.userInfo?.avatar ?? '')
/** 无头像时显示昵称首字符 */
const avatarText = computed(() => (avatarSrc.value ? '' : nickname.value.slice(0, 1)))

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
      <el-dropdown trigger="click" @visible-change="dropdownVisible = $event" @command="handleCommand">
        <div class="user-chip" :class="{ 'is-active': dropdownVisible }">
          <el-avatar :size="28" :src="avatarSrc" class="user-avatar">{{ avatarText }}</el-avatar>
          <span class="user-name">{{ nickname }}</span>
          <el-icon class="user-caret" :class="{ 'is-open': dropdownVisible }"><CaretBottom /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item divided command="logout">
              <el-icon><SwitchButton /></el-icon>退出登录
            </el-dropdown-item>
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
.user-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 3px 10px;
  border-radius: 20px;
  cursor: pointer;
  transition: background-color 0.2s;
}
.user-chip:hover,
.user-chip.is-active {
  background-color: #f2f3f5;
}
.user-avatar {
  flex-shrink: 0;
  background-color: #409eff;
  color: #fff;
  font-size: 14px;
}
.user-name {
  font-size: 14px;
  color: #333;
  white-space: nowrap;
}
.user-caret {
  font-size: 12px;
  color: #999;
  transition: transform 0.2s;
}
.user-caret.is-open {
  transform: rotate(180deg);
}
</style>
