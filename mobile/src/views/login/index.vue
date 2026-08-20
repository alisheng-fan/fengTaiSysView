<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showSuccessToast, showToast } from 'vant'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const submitting = ref(false)
const form = reactive({ username: 'user', password: 'user123' })

/** 登录：调 shared login，成功跳 redirect 或首页 */
async function login() {
  if (!form.username || !form.password) {
    showToast('请输入账号和密码')
    return
  }
  submitting.value = true
  try {
    await userStore.login(form.username, form.password)
    showSuccessToast('登录成功')
    router.replace((route.query.redirect as string) || '/')
  } catch {
    // 错误已由请求层 showToast
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-title">业务填报</div>
    <van-form @submit="login">
      <van-cell-group inset>
        <van-field v-model="form.username" label="账号" placeholder="请输入账号" />
        <van-field v-model="form.password" type="password" label="密码" placeholder="请输入密码" />
      </van-cell-group>
      <div style="margin: 16px">
        <van-button round block type="primary" native-type="submit" :loading="submitting">登 录</van-button>
      </div>
    </van-form>
    <div class="login-tip">演示：user / user123（移动端为轻量子集账号）</div>
  </div>
</template>

<style scoped>
.login-page {
  padding-top: 20vh;
}
.login-title {
  margin-bottom: 32px;
  text-align: center;
  font-size: 24px;
  font-weight: 600;
}
.login-tip {
  margin-top: 16px;
  text-align: center;
  font-size: 12px;
  color: #999;
}
</style>
