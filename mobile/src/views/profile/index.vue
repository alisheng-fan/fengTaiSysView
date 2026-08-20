<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showConfirmDialog } from 'vant'
import { getMe } from '@shared/api/auth'
import type { UserInfo } from '@shared/types'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const userInfo = ref<UserInfo | null>(null)

onMounted(async () => {
  try {
    const { userInfo: info } = await getMe()
    userInfo.value = info
  } catch {
    // 错误已提示
  }
})

/** 退出登录：确认后清 token 跳登录 */
async function onLogout() {
  await showConfirmDialog({ title: '提示', message: '确定退出登录？' })
  userStore.logout()
  router.replace('/login')
}
</script>

<template>
  <div class="profile">
    <van-nav-bar title="我的" />
    <van-cell-group inset>
      <van-cell title="昵称" :value="userInfo?.nickname ?? ''" />
      <van-cell title="账号" :value="userInfo?.username ?? ''" />
      <van-cell title="角色" :value="(userInfo?.roles ?? []).join('、')" />
      <van-cell title="修改密码" is-link to="/password" />
    </van-cell-group>
    <div style="margin: 32px 16px">
      <van-button round block type="danger" @click="onLogout">退出登录</van-button>
    </div>
  </div>
</template>
