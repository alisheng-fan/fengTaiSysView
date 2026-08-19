<script setup lang="ts">
/**
 * 顶栏导航：折叠按钮 + 面包屑 + 用户信息下拉（退出登录）
 * 折叠按钮通过 toggle 事件通知父布局切换侧栏
 */
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import Breadcrumb from './Breadcrumb.vue'

/** 向外派发侧栏折叠/展开的切换事件 */
const emit = defineEmits<{ (e: 'toggle'): void }>()
const router = useRouter()
const userStore = useUserStore()

/** 用户下拉可见性（用于高亮样式） */
const dropdownVisible = ref(false)

/** 显示昵称，缺省时回退到用户名 */
const nickname = computed(() => userStore.userInfo?.nickname ?? userStore.userInfo?.username ?? '')
const avatarSrc = computed(() => userStore.userInfo?.avatar ?? '')
/** 无头像时显示昵称首字符 */
const avatarText = computed(() => (avatarSrc.value ? '' : nickname.value.slice(0, 1)))

/**
 * 用户下拉菜单命令处理
 * @param command 命令名（当前仅 logout）
 */
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
